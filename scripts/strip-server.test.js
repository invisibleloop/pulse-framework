/**
 * Tests for the server-only property stripper in build.js
 * Run: node scripts/strip-server.test.js
 */

// ---------------------------------------------------------------------------
// Inline the scanner functions (duplicated here to keep test self-contained)
// ---------------------------------------------------------------------------

const SERVER_ONLY_KEYS = ['server', 'meta', 'guard', 'serverTimeout', 'contentType', 'render']
const SERVER_ONLY_IMPORTS = ['@invisibleloop/pulse/md']

function stripServerOnlyKeys(source) {
  for (const key of SERVER_ONLY_KEYS) source = removeObjectKey(source, key)
  return source
}

function stripServerOnlyImports(source) {
  const extraPattern = SERVER_ONLY_IMPORTS
    .map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const combinedRe = new RegExp(
    `^[ \\t]*import\\s+(?:\\{[^}]*\\}|[\\w*]+(?:\\s+as\\s+\\w+)?)\\s+from\\s+['"](?:node:[^'"]+|${extraPattern})['"]\\s*;?[ \\t]*\\n?`,
    'gm'
  )
  const importedNames = new Set()
  for (const m of source.matchAll(combinedRe)) {
    const named = m[0].match(/\{\s*([^}]*)\s*\}/)
    if (named) {
      for (const part of named[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/).pop().trim()
        if (name) importedNames.add(name)
      }
    }
    const def = m[0].match(/import\s+([\w]+)\s+from/)
    if (def) importedNames.add(def[1])
  }
  source = source.replace(combinedRe, '')
  for (const name of importedNames) {
    const declRe = new RegExp(
      `^[ \\t]*(?:const|let|var)\\s+\\w+\\s*=\\s*${name}\\b[^\\n]*;?[ \\t]*\\n?`,
      'gm'
    )
    source = source.replace(declRe, '')
  }
  return source
}

function strip(source) {
  return stripServerOnlyImports(stripServerOnlyKeys(source))
}

function isInsideString(source, pos) {
  let i = 0
  const stack = []
  while (i < pos) {
    const c = source[i]
    const top = stack[stack.length - 1]
    if (top === '"' || top === "'") {
      if (c === '\\') { i += 2; continue }
      if (c === top)  { stack.pop() }
      i++; continue
    }
    if (top === '`') {
      if (c === '\\') { i += 2; continue }
      if (c === '`')  { stack.pop(); i++; continue }
      if (c === '$' && source[i + 1] === '{') { stack.push('{'); i += 2; continue }
      i++; continue
    }
    if (top === '{') {
      if (c === '{') { stack.push('{'); i++; continue }
      if (c === '}') { stack.pop(); i++; continue }
      if (c === '"' || c === "'" || c === '`') { stack.push(c); i++; continue }
      i++; continue
    }
    if (c === '/') {
      if (source[i + 1] === '/') { while (i < pos && source[i] !== '\n') i++; continue }
      if (source[i + 1] === '*') { const end = source.indexOf('*/', i + 2); i = end < 0 ? pos : end + 2; continue }
      let prev = ''
      for (let k = i - 1; k >= 0; k--) { if (source[k] !== ' ' && source[k] !== '\t') { prev = source[k]; break } }
      if (!/[a-zA-Z0-9_$)\]]/.test(prev)) {
        i++
        while (i < pos) { if (source[i] === '\\') { i += 2; continue } if (source[i] === '/') { i++; break } if (source[i] === '\n') break; i++ }
        while (i < pos && /[gimsuy]/.test(source[i])) i++
        continue
      }
    }
    if (c === '"' || c === "'" || c === '`') { stack.push(c) }
    i++
  }
  return stack.length > 0
}

function removeObjectKey(source, key) {
  const keyRe = new RegExp(`^([ \\t]*)(${key})([ \\t]*:)`, 'gm')
  let match
  while ((match = keyRe.exec(source)) !== null) {
    if (isInsideString(source, match.index)) { continue }
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
  const got = strip(input).trim()
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

test('render: inside a template literal string (docs code example) is not stripped',
  'export default {\n  route: \'/auth\',\n  view: () => `${highlight(`export default {\n  render: (ctx) => ctx.user\n}`)}`\n}',
  'export default {\n  route: \'/auth\',\n  view: () => `${highlight(`export default {\n  render: (ctx) => ctx.user\n}`)}`\n}'
)

test('server: inside a double-quoted string is not stripped',
  'export default {\n  route: \'/docs\',\n  view: () => "<pre>server: { data: async () => {} }</pre>"\n}',
  'export default {\n  route: \'/docs\',\n  view: () => "<pre>server: { data: async () => {} }</pre>"\n}'
)

test('server/meta not fooled by regex literal containing double quote (/"/g)',
  'const esc = s => s.replace(/"/g, \'&quot;\')\nexport default {\n  meta: { title: \'Page\', description: \'Desc\' },\n  server: { data: async () => [] },\n  view: () => \'\'\n}',
  'const esc = s => s.replace(/"/g, \'&quot;\')\nexport default {\n  view: () => \'\'\n}'
)

test('server not fooled by line comment containing double quote',
  'export default {\n  // server: "comment"\n  server: { data: async () => [] },\n  view: () => \'\'\n}',
  'export default {\n  // server: "comment"\n  view: () => \'\'\n}'
)

test('server not fooled by block comment containing double quote',
  'export default {\n  /* server: "comment" */\n  server: { data: async () => [] },\n  view: () => \'\'\n}',
  'export default {\n  /* server: "comment" */\n  view: () => \'\'\n}'
)

test('meta object is stripped (client runtime never reads spec.meta)',
  `export default {\n  route: '/blog',\n  meta: {\n    title: async (ctx) => fetchPost(ctx).frontmatter.title,\n    styles: ['/pulse-ui.css'],\n  },\n  view: () => ''\n}`,
  `export default {\n  route: '/blog',\n  view: () => ''\n}`
)

test('meta: inside a template literal string is not stripped',
  'export default {\n  view: () => `<pre>meta: { title: \'Home\' }</pre>`\n}',
  'export default {\n  view: () => `<pre>meta: { title: \'Home\' }</pre>`\n}'
)

// ---------------------------------------------------------------------------
// Server-only import stripping
// ---------------------------------------------------------------------------

console.log('\nServer-only import stripping\n')

test('strips @invisibleloop/pulse/md import and const declaration',
  `import { md } from '@invisibleloop/pulse/md'\nconst fetchPost = md('src/content/blog.md')\nexport default {\n  route: '/blog',\n  view: () => ''\n}`,
  `export default {\n  route: '/blog',\n  view: () => ''\n}`
)

test('strips named import with multiple bindings',
  `import { md, parseMd } from '@invisibleloop/pulse/md'\nconst post = md('src/content/post.md')\nconst result = parseMd('# Hello')\nexport default {\n  view: () => ''\n}`,
  `export default {\n  view: () => ''\n}`
)

test('strips import + const then strips meta that used the const',
  `import { md } from '@invisibleloop/pulse/md'\nconst fetchPost = md('src/content/trees.md')\nexport default {\n  route: '/blog',\n  meta: {\n    title: async (ctx) => (await fetchPost(ctx)).frontmatter.title,\n    styles: ['/pulse-ui.css'],\n  },\n  server: { post: fetchPost },\n  view: () => ''\n}`,
  `export default {\n  route: '/blog',\n  view: () => ''\n}`
)

test('does not strip non-server imports',
  `import { nav, footer } from '@invisibleloop/pulse/ui'\nexport default {\n  view: () => nav({})\n}`,
  `import { nav, footer } from '@invisibleloop/pulse/ui'\nexport default {\n  view: () => nav({})\n}`
)

test('strips node:fs default import',
  `import fs from 'node:fs'\nexport default {\n  server: { data: async () => fs.readFileSync('x') },\n  view: () => ''\n}`,
  `export default {\n  view: () => ''\n}`
)

test('strips node:fs/promises named import',
  `import { readFile } from 'node:fs/promises'\nexport default {\n  server: { data: async () => readFile('x') },\n  view: () => ''\n}`,
  `export default {\n  view: () => ''\n}`
)

test('strips node:path and node:url together',
  `import path from 'node:path'\nimport { fileURLToPath } from 'node:url'\nexport default {\n  server: { data: async (ctx) => path.join('a', 'b') },\n  view: () => ''\n}`,
  `export default {\n  view: () => ''\n}`
)

test('strips node:fs default import and top-level const using it',
  `import fs from 'node:fs'\nconst DIR = fs.readdirSync('.')\nexport default {\n  view: () => ''\n}`,
  `export default {\n  view: () => ''\n}`
)

// ---------------------------------------------------------------------------
// Dev-mode node:* import stripping (same regex used in src/cli/dev.js serveFile)
// ---------------------------------------------------------------------------

console.log('\nDev-mode node:* import stripping\n')

const DEV_NODE_RE = /^[ \t]*import\s+(?:\{[^}]*\}|[\w*]+(?:\s+as\s+\w+)?)\s+from\s+['"]node:[^'"]+['"]\s*;?[ \t]*\n?/gm

function devStrip(source) {
  return source.replace(DEV_NODE_RE, '')
}

function devTest(label, input, expected) {
  const got = devStrip(input).trim()
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

devTest('strips default import (node:fs)',
  `import fs from 'node:fs'\nconst DIR = '/journal'\nexport default { view: () => '' }`,
  `const DIR = '/journal'\nexport default { view: () => '' }`
)

devTest('strips named import (node:path)',
  `import { join, resolve } from 'node:path'\nexport default { view: () => '' }`,
  `export default { view: () => '' }`
)

devTest('strips multiple node: imports',
  `import fs from 'node:fs'\nimport path from 'node:path'\nexport default { view: () => '' }`,
  `export default { view: () => '' }`
)

devTest('strips node:fs/promises named import',
  `import { readFile } from 'node:fs/promises'\nexport default { view: () => '' }`,
  `export default { view: () => '' }`
)

devTest('does not strip non-node imports',
  `import { nav } from '@invisibleloop/pulse/ui'\nexport default { view: () => '' }`,
  `import { nav } from '@invisibleloop/pulse/ui'\nexport default { view: () => '' }`
)

devTest('leaves module-level constants intact',
  `import fs from 'node:fs'\nconst JOURNAL_DIR = '/Users/andy/journal'\nexport default { view: () => '' }`,
  `const JOURNAL_DIR = '/Users/andy/journal'\nexport default { view: () => '' }`
)

// ---------------------------------------------------------------------------

console.log(`\n${pass + fail} tests: ${pass} passed, ${fail} failed\n`)
if (fail > 0) process.exit(1)
