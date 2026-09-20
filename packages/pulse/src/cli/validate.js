/**
 * Pulse — Spec validation (shared logic)
 *
 * The single source of truth for validating a Pulse spec's content. Used by
 * both pulse_validate (the MCP tool, for an agent) and `pulse validate` (the
 * CLI command, for a human running it directly). Neither wraps the other —
 * they both call validateContent() here, so the two paths can never drift
 * the way the checklist/workflow docs did before this file existed.
 *
 * Returns plain data — { valid, output, sourceWarnings } — with no MCP
 * protocol coupling (no text()-wrapping) and no audience-specific framing
 * (no "ask the user for design approval" — that's for the MCP tool's own
 * wrapper to add, since a human at the terminal doesn't need it phrased at
 * them that way).
 */

import fs   from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const PROP_ALIASES = [
  { component: 'nav()',    wrong: 'brand',       correct: 'logo',    note: 'The nav logo is set with the `logo` prop, not `brand`.' },
  { component: 'nav()',    wrong: 'actions',     correct: 'action',  note: 'nav() takes a single `action` string (HTML), not an array.' },
  { component: 'footer()', wrong: 'items',       correct: 'links',   note: 'footer() top-level links use `links: [{ label, href }]`, not `items`.' },
  { component: 'footer()', wrong: 'nav',         correct: 'links',   note: 'footer() links prop is `links`, not `nav`.' },
  { component: 'input()',  wrong: 'autocomplete', correct: 'attrs: { autocomplete }', note: 'HTML attributes not in the component API (autocomplete, min, max, step, pattern, inputmode, etc.) go inside the `attrs` object: input({ attrs: { autocomplete: "email" } }).' },
  { component: 'input()',  wrong: 'maxlength',   correct: 'attrs: { maxlength }',     note: 'HTML attributes go inside `attrs`: input({ attrs: { maxlength: "100" } }).' },
  { component: 'input()',  wrong: 'minlength',   correct: 'attrs: { minlength }',     note: 'HTML attributes go inside `attrs`: input({ attrs: { minlength: "2" } }).' },
  { component: 'input()',  wrong: 'pattern',     correct: 'attrs: { pattern }',       note: 'HTML attributes go inside `attrs`: input({ attrs: { pattern: "[0-9]+" } }).' },
]

const EXTERNAL_IMG_HOSTS = [
  {
    pattern: /https?:\/\/images\.unsplash\.com/,
    host:    'images.unsplash.com',
    entry:   'https://images.unsplash.com',
    cookieWarning: true,
    name: 'Unsplash',
  },
  {
    pattern: /https?:\/\/(?:fastly\.)?picsum\.photos/,
    host:    'picsum.photos',
    entry:   'https://picsum.photos https://fastly.picsum.photos',
    cookieWarning: false,
    name: 'picsum',
  },
  {
    pattern: /https?:\/\/res\.cloudinary\.com/,
    host:    'res.cloudinary.com',
    entry:   'https://res.cloudinary.com',
    cookieWarning: true,
    name: 'Cloudinary',
  },
  {
    pattern: /https?:\/\/cdn\.shopify\.com/,
    host:    'cdn.shopify.com',
    entry:   'https://cdn.shopify.com',
    cookieWarning: false,
    name: 'Shopify CDN',
  },
]

/**
 * Validate spec source content against the schema plus a set of source-level
 * structural checks (wrong component prop names, un-CSP'd external image hosts).
 *
 * @param {string} content - the spec file's source text
 * @param {string} root - project root, used to find pulse.config.js
 * @param {string} [tmpDir] - directory to write the temp validation file into,
 *   so relative imports in the spec resolve correctly. Defaults to <root>/src/pages.
 * @returns {Promise<{ valid: boolean, timedOut: boolean, schemaOutput: string, sourceWarnings: string[] }>}
 */
export async function validateContent(content, root, tmpDir = null) {
  tmpDir = tmpDir || path.join(root, 'src', 'pages')

  const sourceWarnings = []

  // Component prop alias checks — flag known wrong prop names
  for (const { component, wrong, correct, note } of PROP_ALIASES) {
    const fnName = component.replace('()', '')
    const re = new RegExp(`${fnName}\\s*\\(\\s*\\{([^}]*)\\b${wrong}\\s*:`, 'g')
    let m
    while ((m = re.exec(content)) !== null) {
      // attrs: { … } is the correct placement for HTML attributes — a match
      // that falls inside an open attrs block is the recommended pattern,
      // not a mistake.
      if (/attrs\s*:\s*\{[^}]*$/.test(m[1])) continue
      sourceWarnings.push(`"${wrong}" is not a recognised prop for ${component} — did you mean "${correct}"? ${note}`)
      break
    }
  }

  // External image URL check — warn if the spec references an external image
  // host not whitelisted in pulse.config.js's CSP img-src.
  const configPath = path.join(root, 'pulse.config.js')
  let configImgSrc = ''
  if (fs.existsSync(configPath)) {
    try { configImgSrc = fs.readFileSync(configPath, 'utf8') } catch { /* ignore */ }
  }
  for (const { pattern, host, entry, cookieWarning, name } of EXTERNAL_IMG_HOSTS) {
    // Config match is by HOST, not full URL — CSP sources are valid without a
    // scheme, so requiring https?:// in the config caused false positives.
    if (pattern.test(content) && !configImgSrc.includes(host)) {
      const cookieNote = cookieWarning
        ? `\n  ⚠ ${name} sets tracking cookies that fail Lighthouse Best Practices regardless of CSP. For production, download images to public/images/ instead of linking to ${name} directly.`
        : ''
      sourceWarnings.push(
        `External image host detected (${name}). Add it to csp.img-src in pulse.config.js before running Lighthouse:\n` +
        `    csp: { 'img-src': ['${entry}'] }\n` +
        `  Without this, images will be blocked and Lighthouse Best Practices will fail.${cookieNote}`
      )
    }
  }

  fs.mkdirSync(tmpDir, { recursive: true })
  const tmpFile = path.join(tmpDir, `.pulse-validate-${Date.now()}.mjs`)
  try {
    fs.writeFileSync(tmpFile, content, 'utf8')

    const validatorScript = new URL('../mcp/validate-worker.js', import.meta.url).pathname
    let schemaOutput
    let timedOut = false
    try {
      schemaOutput = execFileSync(process.execPath, [validatorScript, tmpFile], {
        timeout: 10_000,
        encoding: 'utf8',
      }).trim()
    } catch (err) {
      timedOut = err.killed || err.signal === 'SIGTERM'
      schemaOutput = timedOut
        ? 'Invalid: validation timed out — spec may have a hanging import or infinite loop'
        : `Invalid: could not parse — ${err.stdout || err.message}`
    }

    const valid = schemaOutput.startsWith('Valid ✓') && !schemaOutput.includes('Invalid')

    return { valid, timedOut, schemaOutput, sourceWarnings }
  } finally {
    try { fs.unlinkSync(tmpFile) } catch { /* ignore */ }
  }
}

/**
 * Validate a spec by file path — reads the file, validates from its own
 * directory so relative imports resolve correctly for pages in subdirectories.
 *
 * @param {string} file - absolute path to the spec file
 * @param {string} root - project root
 * @returns {Promise<{ valid: boolean, timedOut: boolean, schemaOutput: string, sourceWarnings: string[] } | { error: string }>}
 */
export async function validateFile(file, root) {
  if (!fs.existsSync(file)) {
    return { error: `File not found: ${file}` }
  }
  const content = fs.readFileSync(file, 'utf8')
  return validateContent(content, root, path.dirname(file))
}

/**
 * Format a validation result as human-readable text — shared rendering for
 * both the CLI (printed to stdout) and the MCP tool (wrapped in text()).
 * `nextSteps`, when true, appends the agent-facing browser-check reminder;
 * a human running this from the terminal doesn't need that, so the CLI
 * command omits it.
 */
export function formatValidationResult(result, { nextSteps = false } = {}) {
  if (result.error) return result.error

  let output = result.schemaOutput
  if (result.sourceWarnings.length > 0) {
    const propNotes = result.sourceWarnings.map(w => `  ⚠ ${w}`).join('\n')
    if (output.startsWith('Valid ✓')) {
      output = output.replace('Valid ✓', 'Valid ✓ — but fix these issues:') + '\n' + propNotes
    } else {
      output = output + '\n' + propNotes
    }
  }

  if (nextSteps && result.valid && result.sourceWarnings.length === 0) {
    output += '\n\n---\n**Next: browser check sequence** (do not skip)\n1. `pulse_fetch_page` → screenshot\n2. **New build?** Show screenshot to user and ask for design approval before continuing\n3. Once approved (or edit/fix): `pulse_design_review` (if intake ran) → `pulse_layout_review <url>` → `/verify`\nDo not run Lighthouse before the user approves the design. Do not report done until `/verify` passes.'
  }

  return output
}
