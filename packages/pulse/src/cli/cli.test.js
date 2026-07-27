/**
 * Pulse — CLI module smoke tests
 *
 * Imports every CLI module to catch syntax errors and bad exports.
 * These modules aren't exercised by unit tests but are loaded at runtime
 * by the dev server and `pulse new` — a parse error breaks both.
 *
 * run: node src/cli/cli.test.js
 */

import { existsSync, readFileSync } from 'fs'
import path from 'path'

let passed = 0
let failed = 0

function test(label, fn) {
  try {
    fn()
    console.log(`  ✓ ${label}`)
    passed++
  } catch (e) {
    console.log(`  ✗ ${label}`)
    console.log(`    ${e.message}`)
    failed++
  }
}

// ---------------------------------------------------------------------------

console.log('\nCLI module imports\n')

const modules = await Promise.allSettled([
  import('./scaffold.js'),
  import('./discover.js'),
])

const names = ['scaffold.js', 'discover.js']

modules.forEach((result, i) => {
  test(`${names[i]} parses and imports without error`, () => {
    if (result.status === 'rejected') {
      throw new Error(result.reason?.message || String(result.reason))
    }
  })
})

test('scaffold exports a scaffold function', () => {
  const mod = modules[0].value
  if (typeof mod?.scaffold !== 'function') {
    throw new Error(`Expected scaffold export to be a function, got ${typeof mod?.scaffold}`)
  }
})

test('discover exports a loadPages function', () => {
  const mod = modules[1].value
  if (typeof mod?.loadPages !== 'function') {
    throw new Error(`Expected loadPages export to be a function, got ${typeof mod?.loadPages}`)
  }
})

test('discover: discoverPages skips .test.js files', () => {
  const { discoverPages } = modules[1].value
  // discoverPages on this very directory must not include cli.test.js
  const pages = discoverPages(new URL('../../', import.meta.url).pathname)
  const testFiles = pages.filter(p => p.filePath.endsWith('.test.js'))
  if (testFiles.length > 0) {
    throw new Error(`discoverPages included test files: ${testFiles.map(p => p.filePath).join(', ')}`)
  }
})

test('discover: nested pages get unique names (collision prevention)', () => {
  const { deriveRoute } = modules[1].value
  // Two files with the same basename in different subdirs must derive different routes
  const r1 = deriveRoute('products.js')
  const r2 = deriveRoute('api/products.js')
  if (r1 === r2) {
    throw new Error(`Route collision: both products.js and api/products.js derived '${r1}'`)
  }
})

// ---------------------------------------------------------------------------
// Skill source files

console.log('\nCopilot skill source files\n')

const skillsDir = new URL('../agent/skills', import.meta.url).pathname
const requiredSkills = ['build-page', 'verify', 'new-doc-page']

for (const skill of requiredSkills) {
  const skillMd = path.join(skillsDir, skill, 'SKILL.md')

  test(`${skill}/SKILL.md exists`, () => {
    if (!existsSync(skillMd)) throw new Error(`Missing: ${skillMd}`)
  })

  test(`${skill}/SKILL.md has valid frontmatter`, () => {
    const content = readFileSync(skillMd, 'utf8')
    if (!content.startsWith('---\n')) throw new Error('Missing opening YAML frontmatter ---')
    const end = content.indexOf('\n---\n', 4)
    if (end === -1) throw new Error('Missing closing YAML frontmatter ---')
    const frontmatter = content.slice(4, end)
    if (!frontmatter.includes('name:'))        throw new Error('Frontmatter missing name:')
    if (!frontmatter.includes('description:')) throw new Error('Frontmatter missing description:')
  })
}

// ---------------------------------------------------------------------------
// Store auto-discovery (loadStore)
// ---------------------------------------------------------------------------
// Regression: pulse.store.js was documented but never loaded by the CLI —
// dev/start servers got no store, so spec.store keys were always empty.

console.log('\nStore auto-discovery\n')

{
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { loadStore } = await import('./discover.js')

  const dir = mkdtempSync(path.join(tmpdir(), 'pulse-store-'))
  try {
    // No store file → null
    const none = await loadStore(dir)
    test('loadStore returns null when pulse.store.js is absent', () => {
      if (none !== null) throw new Error(`Expected null, got ${JSON.stringify(none)}`)
    })

    // Valid store file → definition with browser hydrate path set
    writeFileSync(path.join(dir, 'pulse.store.js'),
      `export default { state: { basket: [] }, server: { nav: async () => ['Home'] }, mutations: { add: (s, i) => ({ basket: [...s.basket, i] }) } }`)
    const def = await loadStore(dir)
    test('loadStore loads pulse.store.js and sets the browser hydrate path', () => {
      if (!def)                                     throw new Error('Expected a store definition')
      if (def.hydrate !== '/pulse.store.js')        throw new Error(`Expected hydrate /pulse.store.js, got ${def.hydrate}`)
      if (typeof def.server?.nav !== 'function')    throw new Error('server fetchers missing')
      if (typeof def.mutations?.add !== 'function') throw new Error('mutations missing')
      if (!Array.isArray(def.state?.basket))        throw new Error('state missing')
    })

    // Cache-busted re-import returns the edited module (dev hot reload)
    writeFileSync(path.join(dir, 'pulse.store.js'),
      `export default { state: { basket: [], promo: true }, mutations: {} }`)
    const fresh = await loadStore(dir, Date.now())
    test('loadStore cache-busts for hot reload', () => {
      if (fresh?.state?.promo !== true) throw new Error('Expected fresh store definition after edit')
    })

    // Bad export → clear error
    writeFileSync(path.join(dir, 'pulse.store.js'), `export default 42`)
    let threw = false
    try { await loadStore(dir, Date.now() + 1) } catch (e) { threw = /store object/.test(e.message) }
    test('loadStore throws a clear error for a non-object export', () => {
      if (!threw) throw new Error('Expected a descriptive throw for bad default export')
    })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// ---------------------------------------------------------------------------
// Coverage-check exemptions
// ---------------------------------------------------------------------------
// Regression: the stop hook blocked every session on uncovered guard/submit/
// sitemap/meta lines (server-only, untestable), and c8 ignore comments were
// not honoured because Node's built-in coverage ignores them.

console.log('\nCoverage-check exemptions\n')

{
  const { computeExemptLines } = await import('../agent/coverage-check.js')

  const src = [
    /*  1 */ `export default {`,
    /*  2 */ `  route: '/x',`,
    /*  3 */ `  guard: async (ctx) => {`,
    /*  4 */ `    if (!ctx.cookies.session) return { redirect: '/login' }`,
    /*  5 */ `  },`,
    /*  6 */ `  submit: async (ctx) => {`,
    /*  7 */ `    return { redirect: '/done' }`,
    /*  8 */ `  },`,
    /*  9 */ `  sitemap: async () => ['/a'],`,
    /* 10 */ `  meta: {`,
    /* 11 */ `    title: async (ctx) => fetchTitle(ctx),`,
    /* 12 */ `  },`,
    /* 13 */ `  view: (state) => state.n,`,
    /* 14 */ `  helpers: () => {`,
    /* 15 */ `    /* c8 ignore next 2 */`,
    /* 16 */ `    impossibleBranch()`,
    /* 17 */ `    alsoImpossible()`,
    /* 18 */ `    normalCode()`,
    /* 19 */ `  },`,
    /* 20 */ `}`,
  ].join('\n')

  const exempt = computeExemptLines(src)

  test('guard, submit, sitemap, and meta blocks are exempt', () => {
    for (const n of [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      if (!exempt.has(n)) throw new Error(`Expected line ${n} to be exempt`)
    }
  })

  test('view and ordinary helper code are NOT exempt', () => {
    for (const n of [13, 18]) {
      if (exempt.has(n)) throw new Error(`Line ${n} must not be exempt`)
    }
  })

  test('c8 ignore next N exempts exactly the following N lines', () => {
    for (const n of [15, 16, 17]) {
      if (!exempt.has(n)) throw new Error(`Expected line ${n} to be exempt via c8 ignore`)
    }
    if (exempt.has(18)) throw new Error('Line 18 is beyond the ignore count and must not be exempt')
  })

  test('c8 ignore start/stop exempts the whole range', () => {
    const ranged = computeExemptLines([
      `const a = 1`,            // 1
      `/* c8 ignore start */`,  // 2
      `untestable1()`,          // 3
      `untestable2()`,          // 4
      `/* c8 ignore stop */`,   // 5
      `const b = 2`,            // 6
    ].join('\n'))
    for (const n of [2, 3, 4, 5]) {
      if (!ranged.has(n)) throw new Error(`Expected line ${n} exempt in range`)
    }
    if (ranged.has(6)) throw new Error('Line after stop must not be exempt')
  })
}

// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
