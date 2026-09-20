/**
 * Pulse — Spec review (shared logic)
 *
 * The single source of truth behind pulse_review (MCP tool, for an agent)
 * and `pulse review` (CLI command, for a human). Both modes — quick and
 * full — return plain data here; formatting is split into an agent-facing
 * formatter (instructional framing: "you are now a reviewer, fix every
 * issue") and a human-facing one (a plain report), since the MCP tool's
 * existing output talks directly to an agent in a way that reads wrong at
 * a terminal.
 */

import fs   from 'fs'
import path from 'path'
import os   from 'os'
import { execFileSync } from 'child_process'

// ---------------------------------------------------------------------------
// Quick mode — lightweight structural checks, no validator subprocess, no
// checklist. Same regex checks pulse_review({ quick: true }) has always run.
// ---------------------------------------------------------------------------

/**
 * @param {string} source - spec file source text
 * @param {string|null} file - absolute path to the spec file, or null (content-only mode)
 * @returns {Promise<{ issues: string[], warnings: string[], confirms: string[] }>}
 */
export async function runQuickReview(source, file) {
  const issues = []
  const warnings = []

  let renderedHtml = ''
  if (file) {
    try {
      const mod  = await import(`${file}?quick=${Date.now()}`)
      const spec = mod.default
      if (spec && typeof spec.view === 'function') {
        renderedHtml = spec.view(spec.state || {}, {})
      }
    } catch { /* ignore — server data dependency */ }
  }

  if (renderedHtml) {
    if (!/<main[^>]*id=["']?main-content/.test(renderedHtml))
      issues.push('✗ Missing `<main id="main-content">` landmark')
    if (/<input[^>]*data-event/.test(renderedHtml))
      issues.push('✗ `data-event` on `<input>` — destroys focus on every keystroke, use FormData in onStart instead')
    if (/(className|htmlFor|onClick)=/.test(renderedHtml))
      issues.push('✗ React patterns found (className / htmlFor / onClick) — use class, for, data-event')
    if (/tabindex=["']?([1-9]\d*)/.test(renderedHtml))
      issues.push('✗ Positive tabindex found — remove, reorder DOM instead')
    const rawNavInSource = (source.match(/<nav[\s>]/gi) || []).length
    if (rawNavInSource > 0)
      issues.push(`✗ Raw <nav> tag in spec source — nav() renders <nav> internally; wrapping it in another <nav> creates duplicate landmarks that fail Lighthouse accessibility. Remove the outer <nav>.`)
    const viewBlockStripped = renderedHtml
      .replace(/href=["']#[^"']*["']/g, 'href="#"')
      .replace(/id=["'][^"']*["']/g, 'id=""')
      .replace(/style="([^"]*)"/g, (_, v) => `style="${v.replace(/--[a-zA-Z][^:]*:[^;"]*/g, '')}"`)
    if (/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/.test(viewBlockStripped))
      warnings.push('⚠ Possible hex colour in rendered HTML — use var(--ui-*) tokens')

    if (!/component.free|creative\s+override/i.test(source)) {
      if (/<[^>]+class="[^"]*\bhero\b/.test(renderedHtml) && !source.includes('hero('))
        warnings.push('⚠ `.hero` class in HTML but no `hero()` component — use the component or declare creative override')
      if (/<[^>]+class="[^"]*\bcard\b/.test(renderedHtml) && !source.includes('card('))
        warnings.push('⚠ `.card` class in HTML but no `card()` component — use the component or declare creative override')
    }
  }

  const hasActionsBlock = /^\s{0,4}actions\s*:/m.test(source)
  if (hasActionsBlock && !source.includes('onError:'))
    issues.push('✗ Action missing `onError` — required, will throw at runtime')
  if (hasActionsBlock && !source.includes('onSuccess:'))
    issues.push('✗ Action missing `onSuccess` — required')
  if (source.includes('hydrate:'))
    issues.push('✗ `hydrate` is set manually — remove it, the framework sets it automatically')
  if (/meta\s*:\s*async/.test(source))
    issues.push('✗ `meta` is an async function — `meta` must be a plain object; make individual fields async instead')
  if (/state\.modalOpen|modalOpen\s*:/.test(source))
    issues.push('✗ `modalOpen`-style state found — never conditionally render a `<dialog>`; always render it unconditionally and open it with `data-dialog-open`')
  if (/\bsubmit\s*:\s*async/.test(source) && /<form[^>]*method=["']POST["']/i.test(source) && !source.includes('server.csrf'))
    issues.push('✗ `<form method="POST">` on a page with `submit` but no `${server.csrf}` in the form — POSTs will get 403')
  if (/_storeUpdate\s*:\s*(true|false|\d|['"`])/.test(source))
    issues.push('✗ `_storeUpdate` must be an object merged into the store, e.g. `_storeUpdate: { settings: { theme } }` — not a primitive')

  const confirms = []
  if (renderedHtml) {
    confirms.push(/<main[^>]*id=["']?main-content/.test(renderedHtml) ? '✓ `<main id="main-content">` landmark present' : null)
    const rawNavInSource = (source.match(/<nav[\s>]/gi) || []).length
    if (rawNavInSource === 0) confirms.push('✓ No raw <nav> in spec source — nav() component handles landmarks correctly')
    const headings = [...renderedHtml.matchAll(/<h([1-6])[^>]*>/g)].map(m => parseInt(m[1]))
    if (headings.length > 0) {
      const orderOk = headings.every((h, i) => i === 0 || h <= headings[i - 1] + 1)
      confirms.push(orderOk ? `✓ Heading order correct (${headings.map(h => `h${h}`).join(' → ')})` : `⚠ Heading order may be skipping levels (${headings.map(h => `h${h}`).join(' → ')})`)
    }
    const interactiveWithoutLabel = [...renderedHtml.matchAll(/<button(?![^>]*aria-label)[^>]*>\s*<\/button>/g)]
    confirms.push(interactiveWithoutLabel.length === 0 ? '✓ No empty buttons without aria-label detected' : `⚠ ${interactiveWithoutLabel.length} button(s) appear empty — check aria-label`)
    const dataEvents = [...renderedHtml.matchAll(/data-event=/g)].length
    if (dataEvents > 0) confirms.push(`✓ ${dataEvents} data-event binding(s) found`)
    const creativeOverride = /component.free|creative\s+override/i.test(source)
    if (creativeOverride) confirms.push('✓ Creative override declared — component pattern checks are advisory')
  }

  return { issues, warnings, confirms: confirms.filter(Boolean) }
}

export function formatQuickReview(result, { agentFacing = false } = {}) {
  const { issues, warnings, confirms } = result
  const lines = ['## Quick review\n']

  if (confirms.length > 0) {
    lines.push('### Structural checks\n')
    for (const c of confirms) lines.push(c)
    lines.push('')
  }

  if (issues.length === 0 && warnings.length === 0) {
    lines.push(agentFacing
      ? '✓ No issues found. Run `pulse_validate` next, then `/verify`.'
      : '✓ No issues found. Run `pulse validate` next, then a full review.')
  } else {
    if (issues.length) {
      lines.push('### Fix before proceeding\n')
      for (const i of issues) lines.push(i)
      lines.push('')
    }
    if (warnings.length) {
      lines.push('### Warnings (check these)\n')
      for (const w of warnings) lines.push(w)
      lines.push('')
    }
    lines.push(agentFacing
      ? '---\nFix issues, then run `pulse_validate` → `/verify --quick`.'
      : '---\nFix issues, then run `pulse validate` again.')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Full mode — validator subprocess + rendered HTML + mechanized checklist.
// ---------------------------------------------------------------------------

/**
 * @param {string} source
 * @param {string|null} file - absolute path, or null for content-only mode
 * @returns {Promise<{
 *   validationResult: string,
 *   renderedHtml: string,
 *   renderNote: string,
 *   autoChecks: string[],
 * }>}
 */
export async function runFullReview(source, file) {
  // Run the validator in a child process (same as pulse_validate/pulse validate)
  let validationResult = '(could not run validator)'
  const validatorScript = new URL('../mcp/validate-worker.js', import.meta.url).pathname
  if (file) {
    try {
      validationResult = execFileSync(process.execPath, [validatorScript, file], {
        timeout: 10_000,
        encoding: 'utf8',
      }).trim()
    } catch (err) {
      validationResult = err.stdout?.trim() || err.message
    }
  } else {
    const tmpFile = path.join(os.tmpdir(), `pulse-review-${Date.now()}.js`)
    fs.writeFileSync(tmpFile, source, 'utf8')
    try {
      validationResult = execFileSync(process.execPath, [validatorScript, tmpFile], {
        timeout: 10_000,
        encoding: 'utf8',
      }).trim()
    } catch (err) {
      validationResult = err.stdout?.trim() || err.message
    } finally {
      try { fs.unlinkSync(tmpFile) } catch {}
    }
  }

  // Try to render the view with initial state
  let renderedHtml = ''
  let renderNote = ''
  try {
    const mod  = await import(`${file}?review=${Date.now()}`)
    const spec = mod.default
    if (spec && typeof spec.view === 'function') {
      renderedHtml = spec.view(spec.state || {}, {})
    } else if (spec && typeof spec.view === 'object') {
      const segments = Object.entries(spec.view)
        .map(([k, fn]) => `<!-- segment: ${k} -->\n${typeof fn === 'function' ? fn(spec.state || {}, {}) : ''}`)
        .join('\n')
      renderedHtml = segments
      renderNote = '(streamed spec — segments rendered individually)'
    }
  } catch {
    renderNote = '(view could not be rendered — may depend on server data)'
  }

  const autoChecks = []

  if (renderedHtml) {
    const posTabindex = /tabindex=["']?([1-9]\d*)/.test(renderedHtml)
    autoChecks.push(posTabindex ? '✗ **Positive tabindex found** — remove tabindex > 0, reorder DOM instead' : '✓ No positive tabindex')

    const dataEventInput = /<input[^>]*data-event/.test(renderedHtml)
    autoChecks.push(dataEventInput ? '✗ **data-event on <input>** — this destroys focus on every keystroke' : '✓ No data-event on text inputs')

    const reactPatterns = /(className|htmlFor|onClick)=/.test(renderedHtml)
    autoChecks.push(reactPatterns ? '✗ **React patterns found** — use class, for, data-event instead' : '✓ No React patterns (className/htmlFor/onClick)')

    const htmlNoSvg = renderedHtml
      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
      .replace(/data:[^"']+/g, '')
      .replace(/<[^>]+aria-hidden=["']true["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '')
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/u
    const hasEmoji = emojiRegex.test(htmlNoSvg)
    autoChecks.push(hasEmoji ? '⚠ **Emoji in HTML** — use icon components or aria-label instead (verify: may be intentional icon)' : '✓ No emoji in view HTML')

    const hasMain = /<main[^>]*id=["']?main-content/.test(renderedHtml)
    autoChecks.push(hasMain ? '✓ <main id="main-content"> present' : '✗ **Missing main landmark** — add <main id="main-content">')
  }

  const viewBlock = source.slice(source.indexOf('view:'))
  const viewBlockStripped = viewBlock
    .replace(/href=["']#[^"']*["']/g, 'href="#"')
    .replace(/id=["'][^"']*["']/g, 'id=""')
    .replace(/\$\{[^}]*\}/g, '${…}')
  const hexInView = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/.test(viewBlockStripped)
  autoChecks.push(hexInView
    ? '⚠ **Possible hex colour in view** — use var(--ui-*) tokens only'
    : '✓ No obvious hex colours in view')

  if (file) {
    const testFile = file.replace(/\.js$/, '.test.js')
    let xssNote = ''
    if (fs.existsSync(testFile)) {
      const testSrc = fs.readFileSync(testFile, 'utf8')
      const hasXssAssertion = testSrc.includes('<script>') || testSrc.includes('xss') || testSrc.includes('script>alert')
      xssNote = hasXssAssertion
        ? '✓ XSS test assertion present'
        : '⚠ **No XSS test found** — test file exists but has no `<script>alert` assertion. Add at least one test that passes a `\'<script>alert(1)</script>\'` string as a user-controlled input and asserts it does not appear unescaped in the output.'
    } else {
      xssNote = '○ No test file found — create one at ' + path.basename(testFile)
    }
    autoChecks.push(xssNote)
  }

  const hasModalOpenState = /state\.modalOpen|modalOpen\s*:/.test(source)
  autoChecks.push(hasModalOpenState
    ? '✗ **`modalOpen`-style state found** — never conditionally render a `<dialog>`; always render it unconditionally and open it with `data-dialog-open`'
    : '✓ No conditional-modal state pattern found')

  const hasSubmit = /\bsubmit\s*:\s*async/.test(source)
  if (hasSubmit) {
    const hasPostForm = /<form[^>]*method=["']POST["']/i.test(source)
    const hasCsrfToken = source.includes('server.csrf')
    autoChecks.push(hasPostForm && !hasCsrfToken
      ? '✗ **`<form method="POST">` missing `${server.csrf}`** — POSTs will get 403. (Not applicable if `csrf: false` is deliberately set for a self-authenticated endpoint.)'
      : '✓ CSRF token present in POST form (or no POST form found)')
  }

  const badStoreUpdate = /_storeUpdate\s*:\s*(true|false|\d|['"`])/.test(source)
  autoChecks.push(badStoreUpdate
    ? '✗ **`_storeUpdate` is not an object** — it must be a partial store object, e.g. `_storeUpdate: { settings: { theme } }`'
    : '✓ No malformed `_storeUpdate` found')

  const creativeOverride = /component.free|creative\s+override|raw\s+HTML\s+throughout/i.test(source)
  autoChecks.push(creativeOverride
    ? '⚡ **Creative override declared** — component pattern checks are advisory only. Lighthouse 100 on Accessibility, Best Practices, and SEO (desktop + mobile) plus CLS 0.00 is the pass bar.'
    : '○ No creative override declared — component checks apply')

  return { validationResult, renderedHtml, renderNote, autoChecks }
}

// The static checklist text — invariant reference material, not a mechanized
// check. Shared verbatim by both formatters; only the surrounding framing differs.
const CHECKLIST_MD = `### Structure
- [ ] \`route\` is set explicitly — not left to auto-discovery
- [ ] \`hydrate\` is NOT set manually — the framework injects it automatically. Remove it if present.
- [ ] \`state\` shape is consistent — no fields that flip between null/string/boolean
- [ ] \`meta.title\` is meaningful and unique to this page
- [ ] \`meta.description\` is a real description, not "Built with Pulse"

### Mutations & actions
- [ ] Every mutation returns a plain partial object — no side effects, no fetch, no DOM access
- [ ] \`constraints\` are used for bounds instead of conditional logic inside mutations
- [ ] \`disabled\` in the view matches the constraint bounds — but check: is it redundant with the constraint, or does it serve a UX purpose?
- [ ] Actions read user input from FormData in \`onStart\`, not from mirrored state
- [ ] \`onStart\` sets a loading status, \`onSuccess\`/\`onError\` resolve it
- [ ] A single \`status\` field is used instead of multiple boolean flags

### Components & HTML
- [ ] Components from the UI library are used — no hand-written \`<button>\`, \`<input>\`, \`<table>\` etc where a component exists
- [ ] **Component patterns check** — grep the rendered HTML for these class names:
  - \`.hero\`, \`.-hero\`, \`__hero\` → should use \`hero()\` component
  - \`.card\`, \`.product-card\`, \`.service-card\` → should use \`card()\` component
  - Any two-column image + text layout → should use \`media()\` component
  - \`.feature\`, \`.feature-card\` → should use \`feature()\` component

  **Before flagging a pattern match**, ask: *can the \`hero()\` (or relevant) component actually reproduce this layout?* If the design uses full-viewport height, custom gradient glows, clamp-scaled display type, asymmetric layout, or other features the component doesn't support — that is a **creative override**, not a violation. Check the auto-checked items above: if "creative override declared" is shown, these checks are advisory only and Lighthouse is the pass bar.

  If no creative override is declared and a component *could* reproduce the design, refactor to use it. Custom utility classes on top of components are fine (\`hero({ ... })\` + override CSS) — but do not write the entire structure from scratch when the component supports the layout.

- [ ] **Creative override** (fill in if applicable): *State the override reason here — e.g. "full-viewport gradient hero not achievable with hero() component"*. Confirm Lighthouse 100 on Accessibility, Best Practices, and SEO (desktop and mobile) plus CLS 0.00 before closing the review.
- [ ] No \`data-event\` on text inputs — this destroys focus on every keystroke
- [ ] No \`className\`, \`htmlFor\`, \`onClick=\`, or other React patterns
- [ ] No hardcoded hex colours in view — only \`var(--ui-*)\` tokens (anchor \`href="#id"\` values are fine — those are not colours)
- [ ] No emoji in view HTML (decorative emoji without accessible text is a fail; emoji with \`aria-label\` or inside \`<span aria-hidden="true">\` is acceptable)
- [ ] **CTA must be wrapped in section/container** — grep the rendered HTML for \`<div class="ui-cta"\`. If it appears as a direct child of \`<main>\` or \`<div id="app">\` without a section or container wrapper, wrap it. CTA has no padding of its own.

### Accessibility
- [ ] \`<main id="main-content">\` is present
- [ ] Icon-only buttons have \`aria-label\`
- [ ] \`aria-live\` and \`aria-label\` are NOT on the same element
- [ ] Heading hierarchy is correct — no skipped levels, starts at h1
- [ ] Disabled state uses the \`disabled\` attribute, not just CSS or opacity
- [ ] **Keyboard focusability** — every element carrying \`data-event\`, \`data-store-event\`, \`data-dialog-open\`, or \`data-dialog-close\` is either a natively interactive element (\`button\`, \`a\`, \`input\`, \`select\`, \`textarea\`, \`summary\`) or has \`tabindex="0"\`. Scan the rendered HTML above — a \`<div>\`, \`<span>\`, \`<li>\`, or any other non-interactive tag with one of these attributes is a keyboard accessibility failure. Prefer \`<button>\` over a div + tabindex.
- [ ] **Purpose** — every interactive element has a clear accessible name. Buttons have visible text or \`aria-label\`. Links use descriptive text — flag generic labels ("click here", "here", "read more", "more"). Form inputs have an associated \`<label for="id">\` or \`aria-label\` — \`placeholder\` alone is not a label (it disappears on focus and is not read by all screen readers).
- [ ] **State** — interactive elements communicate their current state via ARIA:
  - Toggle controls (open/close, show/hide, expand/collapse) have \`aria-expanded="true|false"\` or \`aria-pressed="true|false"\`
  - While an action is running, the trigger button has \`aria-busy="true"\` or its visible label changes (e.g. "Saving…") — a spinner alone is not sufficient
  - Active navigation items have \`aria-current="page"\`
  - Selected items in a list, tab set, or option group have \`aria-selected="true"\`
- [ ] **Tab order** — scan the rendered HTML for these failures:
  - No \`tabindex\` value greater than 0. \`tabindex="1"\` and above override the natural DOM order and almost always create a broken, unpredictable tab sequence. The only valid values are \`0\` (add to natural order) and \`-1\` (remove from order). If you find a positive tabindex, remove it and reorder the DOM instead.
  - Off-screen or visually hidden interactive content is removed from the tab order. Elements that are hidden via CSS alone (e.g. \`opacity:0\`, \`visibility:hidden\` without \`display:none\`, off-canvas menus, collapsed panels) but remain in the DOM must have \`tabindex="-1"\` or \`inert\` so keyboard users cannot tab into invisible controls.
  - DOM order matches the visual reading order. When CSS flexbox \`order\` or grid placement is used to visually reposition elements, the tab sequence follows the DOM — not the visual layout. Ensure the DOM is authored in the order a sighted user would read and interact with the page.

### Defensive coding
- [ ] Any \`fetch\` in actions or server fetchers checks \`res.ok\` before calling \`.json()\`
- [ ] Fetch errors use the safe pattern — NOT \`throw new Error(await res.text())\` which exposes raw HTML in toasts:
  \`\`\`js
  if (!res.ok) {
    let message = \`Request failed: \${res.status}\`
    try { const j = await res.json(); message = j.message || j.error || message } catch {}
    throw new Error(message)
  }
  \`\`\`
- [ ] Optional chaining used for any data from external sources
- [ ] URL params validated before use
- [ ] \`onViewError\` defined if the view could crash on bad or missing data`

/**
 * Format the full review result.
 *
 * @param {{ validationResult, renderedHtml, renderNote, autoChecks }} result
 * @param {{ source: string, file: string|null, agentFacing?: boolean }} opts
 */
export function formatFullReview(result, { source, file, agentFacing = false }) {
  const { validationResult, renderNote, autoChecks } = result

  const intro = agentFacing
    ? `# Pulse Code Review\n\nYou are now a **senior code reviewer**. Read the spec, find every problem, and fix them all before reporting back to the user.`
    : `# Pulse Code Review\n\nSpec: ${file || '(content-only mode)'}`

  const specDump = validationResult.includes('✓') ? '' : `\n## Spec source (validation failed — showing for debugging)\n\n\`\`\`js\n${source}\n\`\`\`\n`
  const renderErrorDump = renderNote.includes('could not') ? `\n## Render error\n\n${renderNote}\n\n\`\`\`js\n${source}\n\`\`\`\n` : ''

  const workOrder = agentFacing
    ? 'Work through every item. Fix anything that fails. Refer to the spec source at ' + file + ' as needed — do not ask me to paste it.'
    : 'Work through every item and fix anything that fails.'

  const closing = agentFacing
    ? '\nFix every issue you find. Then confirm what was changed.\n\n**After confirming fixes: you are back in builder mode. Continue to the verification workflow — navigate to the page in the browser, take a screenshot, run Lighthouse desktop audit, run Lighthouse mobile audit. Do not stop at the review.**'
    : '\nFix every issue found above, then re-run this review.'

  return `${intro}

---

## Validator output

${validationResult}
${specDump}${renderErrorDump}
---

## Auto-checked items

${autoChecks.join('\n')}

---

## Review checklist

${workOrder}

${CHECKLIST_MD}
${closing}`
}
