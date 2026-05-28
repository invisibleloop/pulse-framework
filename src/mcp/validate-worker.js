#!/usr/bin/env node
/**
 * validate-worker.js
 *
 * Runs spec validation in an isolated child process so a hanging import
 * cannot block the MCP server. Called by validateContent() in server.js.
 *
 * Usage: node validate-worker.js <tmpFilePath>
 * Exits with stdout containing the validation result text.
 */

import { validateSpec } from '../spec/schema.js'

const tmpFile = process.argv[2]
if (!tmpFile) { process.stdout.write('Invalid: no file path provided'); process.exit(0) }

let mod
try {
  mod = await import(tmpFile)
} catch (err) {
  // Give a targeted message for common import-resolution failures
  const msg = err.message || ''
  if (msg.includes('Cannot find package') || msg.includes('Cannot find module') || msg.includes('ERR_MODULE_NOT_FOUND')) {
    const bare = msg.match(/Cannot find (?:package|module) '([^']+)'/)?.[1]
    if (bare && !bare.startsWith('.') && !bare.startsWith('/') && !bare.startsWith('@invisibleloop/pulse')) {
      process.stdout.write(
        `Invalid: spec has an unresolvable import — \`${bare}\` is not a valid module specifier.\n` +
        `  • Use relative paths for project-local files: \`'../components/nav.js'\`\n` +
        `  • Use \`'@invisibleloop/pulse/ui'\` for Pulse components\n` +
        `  • Bare paths like \`'src/...' \` or \`'components/...'\` are not valid — they are not packages`
      )
    } else {
      process.stdout.write(`Invalid: could not import spec — ${msg.split('\n')[0]}`)
    }
  } else {
    process.stdout.write(`Invalid: could not parse — ${err.message}`)
  }
  process.exit(0)
}

const spec = mod.default
if (!spec || typeof spec !== 'object') {
  process.stdout.write('Invalid: file must export a default spec object')
  process.exit(0)
}

const { valid, errors, warnings: schemaWarnings } = validateSpec(spec)
if (!valid) {
  process.stdout.write('Invalid:\n' + errors.map(e => `  — ${e}`).join('\n'))
  process.exit(0)
}

// Render the view and run additional HTML checks
const warnings = [...schemaWarnings]

// meta.theme missing — a page without theme set will use the user's system preference,
// which can produce unexpected dark/light rendering for spec authors who built for one mode.
if (!spec.meta?.theme) {
  warnings.push('meta.theme is not set — the page will follow the user\'s system colour-scheme preference. Add meta: { theme: \'light\' } or meta: { theme: \'dark\' } to lock the appearance. Most Pulse pages should set this explicitly.')
}

// Raw-response specs (contentType + render) produce non-HTML output —
// skip all view rendering and HTML-specific checks for them.
const isRawResponse = typeof spec.render === 'function' ||
  (spec.contentType && !spec.contentType.startsWith('text/html'))

if (isRawResponse) {
  process.stdout.write(warnings.length > 0
    ? 'Valid ✓ — but fix these issues:\n' + warnings.map(w => `  ⚠ ${w}`).join('\n')
    : 'Valid ✓')
  process.exit(0)
}

try {
  // Pass null for every declared server key so views that check `=== null`
  // degrade gracefully (showing error branches) rather than throwing on
  // `undefined.someProperty` when the real fetchers haven't run.
  const serverMock = spec.server && typeof spec.server === 'object'
    ? Object.fromEntries(Object.keys(spec.server).map(k => [k, null]))
    : {}
  const html = typeof spec.view === 'function'
    ? spec.view(spec.state || {}, serverMock)
    : ''

  // Heading hierarchy — headings must not skip levels
  const levels = [...html.matchAll(/<h([1-6])[\s>]/gi)].map(m => parseInt(m[1], 10))
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      warnings.push(`Heading order: h${levels[i - 1]} → h${levels[i]} skips a level (Lighthouse will flag this)`)
    }
  }
  if (levels.length > 0 && levels[0] !== 1) {
    warnings.push(`Heading order: page starts with h${levels[0]}, expected h1`)
  }

  // Missing main landmark
  if (!/id=["']main-content["']/.test(html)) {
    warnings.push('Missing <main id="main-content"> — required for accessibility and Lighthouse landmark audit')
  }

  // aria-live + aria-label on the same element — aria-label suppresses live region announcements
  const tagPattern = /<[a-z][^>]*>/gi
  let tagMatch
  while ((tagMatch = tagPattern.exec(html)) !== null) {
    const tag = tagMatch[0]
    if (/aria-live/i.test(tag) && /aria-label/i.test(tag)) {
      warnings.push('aria-live and aria-label on the same element — aria-label suppresses live region announcements in some screen readers. Remove aria-label and let the content speak for itself')
      break
    }
  }

  // data-event on text inputs — causes focus loss on every keystroke
  const inputTags = [...html.matchAll(/<input[^>]+>/gi)].map(m => m[0])
  for (const tag of inputTags) {
    const isText = !/type=["'](checkbox|radio|range|color|submit|button|reset|file|hidden)/i.test(tag)
    if (isText && /data-event/i.test(tag)) {
      warnings.push('data-event on a text input causes focus loss on every keystroke — use data-action on the wrapping <form> and read values from FormData in action.onStart instead')
      break
    }
  }

  // Unknown u-* utility classes — catch invented classes that have no CSS definition
  const KNOWN_UTILS = new Set(['u-absolute','u-bg-accent','u-bg-surface','u-bg-surface2','u-block','u-border','u-border-b','u-border-t','u-flex','u-flex-1','u-flex-col','u-flex-wrap','u-font-bold','u-font-medium','u-font-normal','u-font-semibold','u-gap-1','u-gap-2','u-gap-3','u-gap-4','u-gap-5','u-gap-6','u-gap-8','u-hidden','u-inline','u-inline-block','u-items-center','u-items-end','u-items-start','u-items-stretch','u-justify-between','u-justify-center','u-justify-end','u-justify-start','u-leading-loose','u-leading-normal','u-leading-relaxed','u-leading-snug','u-leading-tight','u-max-w-lg','u-max-w-md','u-max-w-prose','u-max-w-sm','u-max-w-xl','u-max-w-xs','u-mb-0','u-mb-1','u-mb-10','u-mb-12','u-mb-16','u-mb-2','u-mb-3','u-mb-4','u-mb-5','u-mb-6','u-mb-8','u-ml-auto','u-mr-auto','u-mt-0','u-mt-1','u-mt-10','u-mt-12','u-mt-16','u-mt-2','u-mt-3','u-mt-4','u-mt-5','u-mt-6','u-mt-8','u-mx-auto','u-opacity-50','u-opacity-75','u-overflow-auto','u-overflow-hidden','u-p-0','u-p-1','u-p-2','u-p-3','u-p-4','u-p-5','u-p-6','u-p-8','u-px-0','u-px-2','u-px-3','u-px-4','u-px-5','u-px-6','u-px-8','u-py-0','u-py-2','u-py-3','u-py-4','u-py-5','u-py-6','u-py-8','u-relative','u-rounded','u-rounded-full','u-rounded-lg','u-rounded-md','u-rounded-xl','u-shrink-0','u-tabular-nums','u-text-2xl','u-text-3xl','u-text-4xl','u-text-accent','u-text-balance','u-text-base','u-text-blue','u-text-center','u-text-default','u-text-green','u-text-left','u-text-lg','u-text-muted','u-text-red','u-text-right','u-text-sm','u-text-xl','u-text-xs','u-text-yellow','u-w-auto','u-w-full'])
  const usedUtils = new Set([...html.matchAll(/\bu-([\w-]+)/g)].map(m => 'u-' + m[1]))
  const unknownUtils = [...usedUtils].filter(c => !KNOWN_UTILS.has(c))
  if (unknownUtils.length) {
    warnings.push(`Unknown utility class${unknownUtils.length > 1 ? 'es' : ''}: ${unknownUtils.join(', ')} — these have no CSS definition and will have no effect. Check the guide for the available u-* classes, or use layout components (container, section, grid, stack, cluster) instead.`)
  }

  // input[type="file"] used directly — fileUpload() component should be used instead
  if (inputTags.some(tag => /type=["']file["']/i.test(tag))) {
    warnings.push('input[type="file"] detected — use the fileUpload() component instead. It provides the drag-and-drop zone, correct styling, and pulse-ui.js integration. import { fileUpload } from \'@invisibleloop/pulse/ui\'')
  }

  // Unescaped apostrophes — only flag inside attribute values (attr='it's wrong'),
  // not in text content (it's fine in body text). Match: attr='...apostrophe...'
  // Pattern: an attribute assignment with single-quote delimiter containing a second single quote
  if (/\s[\w-]+=\s*'[^'<>]*'[^']*'/.test(html)) {
    warnings.push('Possible unescaped apostrophe in an HTML attribute value — use &apos; or &#39; or switch to double-quoted attributes')
  }

  // Inline <style> blocks in view — blocked by Pulse CSP nonce policy
  if (/<style[\s>]/i.test(html)) {
    warnings.push('Inline <style> block detected in view — Pulse\'s CSP (style-src with nonces) will silently block these styles at runtime. Move styles to public/app.css instead.')
  }
} catch { /* view may depend on server data — skip HTML checks */ }

if (warnings.length > 0) {
  process.stdout.write('Valid ✓ — but fix these issues:\n' + warnings.map(w => `  ⚠ ${w}`).join('\n'))
} else {
  process.stdout.write('Valid ✓')
}
