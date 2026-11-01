import { test, expect } from '@playwright/test'

// Real-browser checks for the client runtime: hydration, event binding, re-render morphing,
// client navigation, fragment links, and history. The unit tests cover these against a DOM
// shim; this suite exists because a shim cannot catch what a browser does differently.

test.beforeEach(async ({ page }) => {
  page.problems = []
  page.on('pageerror', (e) => page.problems.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error' || /Content Security Policy|violat/i.test(m.text())) page.problems.push(`console ${m.type()}: ${m.text()}`)
  })
})
test.afterEach(async ({ page }) => {
  expect(page.problems, 'no page errors, CSP violations or console errors').toEqual([])
})

const here = (page) => { const u = new URL(page.url()); return u.pathname + u.search + u.hash }

test('a hydrated page responds to events, once per click', async ({ page }) => {
  await page.goto('/')
  await page.click('#inc')
  await expect(page.locator('#inc')).toHaveText('count 1')
  await page.click('#inc')
  await expect(page.locator('#inc')).toHaveText('count 2')
})

test('text typed into a data-preserve textarea survives a re-render', async ({ page }) => {
  await page.goto('/')
  await page.fill('#note', 'half-written thought')
  await page.click('#inc')                                   // re-renders the view
  await expect(page.locator('#inc')).toHaveText('count 1')
  await expect(page.locator('#note')).toHaveValue('half-written thought')
})

test('an async action runs its lifecycle and shows the result', async ({ page }) => {
  await page.goto('/')
  await page.click('#save')
  await expect(page.locator('#status')).toHaveText('saved')
})

test('the skip link is hidden until focused, then visible', async ({ page }) => {
  await page.goto('/')
  const link = page.locator('.pulse-skip-link')
  await expect(link).toHaveCount(1)
  const boxHidden = await link.boundingBox()
  expect(boxHidden === null || boxHidden.y + boxHidden.height <= 1 || boxHidden.x + boxHidden.width <= 1, 'off-screen until focused').toBeTruthy()
  await page.keyboard.press('Tab')
  await expect(link).toBeFocused()
  const box = await link.boundingBox()
  expect(box.y).toBeGreaterThanOrEqual(0)
  await expect(link).toBeVisible()
})

test('a page with its own skip link keeps one: the framework link is hidden, and Tab lands on a visible link', async ({ page }) => {
  await page.goto('/static')
  const links = page.locator('.pulse-skip-link')
  await expect(links).toHaveCount(2) // the framework link in <body>, and the page's own inside the root
  await expect(links.filter({ visible: true })).toHaveCount(1) // only the page's own link is rendered (off-screen until focused); the framework one is display:none
  await expect(page.locator('body > .pulse-skip-link')).toHaveCSS('display', 'none')
  await page.keyboard.press('Tab')
  const focused = page.locator('.pulse-skip-link:focus')
  await expect(focused).toHaveCount(1)
  await expect(focused).toBeVisible()
  expect(await focused.evaluate((el) => el.closest('#pulse-root') !== null), 'the focused link is the page\'s own').toBe(true)
})

test('using the skip link does not refetch the page and moves focus to the content', async ({ page }) => {
  await page.goto('/')
  let navFetches = 0
  page.on('request', (r) => { if (r.headers()['x-pulse-navigate']) navFetches++ })
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect.poll(() => here(page)).toBe('/#main-content')
  expect(navFetches).toBe(0)
})

test('client navigation swaps the page without a full load, and handlers fire once', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => { window.__sameDocument = true })
  await page.click('#to-about')
  await expect(page.locator('h1')).toHaveText('About')
  expect(await page.evaluate(() => window.__sameDocument), 'same document, not a reload').toBe(true)
  await page.click('#inc')
  await expect(page.locator('#inc')).toHaveText('count 1')   // 2 would mean the previous mount still listens
  await page.click('#back-home')
  await expect(page.locator('h1')).toHaveText('Home')
  await page.click('#inc')
  await expect(page.locator('#inc')).toHaveText('count 1')
})

test('an in-page fragment link jumps without refetching; a cross-page one lands on its target', async ({ page }) => {
  await page.goto('/?q=pulse')
  expect(here(page), 'the landing URL keeps its query string').toBe('/?q=pulse')
  await page.click('#to-here')
  await expect.poll(() => here(page)).toBe('/?q=pulse#details')
  await expect(page.locator('#details')).toBeFocused()
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)

  await page.click('#to-about-part')
  await expect(page.locator('h1')).toHaveText('About')
  await expect(page.locator('#part-two')).toBeFocused()
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById('part-two').getBoundingClientRect().top))).toBeLessThan(40)
})

test('back and forward restore pages and fragments, and a fragment-only step does not refetch', async ({ page }) => {
  await page.goto('/')
  let navFetches = 0
  page.on('request', (r) => { if (r.headers()['x-pulse-navigate']) navFetches++ })
  await page.click('#to-here')                                // /#details (browser-handled entry)
  await page.click('#to-about')                               // /about
  await expect(page.locator('h1')).toHaveText('About')
  await page.goBack()
  await expect(page.locator('h1')).toHaveText('Home')
  expect(here(page)).toBe('/#details')
  const fetchesBeforeFragmentStep = navFetches
  await page.goBack()                                         // /#details -> /: same page, fragment only
  expect(here(page)).toBe('/')
  await page.waitForTimeout(300)                              // a (wrong) refetch would have started by now
  expect(navFetches, 'stepping between two fragments of the page already shown must not refetch it').toBe(fetchesBeforeFragmentStep)
  await page.goForward()
  await page.goForward()
  await expect(page.locator('h1')).toHaveText('About')
})

test('navigating to a page with no client bundle leaves no live handlers from the page before', async ({ page }) => {
  await page.goto('/')
  await page.click('#to-static')
  await expect(page.locator('h1')).toHaveText('Static')
  // The previous page's mount must be released when a page with no bundle replaces it. If it is
  // not, its handler answers this click and re-renders the old page's view over this one.
  await page.click('#stale-probe')
  await page.waitForTimeout(200)
  await expect(page.locator('h1'), 'the Static page is still showing').toHaveText('Static')
  await page.click('#back-home')
  await expect(page.locator('h1')).toHaveText('Home')
  await page.click('#inc')
  await expect(page.locator('#inc')).toHaveText('count 1')
})
