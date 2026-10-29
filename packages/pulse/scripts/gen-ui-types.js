#!/usr/bin/env node
/**
 * Generate types/ui.d.ts and types/charts.d.ts from the components themselves.
 *
 * The declarations used to be written by hand and had drifted from the runtime: `hero` was typed
 * with `heading`/`subheading`/`media` while the function reads `title`/`subtitle`/`image`, so
 * following the types rendered an empty hero with no error, and `checkbox` plus 36 icons were
 * missing. The components already carry the truth twice (the destructured parameter list and the
 * `@param opts.x` JSDoc), so the types are derived from them and cannot disagree.
 *
 * Usage:  node scripts/gen-ui-types.js          write the files
 *         node scripts/gen-ui-types.js --check  exit 1 if the files on disk are out of date
 */

import fs   from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as acorn from 'acorn'

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UI  = path.join(PKG, 'src', 'ui')

// ── reading a component ─────────────────────────────────────────────────────

/** Find the matching close of a `{...}` JSDoc type starting at `open`. */
function balanced(text, open) {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return i
  }
  return -1
}

/** Parse a JSDoc block into { summary, params: { name: { type, description } } }. */
function parseJsDoc(raw) {
  const lines = raw.replace(/^\s*\*\s?/gm, '').split('\n')
  const text  = lines.join('\n')
  const first = text.search(/^@/m)
  const summary = (first === -1 ? text : text.slice(0, first)).trim()
  const params = {}
  const re = /@param\s+\{/g
  let m
  while ((m = re.exec(text))) {
    const open = m.index + m[0].length - 1
    const close = balanced(text, open)
    if (close === -1) continue
    const type = text.slice(open + 1, close).trim()
    const rest = text.slice(close + 1)
    const name = rest.match(/^\s*(?:\[)?([\w.$]+)(?:=[^\]]*)?(?:\])?/)
    if (!name) continue
    const after = rest.slice(name[0].length)
    const stop  = after.search(/\n\s*@|$/)
    const description = after.slice(0, stop).replace(/^\s*-\s*/, '').replace(/\s*\n\s*/g, ' ').trim()
    params[name[1].replace(/^opts\./, '').replace(/^options\./, '')] = { type, description }
  }
  return { summary, params }
}

/** A JSDoc type as a TypeScript type. */
function toTsType(t) {
  let out = t.trim()
  out = out.replace(/\bArray\.<([^>]*)>/g, 'Array<$1>')
  out = out.replace(/^Array$/, 'unknown[]').replace(/^Array\[\]$/, 'unknown[][]')
  out = out.replace(/^(object|Object)$/, 'Record<string, unknown>')
  out = out.replace(/^(function|Function)$/, '(...args: any[]) => any')
  out = out.replace(/^\*$/, 'unknown')
  // a JSDoc record shape such as {label:string, value:number  (a truncated inline type)
  if (/^\{[^}]*$/.test(out)) out += '}'
  return out
}

function inferType(node) {
  if (!node) return 'unknown'
  switch (node.type) {
    case 'Literal':         return typeof node.value === 'string' ? 'string' : typeof node.value === 'number' ? 'number' : typeof node.value === 'boolean' ? 'boolean' : 'unknown'
    case 'TemplateLiteral': return 'string'
    case 'ArrayExpression': return 'unknown[]'
    case 'ObjectExpression': return 'Record<string, unknown>'
    case 'UnaryExpression': return node.operator === '-' || node.operator === '+' ? 'number' : node.operator === '!' ? 'boolean' : 'unknown'
    case 'ArrowFunctionExpression': case 'FunctionExpression': return '(...args: any[]) => any'
    default: return 'unknown'
  }
}

/** Components exported from a source file: { name, summary, props: [{ name, type, description }] | null }. */
function readComponents(file) {
  const source = fs.readFileSync(file, 'utf8')
  const comments = []
  const ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true, onComment: (block, text, start, end) => { if (block) comments.push({ text, start, end }) } })
  const out = []
  const docBefore = (node) => {
    const c = comments.filter(c => c.end <= node.start && /^\*/.test(c.text) && source.slice(c.end, node.start).trim() === '').pop()
    return c ? c.text : null
  }
  const lastFileDoc = comments.filter(c => /^\*/.test(c.text))[0]?.text ?? null
  for (const node of ast.body) {
    if (node.type !== 'ExportNamedDeclaration' || !node.declaration) continue
    const decl = node.declaration
    let name, fn
    if (decl.type === 'FunctionDeclaration') { name = decl.id.name; fn = decl }
    else if (decl.type === 'VariableDeclaration') {
      const d = decl.declarations[0]
      if (d.init && (d.init.type === 'ArrowFunctionExpression' || d.init.type === 'FunctionExpression')) { name = d.id.name; fn = d.init }
    }
    if (!fn) continue
    const doc = docBefore(node) ?? (out.length === 0 ? lastFileDoc : null)
    const parsed = doc ? parseJsDoc(doc) : { summary: '', params: {} }
    const param = fn.params[0]
    let props = null
    const pattern = param?.type === 'AssignmentPattern' ? param.left : param
    if (pattern?.type === 'ObjectPattern') {
      props = []
      for (const p of pattern.properties) {
        if (p.type === 'RestElement') continue
        const key = p.key.name ?? String(p.key.value)
        const def = p.value.type === 'AssignmentPattern' ? p.value.right : null
        const documented = parsed.params[key]
        props.push({ name: key, type: documented ? toTsType(documented.type) : inferType(def), description: documented?.description ?? '' })
      }
    }
    out.push({ name, summary: parsed.summary, props, documented: Object.keys(parsed.params) })
  }
  return out
}

// ── writing the declarations ────────────────────────────────────────────────

const pascal = (name) => name[0].toUpperCase() + name.slice(1)
const oneLine = (s) => s.replace(/\s+/g, ' ').trim()

// Names consumers imported when these types were written by hand, kept as aliases of the props
// they come from, so they stay exact and existing imports keep working.
const UI_ALIASES = [
  ['AccordionItem',  'AccordionProps', 'items'],
  ['BreadcrumbItem', 'BreadcrumbsProps', 'items'],
  ['NavLink',        'NavProps', 'links'],
  ['RadioOption',    'RadioGroupProps', 'options'],
  ['SelectOption',   'SelectProps', 'options'],
]
const CHART_ALIASES = [
  ['ChartDataPoint', 'BarChartProps', 'data'],
  ['DonutDataPoint', 'DonutChartProps', 'data'],
]

function emit(components, { title, importPath, extra = '', aliases = [] }) {
  const lines = [
    '/**',
    ` * ${title}`,
    ` * ${importPath}`,
    ' *',
    ' * GENERATED by scripts/gen-ui-types.js from the components in src/ui. Do not edit by hand:',
    ' * change the component (its parameters and its JSDoc) and run `npm run gen:types`.',
    ' * All components are pure functions: (props?) => HTML string.',
    ' */',
    '',
  ]
  if (extra) lines.push(extra, '')
  for (const c of components) {
    if (!c.props) {
      lines.push(`/** ${oneLine(c.summary) || c.name} */`, `export function ${c.name}(props?: Record<string, unknown>): string`, '')
      continue
    }
    const iface = `${pascal(c.name)}Props`
    lines.push(`export interface ${iface} {`)
    for (const p of c.props) {
      if (p.description) lines.push(`  /** ${oneLine(p.description).replace(/\*\//g, '* /')} */`)
      lines.push(`  ${/^[A-Za-z_$][\w$]*$/.test(p.name) ? p.name : JSON.stringify(p.name)}?: ${p.type}`)
    }
    lines.push('}')
    if (c.summary) lines.push(`/** ${oneLine(c.summary).replace(/\*\//g, '* /')} */`)
    lines.push(`export function ${c.name}(props?: ${iface}): string`, '')
  }
  const have = new Set(components.map(c => `${pascal(c.name)}Props`))
  for (const [alias, iface, prop] of aliases) {
    if (!have.has(iface)) throw new Error(`alias ${alias}: no ${iface}`)
    lines.push(`export type ${alias} = NonNullable<${iface}['${prop}']>[number]`)
  }
  return lines.join('\n').replace(/\n+$/, '\n')
}

const ICON_PROPS = `export interface IconProps {
  /** Width and height in px (default: 16) */
  size?: number
  /** Extra CSS classes (on the wrapper when bg is set, else on the SVG) */
  class?: string
  /** Wrap in a tinted background shape */
  bg?: 'circle' | 'square'
  /** Background colour (default: 'accent') */
  bgColor?: 'accent' | 'success' | 'warning' | 'error' | 'muted'
}`

/** What the files should contain, as { relativePath: text }. */
export function generate() {
  const indexSource = fs.readFileSync(path.join(UI, 'index.js'), 'utf8')
  const exportsByFile = []                       // [{ names: [...], file }] in index.js order
  for (const m of indexSource.matchAll(/export\s*\{([^}]*)\}\s*from\s*'\.\/([\w-]+\.js)'/g)) {
    exportsByFile.push({ names: m[1].split(',').map(s => s.trim()).filter(Boolean), file: m[2] })
  }
  const ui = []
  let icons = []
  for (const { names, file } of exportsByFile) {
    if (file === 'icons.js') { icons = names; continue }
    const comps = readComponents(path.join(UI, file))
    for (const name of names) {
      const c = comps.find(x => x.name === name)
      if (!c) throw new Error(`${file}: index.js exports ${name} but the file does not`)
      ui.push(c)
    }
  }
  const iconLines = icons.map(n => `export function ${n}(props?: IconProps): string`).join('\n')
  const uiText = emit(ui, { title: 'Pulse UI — Component library types', importPath: '@invisibleloop/pulse/ui', extra: `${ICON_PROPS}\n\n${iconLines}`, aliases: UI_ALIASES })

  const charts = readComponents(path.join(UI, 'charts.js'))
  const chartsText = emit(charts, { title: 'Pulse Charts — SVG chart components', importPath: '@invisibleloop/pulse/charts', aliases: CHART_ALIASES })
  return { 'types/ui.d.ts': uiText, 'types/charts.d.ts': chartsText }
}

function main() {
  const files = generate()
  const check = process.argv.includes('--check')
  let stale = 0
  for (const [rel, text] of Object.entries(files)) {
    const file = path.join(PKG, rel)
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
    if (current === text) continue
    if (check) { console.error(`${rel} is out of date: run npm run gen:types`); stale++ }
    else { fs.writeFileSync(file, text); console.log(`wrote ${rel}`) }
  }
  if (stale) process.exit(1)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
