/**
 * Pulse — removing server-only code from a page before it is bundled for the browser.
 *
 * A page spec is one object that holds both sides: `server` fetchers, `guard`, `submit`, `render`
 * run only on the server; `mutations`, `actions`, `view` run in the browser too. The browser bundle
 * must contain none of the first kind: they hold database queries, API keys, SMTP tokens and the
 * imports that go with them, and /dist is public and cached for a year.
 *
 * This used to be done with a line-anchored text scanner. It missed every layout it did not
 * expect (a spec on one line, quoted or shorthand keys, a spread base) and did not strip `submit`
 * at all, silently and with no warning. It now uses a real parser (acorn), and it FAILS CLOSED:
 * when it cannot prove that the server-only code is gone, the build stops and says why, rather
 * than shipping it.
 */

import * as acorn from 'acorn'

/**
 * Spec properties that are used only on the server. (`actions.submit` is a different thing: this
 * looks only at the top level of the exported object, so an action called `submit` is untouched.)
 */
export const SERVER_ONLY_KEYS = ['server', 'meta', 'guard', 'serverTimeout', 'serverTtl', 'contentType', 'render', 'sitemap', 'submit']

/** Spec properties that mean the page needs JavaScript in the browser (see discover.js needsHydration). */
const CLIENT_KEYS = ['mutations', 'actions', 'persist', 'store']

export class StripError extends Error {
  constructor(message, { file, line } = {}) {
    super(`${file ? `${file}${line ? `:${line}` : ''}: ` : ''}${message}`)
    this.name = 'StripError'
  }
}

// ---------------------------------------------------------------------------
// AST helpers
// ---------------------------------------------------------------------------

function parse(source, file) {
  try {
    return acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true })
  } catch (err) {
    throw new StripError(`could not parse this file to remove its server-only code: ${err.message}`, { file, line: err.loc?.line })
  }
}

/** The names a binding pattern declares. */
function boundNames(pattern, out = []) {
  if (!pattern) return out
  switch (pattern.type) {
    case 'Identifier':        out.push(pattern.name); break
    case 'ObjectPattern':     pattern.properties.forEach(p => boundNames(p.type === 'RestElement' ? p.argument : p.value, out)); break
    case 'ArrayPattern':      pattern.elements.forEach(e => boundNames(e, out)); break
    case 'AssignmentPattern': boundNames(pattern.left, out); break
    case 'RestElement':       boundNames(pattern.argument, out); break
  }
  return out
}

/**
 * Add to `refs` every identifier name that `node` reads. Names in declaration, property-key and
 * label positions are not reads. Scoping is ignored on purpose: a shadowed name counts as a read,
 * which can only make us keep more code, never less.
 */
function collectRefs(node, refs, skip = null) {
  if (!node || typeof node.type !== 'string') return
  if (skip && skip.has(node)) return
  switch (node.type) {
    case 'Identifier': refs.add(node.name); return
    case 'MemberExpression':
      collectRefs(node.object, refs, skip)
      if (node.computed) collectRefs(node.property, refs, skip)
      return
    case 'Property':
      if (node.computed) collectRefs(node.key, refs, skip)
      collectRefs(node.value, refs, skip)               // a shorthand `{ server }` reads `server` through its value
      return
    case 'MethodDefinition': case 'PropertyDefinition':
      if (node.computed) collectRefs(node.key, refs, skip)
      collectRefs(node.value, refs, skip)
      return
    case 'VariableDeclarator':
      collectPatternReads(node.id, refs, skip)
      collectRefs(node.init, refs, skip)
      return
    case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression':
      node.params.forEach(p => collectPatternReads(p, refs, skip))
      collectRefs(node.body, refs, skip)
      return
    case 'CatchClause':
      collectPatternReads(node.param, refs, skip)
      collectRefs(node.body, refs, skip)
      return
    case 'ClassDeclaration': case 'ClassExpression':
      collectRefs(node.superClass, refs, skip)
      collectRefs(node.body, refs, skip)
      return
    case 'LabeledStatement': collectRefs(node.body, refs, skip); return
    case 'BreakStatement': case 'ContinueStatement': return
    case 'ImportDeclaration': return                          // imports declare, they do not read
    case 'ExportSpecifier': collectRefs(node.local, refs, skip); return
    case 'ExportNamedDeclaration':
      if (node.declaration) collectRefs(node.declaration, refs, skip)
      node.specifiers?.forEach(s => collectRefs(s, refs, skip))
      return
  }
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'loc' || key === 'start' || key === 'end') continue
    const value = node[key]
    if (Array.isArray(value)) value.forEach(v => collectRefs(v, refs, skip))
    else if (value && typeof value.type === 'string') collectRefs(value, refs, skip)
  }
}

/** Reads inside a binding pattern: default values and computed keys only. */
function collectPatternReads(pattern, refs, skip) {
  if (!pattern) return
  switch (pattern.type) {
    case 'AssignmentPattern': collectPatternReads(pattern.left, refs, skip); collectRefs(pattern.right, refs, skip); break
    case 'ObjectPattern':
      pattern.properties.forEach(p => {
        if (p.type === 'RestElement') collectPatternReads(p.argument, refs, skip)
        else { if (p.computed) collectRefs(p.key, refs, skip); collectPatternReads(p.value, refs, skip) }
      })
      break
    case 'ArrayPattern': pattern.elements.forEach(e => collectPatternReads(e, refs, skip)); break
    case 'RestElement':  collectPatternReads(pattern.argument, refs, skip); break
  }
}

/** The name of a property's key, or null when it cannot be known statically. */
function keyName(prop) {
  if (!prop.computed) return prop.key.type === 'Identifier' ? prop.key.name : (prop.key.type === 'Literal' ? String(prop.key.value) : null)
  return prop.key.type === 'Literal' ? String(prop.key.value) : null            // ['server'] is still `server`
}

/**
 * Find the exported spec object. Returns { object, declaration } or { unknown: reason }.
 * Understands `export default { ... }`, `export default spec` / `export { spec as default }` with
 * `spec` a top-level const/let/var bound to an object literal.
 */
function findSpecObject(ast) {
  let target = null
  for (const node of ast.body) {
    if (node.type === 'ExportDefaultDeclaration') target = node.declaration
    else if (node.type === 'ExportNamedDeclaration' && !node.declaration) {
      const spec = node.specifiers.find(s => (s.exported.name ?? s.exported.value) === 'default')
      if (spec) target = { type: 'Identifier', name: spec.local.name }
    }
  }
  if (!target) return { none: true }
  if (target.type === 'ObjectExpression') return { object: target, declaration: null }
  if (target.type === 'Identifier') {
    for (const stmt of ast.body) {
      // `const spec = {...}` or `export const spec = {...}` (a spec that is also a named export)
      const node = stmt.type === 'ExportNamedDeclaration' && stmt.declaration?.type === 'VariableDeclaration' ? stmt.declaration : stmt
      if (node.type !== 'VariableDeclaration') continue
      for (const d of node.declarations) {
        if (d.id.type === 'Identifier' && d.id.name === target.name) {
          if (d.init?.type === 'ObjectExpression') return { object: d.init, declaration: node }
          return { unknown: `\`${target.name}\` is not bound to an object literal` }
        }
      }
    }
    return { unknown: `\`${target.name}\` is not declared in this file as a plain object` }
  }
  return { unknown: 'the default export is not an object literal' }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Describe a page's exported spec object without changing it.
 * @returns {{ analysable: boolean, reason?: string, keys?: Set<string>, hasSpread?: boolean }}
 */
export function analyseSpec(source, { file } = {}) {
  const ast = parse(source, file)
  const found = findSpecObject(ast)
  if (found.none) return { analysable: false, none: true, reason: 'no default export' }
  if (found.unknown) return { analysable: false, reason: found.unknown }
  const keys = new Set()
  for (const prop of found.object.properties) {
    if (prop.type === 'SpreadElement') return { analysable: false, reason: 'the spec object uses a spread (`...base`), so the keys it contributes cannot be known' }
    const name = keyName(prop)
    if (name === null) return { analysable: false, reason: 'the spec object has a computed key that is not a string literal' }
    keys.add(name)
  }
  return { analysable: true, keys }
}

/** Does a page, as analysed, need a browser bundle? (A view plus any client-side behaviour.) */
export function needsClientBundle(analysis) {
  return analysis.analysable && analysis.keys.has('view') && CLIENT_KEYS.some(k => analysis.keys.has(k))
}

/**
 * Remove the server-only code from a page or store source.
 *
 * 1. Delete SERVER_ONLY_KEYS from the exported spec object (top level only).
 * 2. Delete what only that code used: top-level functions, classes and variables nothing reads any
 *    more, when they are dead or built from something being deleted, and imports none of whose
 *    bindings are read any more. Repeat until nothing more goes.
 *
 * Throws StripError when the exported spec cannot be analysed (a spread, a computed key, an
 * imported or built object): server code might be hiding in what cannot be seen.
 *
 * @returns {{ code: string, removed: { keys: string[], imports: string[], declarations: string[] } }}
 */
export function stripServerCode(source, { file } = {}) {
  const ast   = parse(source, file)
  const found = findSpecObject(ast)
  if (found.none) return { code: source, removed: { keys: [], imports: [], declarations: [] } }   // not a spec: a helper module
  const where = (node) => ({ file, line: node?.loc?.start.line })
  if (found.unknown) {
    throw new StripError(`cannot remove server-only code from this page: ${found.unknown}. Write the spec as \`export default { ... }\` (or \`const spec = { ... }; export default spec\`) so the build can see its keys, or the \`server\`, \`guard\` and \`submit\` code would ship to the browser.`, where(ast.body.find(n => n.type === 'ExportDefaultDeclaration') ?? ast.body[0]))
  }

  const removedRanges = []       // [start, end)
  const skip = new Set()         // nodes whose reads no longer count
  const removed = { keys: [], imports: [], declarations: [] }

  // 1. the keys
  for (const prop of found.object.properties) {
    if (prop.type === 'SpreadElement') {
      throw new StripError('this page spreads another object into its spec (`...' + (prop.argument.name ?? 'expression') + '`), so the build cannot tell whether server-only keys (`server`, `guard`, `submit`, ...) come with it and would ship to the browser. List the keys of the spec directly in the object.', where(prop))
    }
    const name = keyName(prop)
    if (name === null) throw new StripError('this page has a computed property key in its spec that is not a string literal, so the build cannot tell whether it names a server-only key. Use a plain key.', where(prop))
    if (SERVER_ONLY_KEYS.includes(name)) {
      skip.add(prop)
      removedRanges.push(propertyRange(source, found.object, prop))
      removed.keys.push(name)
    }
  }

  // 2. what only that code used. Repeat until nothing more can go:
  //    - a top-level function or class nothing reads is dead;
  //    - a variable nothing reads goes when building it can have no effect (a constant, a function,
  //      an object of those) or when it exists only for code already removed (`const post =
  //      md('...')` that only `server` used). A variable nothing ever read, with an initialiser
  //      that does something, stays: it was not made dead by us, and we do not guess;
  //    - an import none of whose bindings is read any more.
  const body = ast.body
  const readsBefore = new Set()
  for (const node of body) if (node.type !== 'ImportDeclaration') collectRefs(node, readsBefore)
  const gone = new Set()
  for (let changed = true; changed;) {
    changed = false
    const reads = new Set()
    for (const node of body) if (!gone.has(node) && node.type !== 'ImportDeclaration') collectRefs(node, reads, skip)
    for (const node of body) {
      if (gone.has(node)) continue
      if (node.type === 'ImportDeclaration') {
        const names = node.specifiers.map(sp => sp.local.name)
        if (names.length > 0 && names.every(n => !reads.has(n))) { gone.add(node); removed.imports.push(node.source.value); changed = true }
      } else if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
        if (node.id && !reads.has(node.id.name)) { gone.add(node); removed.declarations.push(node.id.name); changed = true }
      } else if (node.type === 'VariableDeclaration' && node !== found.declaration) {
        const dead = node.declarations.every(d => boundNames(d.id).every(n => !reads.has(n)))
        const safe = node.declarations.every(d => !d.init || isInert(d.init) || boundNames(d.id).every(n => readsBefore.has(n)))
        if (dead && safe) { gone.add(node); removed.declarations.push(...declaredNames(node)); changed = true }
      }
    }
  }
  for (const node of gone) removedRanges.push([node.start, statementEnd(source, node)])

  const code = applyRemovals(source, removedRanges)

  // belt and braces: parse what we produced, and check no server-only key survived at the top level
  const check = analyseSpec(code, { file })
  if (check.analysable) {
    const left = SERVER_ONLY_KEYS.filter(k => check.keys.has(k))
    if (left.length) throw new StripError(`internal error: ${left.join(', ')} survived stripping`, { file })
  }
  return { code, removed }
}

// ---------------------------------------------------------------------------
// Edits
// ---------------------------------------------------------------------------

function declaredNames(stmt) {
  if (stmt.type === 'VariableDeclaration') return stmt.declarations.flatMap(d => boundNames(d.id))
  if ((stmt.type === 'FunctionDeclaration' || stmt.type === 'ClassDeclaration') && stmt.id) return [stmt.id.name]
  return []
}

/** Can evaluating this expression at load time do anything but produce a value? */
function isInert(node) {
  switch (node.type) {
    case 'Literal': case 'Identifier': case 'FunctionExpression': case 'ArrowFunctionExpression': return true
    case 'TemplateLiteral':  return node.expressions.every(isInert)
    case 'UnaryExpression':  return node.operator !== 'delete' && isInert(node.argument)
    case 'BinaryExpression': case 'LogicalExpression': return isInert(node.left) && isInert(node.right)
    case 'ArrayExpression':  return node.elements.every(e => !e || (e.type !== 'SpreadElement' && isInert(e)))
    case 'ObjectExpression': return node.properties.every(p => p.type === 'Property' && !p.computed && p.kind === 'init' && isInert(p.value))
    default: return false
  }
}

/** The range to delete for a property: from its start to the comma after it (and that line's break). */
function propertyRange(source, object, prop) {
  const props = object.properties
  const i = props.indexOf(prop)
  let start = prop.start
  let end = prop.end
  // the comma that follows, or the one before when this is the last property
  const after = source.slice(end).match(/^\s*,/)
  if (after) end += after[0].length
  else if (i > 0) { const before = source.slice(0, start).match(/,\s*$/); if (before) start -= before[0].length }
  // swallow the rest of the line when only whitespace shares it
  const lineStart = source.lastIndexOf('\n', start - 1) + 1
  if (/^[ \t]*$/.test(source.slice(lineStart, start))) {
    const rest = source.slice(end).match(/^[ \t]*\n/)
    if (rest) { start = lineStart; end += rest[0].length }
  }
  return [start, end]
}

function statementEnd(source, node) {
  let end = node.end
  const rest = source.slice(end).match(/^[ \t]*;?[ \t]*\n?/)
  return rest ? end + rest[0].length : end
}

function applyRemovals(source, ranges) {
  const sorted = ranges.slice().sort((a, b) => a[0] - b[0])
  let out = '', pos = 0
  for (const [start, end] of sorted) {
    if (end <= pos) continue                       // inside a range already removed
    out += source.slice(pos, Math.max(start, pos))
    pos = Math.max(pos, end)
  }
  return out + source.slice(pos)
}
