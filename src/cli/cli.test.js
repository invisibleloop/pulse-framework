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

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
