/**
 * Tests for the server-only property stripper in build.js
 * Run: node scripts/strip-server.test.js
 */

// ---------------------------------------------------------------------------
// Inline the scanner functions (duplicated here to keep test self-contained)
// ---------------------------------------------------------------------------

const SERVER_ONLY_KEYS = ['server', 'guard', 'serverTimeout', 'contentType', 'render']

function stripServerOnlyKeys(source) {
  for (const key of SERVER_ONLY_KEYS) source = removeObjectKey(source, key)
  return source
}

function removeObjectKey(source, key) {
  const keyRe = new RegExp(`^([ \\t]*)(${key})([ \\t]*:)`, 'gm')
  let match
  while ((match = keyRe.exec(source)) !== null) {
    const removeStart = match.index
    const afterColon  = match.index + match[0].length
    let pos = afterColon
    while (pos < source.length && (source[pos] === ' ' || source[pos] === '\t')) pos++
    pos = scanJsValue(source, pos)
    while (pos < source.length && (source[pos] === ' ' || source[pos] === '\t')) pos++
    if (pos < source.length && source[pos] === ',') pos++
    if (pos < source.length && source[pos] === '\n') pos++
    source = source.slice(0, removeStart) + source.slice(pos)
    keyRe.lastIndex = removeStart
  }
  return source
}

function scanJsValue(src, pos) {
  let i = pos, depth = 0
  while (i < src.length) {
    const c = src[i]
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue }
    if (c === '"' || c === "'") {
      i++
      while (i < src.length) { if (src[i] === '\\') { i += 2; continue } if (src[i] === c) { i++; break } i++ }
      if (depth === 0) return i
      continue
    }
    if (c === '`') { i = scanTemplateLiteral(src, i + 1); if (depth === 0) return i; continue }
    if (c === '{' || c === '[' || c === '(') { depth++; i++; continue }
    if (c === '}' || c === ']' || c === ')') {
      if (depth === 0) return i
      depth--; i++
      if (depth === 0) {
        let j = i
        while (j < src.length && (src[j] === ' ' || src[j] === '\t')) j++
        const next = src[j]
        if (!next || next === ',' || next === '}' || next === ']' || next === ')' || next === '\n') return i
        if (next === '=' && src[j + 1] === '>') continue
        continue
      }
      continue
    }
    if (depth === 0 && (c === ',' || c === '\n')) return i
    i++
  }
  return i
}

function scanTemplateLiteral(src, pos) {
  let i = pos
  while (i < src.length) {
    if (src[i] === '\\') { i += 2; continue }
    if (src[i] === '`')  { return i + 1 }
    if (src[i] === '$' && src[i + 1] === '{') {
      i += 2; let depth = 1
      while (i < src.length && depth > 0) {
        const c = src[i]
        if (c === '{') { depth++; i++; continue }
        if (c === '}') { depth--; i++; continue }
        if (c === '"' || c === "'") { const q = c; i++; while (i < src.length) { if (src[i] === '\\') { i += 2; continue } if (src[i] === q) { i++; break } i++ } continue }
        if (c === '`') { i = scanTemplateLiteral(src, i + 1); continue }
        i++
      }
      continue
    }
    i++
  }
  return i
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let pass = 0, fail = 0

function test(label, input, expected) {
  const got = stripServerOnlyKeys(input).trim()
  const exp = expected.trim()
  if (got === exp) {
    console.log('  \u2713 ' + label)
    pass++
  } else {
    console.log('  \u2717 ' + label)
    console.log('    expected: ' + JSON.stringify(exp))
    console.log('    got:      ' + JSON.stringify(got))
    fail++
  }
}

// ---------------------------------------------------------------------------

console.log('\nServer-only key stripping\n')

test('object value with trailing comma',
  `export default {\n  route: '/',\n  server: { data: async (ctx) => 'hello' },\n  view: () => ''\n}`,
  `export default {\n  route: '/',\n  view: () => ''\n}`
)

test('async arrow with block body',
  `export default {\n  server: {\n    data: async (ctx) => {\n      return 'x'\n    }\n  },\n  view: () => ''\n}`,
  `export default {\n  view: () => ''\n}`
)

test('serverTimeout simple number',
  `export default {\n  serverTimeout: 5000,\n  view: () => ''\n}`,
  `export default {\n  view: () => ''\n}`
)

test('guard async arrow with block body containing nested object',
  `export default {\n  guard: async (ctx) => {\n    if (!ctx.session) return { redirect: '/login' }\n  },\n  view: () => ''\n}`,
  `export default {\n  view: () => ''\n}`
)

test('guard inline arrow expression',
  `export default {\n  guard: async (ctx) => { if (!ctx.session) return { redirect: '/login' } },\n  view: () => ''\n}`,
  `export default {\n  view: () => ''\n}`
)

test('contentType and render are both stripped (raw content specs are never hydrated)',
  `export default {\n  route: '/feed.xml',\n  contentType: 'application/rss+xml',\n  render: (ctx) => '<rss/>'\n}`,
  `export default {\n  route: '/feed.xml',\n}`
)

test('render with template literal containing ${...}',
  'export default {\n  render: (ctx, srv) => `<rss>${srv.items.map(i => i.title).join(\',\')}</rss>`,\n  view: () => \'\'\n}',
  "export default {\n  view: () => ''\n}"
)

test('last property — no trailing comma',
  `export default {\n  view: () => '',\n  server: { data: async () => [] }\n}`,
  `export default {\n  view: () => '',\n}`
)

test('multiple fetchers in server object',
  `export default {\n  server: {\n    user: async (ctx) => ctx.user,\n    posts: async (ctx) => []\n  },\n  view: () => ''\n}`,
  `export default {\n  view: () => ''\n}`
)

test('does not strip non-server keys',
  `export default {\n  route: '/',\n  state: {},\n  view: () => ''\n}`,
  `export default {\n  route: '/',\n  state: {},\n  view: () => ''\n}`
)

test('strips all server-only keys in one pass',
  `export default {\n  route: '/admin',\n  guard: async (ctx) => { if (!ctx.user) return { redirect: '/login' } },\n  serverTimeout: 3000,\n  server: { profile: async (ctx) => ctx.user },\n  view: () => ''\n}`,
  `export default {\n  route: '/admin',\n  view: () => ''\n}`
)

test('does not touch "server" inside a view string',
  `export default {\n  view: (state, server) => \`<p>\${server.name}</p>\`\n}`,
  `export default {\n  view: (state, server) => \`<p>\${server.name}</p>\`\n}`
)

test('async function expression (not arrow)',
  `export default {\n  server: {\n    data: async function(ctx) { return ctx.db.query() }\n  },\n  view: () => ''\n}`,
  `export default {\n  view: () => ''\n}`
)

test('server with deeply nested template literal in view is not affected',
  'export default {\n  server: { items: async () => [] },\n  view: (s, srv) => `<ul>${srv.items.map(i => `<li>${i}</li>`).join(\'\')}</ul>`\n}',
  'export default {\n  view: (s, srv) => `<ul>${srv.items.map(i => `<li>${i}</li>`).join(\'\')}</ul>`\n}'
)

// ---------------------------------------------------------------------------

console.log(`\n${pass + fail} tests: ${pass} passed, ${fail} failed\n`)
if (fail > 0) process.exit(1)
