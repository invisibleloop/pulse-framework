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
import assert from 'node:assert/strict'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let passed = 0
let failed = 0

// Tests whose callback is async return a promise. A bare try { fn() } would print ✓ at once and
// never look at it (#175), so those are collected and the summary waits for every one.
const pending = []

function test(label, fn) {
  const ok   = () => { console.log(`  ✓ ${label}`); passed++ }
  const fail = (e) => { console.log(`  ✗ ${label}`); console.log(`    ${e?.message ?? e}`); failed++ }
  try {
    const result = fn()
    if (result && typeof result.then === 'function') pending.push(result.then(ok, fail))
    else ok()
  } catch (e) {
    fail(e)
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

test('a scaffolded project pins a caret range on the scaffolding version, not "latest"', () => {
  const { pulseDependencyRange } = modules[0].value
  const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
  if (pulseDependencyRange() !== `^${version}`) throw new Error(`got ${pulseDependencyRange()}`)
  if (!/^\^\d+\.\d+\.\d+$/.test(pulseDependencyRange())) throw new Error('not a caret range')
})

test('a scaffolded project lists the agent tools\' dependencies as devDependencies, at the ranges this package declares', async () => {
  const { scaffold, mcpDevDependencies } = modules[0].value
  const { peerDependencies } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
  const { mkdtempSync, rmSync } = await import('fs')
  const os = await import('os')
  const dir = mkdtempSync(path.join(os.tmpdir(), 'pulse-scaffold-deps-'))
  try {
    await scaffold(dir, { name: 'demo' })
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    for (const name of ['@modelcontextprotocol/sdk', 'zod']) {
      if (pkg.devDependencies?.[name] !== peerDependencies[name]) throw new Error(`${name}: got ${pkg.devDependencies?.[name]}, want ${peerDependencies[name]}`)
      if (pkg.dependencies?.[name]) throw new Error(`${name} must not be a production dependency`)
    }
    if (JSON.stringify(mcpDevDependencies()) !== JSON.stringify(pkg.devDependencies)) throw new Error('mcpDevDependencies() differs from what was written')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('a scaffolded .gitignore ignores the dev error journal, and nothing else under .pulse/', async () => {
  const { scaffold } = modules[0].value
  const { mkdtempSync, rmSync } = await import('fs')
  const os = await import('os')
  const dir = mkdtempSync(path.join(os.tmpdir(), 'pulse-scaffold-ignore-'))
  try {
    await scaffold(dir, { name: 'demo' })
    const lines = readFileSync(path.join(dir, '.gitignore'), 'utf8').split('\n').map(l => l.trim())
    if (!lines.includes('.pulse/errors.json')) throw new Error('.pulse/errors.json must be ignored')
    if (lines.includes('.pulse') || lines.includes('.pulse/')) throw new Error('.pulse/ as a whole must not be ignored: design reports live there')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('pulse help prints usage; an unknown command is an error, not an AI session', async () => {
  const { spawnSync } = await import('child_process')
  const os = await import('os')
  const cli = path.join(__dirname, 'index.js')
  const run = (...a) => spawnSync(process.execPath, [cli, ...a], { cwd: os.tmpdir(), encoding: 'utf8', timeout: 20000 })
  const help = run('help')
  if (help.status !== 0 || !/Usage:/.test(help.stdout)) throw new Error(`pulse help: exit ${help.status}, ${help.stdout.slice(0, 80)}`)
  if (!/\bstop\b/.test(help.stdout)) throw new Error('--help must list the stop command')
  const bogus = run('bogus')
  if (bogus.status !== 1) throw new Error(`pulse bogus must exit 1, got ${bogus.status}`)
  if (!/Unknown command "bogus"/.test(bogus.stderr)) throw new Error(`expected an unknown-command message, got: ${bogus.stderr}`)
  if (/agent starting/i.test(bogus.stdout + bogus.stderr)) throw new Error('an unknown command must not start an AI session')
})

test('pulse stop honours --port, validates it, and says which ports it looked at', async () => {
  const { spawnSync } = await import('child_process')
  const os = await import('os')
  const cli = path.join(__dirname, 'index.js')
  const run = (...a) => spawnSync(process.execPath, [cli, 'stop', ...a], { cwd: os.tmpdir(), encoding: 'utf8', timeout: 20000 })
  const ok = run('--port', '47311')
  if (ok.status !== 0 || !/47311 and 47312/.test(ok.stdout)) throw new Error(`expected the --port ports in the output, got: ${ok.stdout} ${ok.stderr}`)
  for (const bad of ['abc', '0', '70000', '']) {
    const r = run('--port', bad)
    if (r.status !== 1 || !/--port needs a port number/.test(r.stderr)) throw new Error(`--port "${bad}" must be rejected, got exit ${r.status}: ${r.stderr}`)
  }
})

test('class check: pulse-ui.css utilities count as defined, genuinely undefined classes are still reported', async () => {
  const { definedClasses, undefinedClasses } = await import('./class-check.js')
  const defined = new Set([...definedClasses('.u-mt-2 { margin-top: .5rem }\n.u-text-muted, .hero:hover { color: gray }'), ...definedClasses('.page { }')])
  const missing = undefinedClasses('<main class="page u-mt-2 u-text-muted hero ui-card typo-class">', defined)
  if (JSON.stringify(missing) !== '["typo-class"]') throw new Error(`expected only the typo, got ${JSON.stringify(missing)}`)
})

test('scaffold: the home page states its theme, and isInstalledCopy tells a node_modules install from a checkout', async () => {
  const { scaffold, isInstalledCopy } = modules[0].value
  const { mkdtempSync, rmSync } = await import('fs')
  const os = await import('os')
  const dir = mkdtempSync(path.join(os.tmpdir(), 'pulse-scaffold-theme-'))
  try {
    await scaffold(dir, { name: 'demo' })
    if (!/theme:\s+'dark'/.test(readFileSync(path.join(dir, 'src/pages/home.js'), 'utf8'))) throw new Error('home.js must set meta.theme, or every new project starts with a "theme is not set" warning')
  } finally { rmSync(dir, { recursive: true, force: true }) }
  const sep = path.sep
  if (!isInstalledCopy(['', 'usr', 'lib', 'node_modules', '@invisibleloop', 'pulse'].join(sep))) throw new Error('a global install is an installed copy')
  if (!isInstalledCopy(['', 'home', 'u', '.npm', '_npx', 'abc', 'node_modules', '@invisibleloop', 'pulse'].join(sep))) throw new Error('an npx cache is an installed copy')
  if (isInstalledCopy(['', 'home', 'u', 'src', 'pulse', 'packages', 'pulse'].join(sep))) throw new Error('a dev checkout is not an installed copy')
})

test('the install command for the agent tools pins the ranges this package declares', async () => {
  const { mcpInstallSpecs, shellQuote } = await import('../mcp/deps.js')
  const { peerDependencies } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
  const specs = mcpInstallSpecs()
  if (specs[0] !== `@modelcontextprotocol/sdk@${peerDependencies['@modelcontextprotocol/sdk']}`) throw new Error(`got ${specs[0]}`)
  if (specs[1] !== `zod@${peerDependencies.zod}`) throw new Error(`got ${specs[1]}`)
  if (shellQuote('zod@^3.25 || ^4.0') !== "'zod@^3.25 || ^4.0'") throw new Error('a range with spaces and pipes must be quoted for display')
  if (shellQuote('npm') !== 'npm') throw new Error('plain words stay unquoted')
})

test('optional agent commands (quietlytics-speed) are never scaffolded; add-command opts in; update and dev then keep it current', async () => {
  const { scaffold } = modules[0].value
  const { commandsToSync, addCommand, optionalCommandNames } = await import('./commands.js')
  const { mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync } = await import('fs')
  const { spawnSync } = await import('child_process')
  const os = await import('os')
  const cli = path.join(__dirname, 'index.js')
  if (!optionalCommandNames().includes('quietlytics-speed')) throw new Error('quietlytics-speed must be an optional command')

  // a scaffolded project has the built-ins and not the optional one
  const dir = mkdtempSync(path.join(os.tmpdir(), 'pulse-optional-cmd-'))
  try {
    await scaffold(dir, { name: 'demo' })
    for (const f of ['verify.md', 'pulse-dev.md']) if (!existsSync(path.join(dir, '.claude/commands', f))) throw new Error(`${f} must be scaffolded`)
    if (existsSync(path.join(dir, '.claude/commands/quietlytics-speed.md'))) throw new Error('an optional command must not be scaffolded')

    // sync set: built-ins only until the project opts in
    const names = () => commandsToSync(dir).map(c => c.file)
    if (names().includes('quietlytics-speed.md')) throw new Error('not opted in: must not be synced')
    if (!names().includes('verify.md')) throw new Error('built-ins are always synced')
    addCommand(dir, 'quietlytics-speed')
    if (!names().includes('quietlytics-speed.md')) throw new Error('opted in: must be synced')
    let threw = false
    try { addCommand(dir, 'nope') } catch { threw = true }
    if (!threw) throw new Error('an unknown optional command must throw')

    // `pulse update` refreshes it once present
    const file = path.join(dir, '.claude/commands/quietlytics-speed.md')
    writeFileSync(file, 'stale')
    const up = spawnSync(process.execPath, [cli, 'update', '--no-install'], { cwd: dir, encoding: 'utf8', timeout: 30000 })
    if (up.status !== 0) throw new Error(`pulse update failed: ${up.stderr}`)
    if (readFileSync(file, 'utf8') === 'stale') throw new Error('pulse update must refresh an opted-in optional command')
  } finally { rmSync(dir, { recursive: true, force: true }) }

  // the CLI: a project that has not opted in is not touched by update
  const bare = mkdtempSync(path.join(os.tmpdir(), 'pulse-optional-cmd2-'))
  try {
    mkdirSync(path.join(bare, 'src', 'pages'), { recursive: true })
    const up = spawnSync(process.execPath, [cli, 'update', '--no-install'], { cwd: bare, encoding: 'utf8', timeout: 30000 })
    if (up.status !== 0) throw new Error(`pulse update failed: ${up.stderr}`)
    if (existsSync(path.join(bare, '.claude/commands/quietlytics-speed.md'))) throw new Error('update must not add an optional command the project did not ask for')
    const bad = spawnSync(process.execPath, [cli, 'add-command', 'bogus'], { cwd: bare, encoding: 'utf8', timeout: 30000 })
    if (bad.status !== 1 || !/Optional commands you can add: quietlytics-speed/.test(bad.stderr)) throw new Error(`add-command bogus: exit ${bad.status} ${bad.stderr}`)
    const ok = spawnSync(process.execPath, [cli, 'add-command', 'quietlytics-speed'], { cwd: bare, encoding: 'utf8', timeout: 30000 })
    if (ok.status !== 0 || !existsSync(path.join(bare, '.claude/commands/quietlytics-speed.md'))) throw new Error(`add-command failed: ${ok.status} ${ok.stderr}`)
  } finally { rmSync(bare, { recursive: true, force: true }) }
})

test('toPosix turns native separators into forward slashes for generated JS, manifest keys and URLs', async () => {
  const { toPosix } = await import('./paths.js')
  if (toPosix('..\\src\\pages\\home.js', '\\') !== '../src/pages/home.js') throw new Error('Windows separators must become /')
  if (toPosix('../src/pages/home.js', '/') !== '../src/pages/home.js') throw new Error('POSIX paths are untouched')
  if (toPosix('a\\b', '/') !== 'a\\b') throw new Error('on POSIX a backslash is a legal filename character and must stay')
})

test('every path.relative that feeds generated JS, a manifest key or a URL goes through toPosix (pulse build was broken on Windows)', () => {
  const files = ['../../scripts/build.js', 'discover.js', 'check-bundles.js']
  const offenders = []
  for (const f of files) {
    const lines = readFileSync(new URL(f, import.meta.url), 'utf8').split('\n')
    lines.forEach((line, i) => {
      if (!/path\.relative\(/.test(line) || /^\s*(\/\/|\*)/.test(line)) return
      // relToPages is only used to build an output NAME (its separators are replaced); the rest are paths
      // (findFiles' `rel` stays native: deriveRoute splits it on path.sep)
      if (/toPosix\(/.test(line) || /relToPages\s*=/.test(line) || /const rel\s*=/.test(line)) return
      // the multi-line call in discover.js: the toPosix( is on the previous line
      if (/toPosix\(\s*path\.relative\($/.test(lines[i - 1] ?? '') || /toPosix\(path\.relative\($/.test(lines[i - 1] ?? '')) return
      offenders.push(`${f}:${i + 1}: ${line.trim()}`)
    })
  }
  if (offenders.length) throw new Error(`path.relative result used without toPosix:\n${offenders.join('\n')}`)
})

test('spawnCommand: arguments arrive intact (spaces, ||, &, quotes, a trailing backslash), and npm can be started on every platform', async () => {
  const { spawnCommandSync, quoteWindowsArg } = await import('./spawn.js')
  // pure: the cmd.exe quoting
  if (quoteWindowsArg('zod@^3.25 || ^4.0') !== '"zod@^3.25 || ^4.0"') throw new Error('a range with spaces and || must be quoted')
  if (quoteWindowsArg('plain') !== 'plain') throw new Error('plain words stay unquoted')
  if (quoteWindowsArg('') !== '""') throw new Error('an empty argument must survive')
  if (quoteWindowsArg('say "hi"') !== '"say \\"hi\\""') throw new Error(`embedded quotes are escaped, got ${quoteWindowsArg('say "hi"')}`)
  if (quoteWindowsArg('C:\\a b\\') !== '"C:\\a b\\\\"') throw new Error(`a trailing backslash is doubled, got ${quoteWindowsArg('C:\\a b\\')}`)
  // end to end through a real child: on Windows this goes through cmd.exe (the case that broke), elsewhere through no shell
  const args = ['a b', 'zod@^3.25 || ^4.0', 'x&y', 'say "hi"', 'C:\\dir with space\\', '', '@modelcontextprotocol/sdk@^1.32.2']
  const r = spawnCommandSync(process.execPath, ['-e', 'console.log(JSON.stringify(process.argv.slice(1)))', ...args], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`child failed: ${r.stderr}`)
  if (r.stdout.trim() !== JSON.stringify(args)) throw new Error(`arguments changed in transit:\n  sent ${JSON.stringify(args)}\n  got  ${r.stdout.trim()}`)
  // npm is a .cmd shim on Windows: it must start
  const npm = spawnCommandSync('npm', ['--version'], { encoding: 'utf8' })
  if (npm.status !== 0 || !/^\d+\.\d+\.\d+/.test(npm.stdout.trim())) throw new Error(`npm --version: status ${npm.status}, ${npm.stdout} ${npm.stderr} ${npm.error ?? ''}`)
})

test('a pulse.config.js that cannot be loaded, or has a bad port, stops the CLI with a clear message (it used to be ignored silently)', async () => {
  const { spawnSync } = await import('child_process')
  const { mkdtempSync, rmSync, writeFileSync, mkdirSync } = await import('fs')
  const os = await import('os')
  const cli = path.join(__dirname, 'index.js')
  const project = (config) => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'pulse-badcfg-'))
    mkdirSync(path.join(dir, 'src', 'pages'), { recursive: true })
    writeFileSync(path.join(dir, 'pulse.config.js'), config)
    return dir
  }
  const run = (dir, ...a) => spawnSync(process.execPath, [cli, ...a], { cwd: dir, encoding: 'utf8', timeout: 30000, env: { ...process.env, PORT: '' } })
  for (const [label, config, expected] of [
    ['a syntax error',  'export default { port: 3001, ',                  /pulse\.config\.js could not be loaded/],
    ['a string port',   "export default { port: 'abc' }",                 /port must be a whole number from 1 to 65535 \(got "abc"\)/],
    ['a huge port',     'export default { port: 70000 }',                 /port must be a whole number/],
    ['not an object',   'export default 42',                              /must export an object/],
    ['an unknown agent', "export default { agent: 'gpt' }",               /agent must be 'claude' or 'copilot'/],
  ]) {
    const dir = project(config)
    try {
      for (const command of [['stop'], ['dev']]) {
        const r = run(dir, ...command)
        if (r.status !== 1) throw new Error(`${label} / pulse ${command[0]}: expected exit 1, got ${r.status}\n${r.stdout}${r.stderr}`)
        if (!expected.test(r.stderr)) throw new Error(`${label} / pulse ${command[0]}: expected ${expected}, got: ${r.stderr}`)
        if (/\n\s+at /.test(r.stderr)) throw new Error(`${label}: no stack trace expected, got: ${r.stderr}`)
      }
    } finally { rmSync(dir, { recursive: true, force: true }) }
  }
})

test('unknown pulse.config.js keys are reported with a suggestion (a typo used to be ignored silently)', async () => {
  const { unknownConfigKeys, KNOWN_CONFIG_KEYS } = await import('./config.js')
  const found = unknownConfigKeys({ prot: 4000, port: 3000, hsts: false, defaultCahce: 60, wibble: 1, _mine: true, allowedHosts: [] })
  assert.deepEqual(found, [
    { key: 'prot', suggestion: 'port' },
    { key: 'defaultCahce', suggestion: 'defaultCache' },
    { key: 'wibble', suggestion: null },
  ])
  for (const k of ['port', 'host', 'agent', 'design', 'csp', 'live', 'hsts', 'allowedHosts', 'lighthouse', 'load', 'environments', 'routes', 'reportFeedback', 'origin', 'maxBody', 'trailingSlash']) {
    assert.ok(KNOWN_CONFIG_KEYS.has(k), `${k} must be a known key`)
  }
  // The keys the CLI forwards to createServer must all be known, or the warning would cry wolf.
  const { readFileSync } = await import('fs')
  for (const file of ['start.js', 'dev.js']) {
    const text = readFileSync(path.join(__dirname, file), 'utf8')
    const list = text.match(/\[('redirects'[^\]]*)\]/)?.[1] || ''
    for (const k of list.match(/'(\w+)'/g).map(x => x.slice(1, -1))) assert.ok(KNOWN_CONFIG_KEYS.has(k), `${file} forwards ${k}, which the warning would call unknown`)
  }
})

test('a CLI command prints the unknown-key warning once and carries on', async () => {
  const { spawnSync } = await import('child_process')
  const { mkdtempSync, rmSync, writeFileSync, mkdirSync } = await import('fs')
  const os = await import('os')
  const dir = mkdtempSync(path.join(os.tmpdir(), 'pulse-unkcfg-'))
  try {
    mkdirSync(path.join(dir, 'src', 'pages'), { recursive: true })
    writeFileSync(path.join(dir, 'pulse.config.js'), 'export default { prot: 4000 }\n')
    const r = spawnSync(process.execPath, [path.join(__dirname, 'index.js'), 'stop', '--port', '47399'], { cwd: dir, encoding: 'utf8', timeout: 30000, env: { ...process.env, PORT: '' } })
    assert.match(r.stderr, /"prot" is not a Pulse option and is ignored\. Did you mean "port"\?/)
    assert.equal((r.stderr.match(/"prot"/g) || []).length, 1, 'reported once')
    assert.notEqual(r.status, 1, `the command should still run: ${r.stderr}`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('a spec that fails validation at startup is reported with its route and file, and no stack trace', async () => {
  const { spawnSync } = await import('child_process')
  const { mkdtempSync, rmSync, writeFileSync, mkdirSync } = await import('fs')
  const os = await import('os')
  const dir = mkdtempSync(path.join(os.tmpdir(), 'pulse-badspec-'))
  try {
    mkdirSync(path.join(dir, 'src', 'pages'), { recursive: true })
    writeFileSync(path.join(dir, 'src', 'pages', 'broken.js'), "export default { route: '/broken', meta: { title: 't', description: 'd', theme: 'light' } }\n")
    const r = spawnSync(process.execPath, [path.join(__dirname, 'index.js'), 'dev', '--port', '47321'], { cwd: dir, encoding: 'utf8', timeout: 30000, env: { ...process.env, PORT: '' } })
    if (r.status !== 1) throw new Error(`expected exit 1, got ${r.status}\n${r.stdout}${r.stderr}`)
    if (!new RegExp('Invalid spec for route "/broken" in src[\\\\/]pages[\\\\/]broken\\.js').test(r.stderr)) throw new Error(`the route and the file must be named: ${r.stderr}`)
    if (!/spec\.view is required/.test(r.stderr)) throw new Error(`the reason must be given: ${r.stderr}`)
    if (/\n\s+at /.test(r.stderr)) throw new Error(`no stack trace expected: ${r.stderr}`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('the published package stays small: no images or media, no tests, no archived files, under a size budget (it shipped 10 MB of demo photos)', async () => {
  const { spawnCommandSync } = await import('./spawn.js')
  const r = spawnCommandSync('npm', ['pack', '--dry-run', '--json'], { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8', timeout: 60000 })
  if (r.status !== 0) throw new Error(`npm pack failed: ${r.stderr}`)
  const pack = JSON.parse(r.stdout)[0]
  const bad = pack.files.map(f => f.path).filter(f => /\.(jpe?g|png|gif|webp|avif|svg|mp4|mov|woff2?|ttf)$/i.test(f) || /\.test\.js$/.test(f) || /\.archive\./.test(f) || /^types\/checks\//.test(f))
  if (bad.length) throw new Error(`these must not ship in the package: ${bad.join(', ')}`)
  const MB = 1024 * 1024
  if (pack.unpackedSize > 3 * MB) throw new Error(`the package unpacks to ${(pack.unpackedSize / MB).toFixed(1)} MB; the budget is 3 MB (it is about 1.5 MB). If this growth is intended, raise the budget on purpose.`)
})

test('the scaffolded PostToolUse hook does not run a file name as a shell command (a file called x$(cmd).js ran cmd)', async () => {
  if (process.platform === 'win32') return    // the injection is a POSIX-shell expansion; the Windows shell does not expand $( )
  const { scaffold } = modules[0].value
  const { mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync } = await import('fs')
  const { spawnSync } = await import('child_process')
  const os = await import('os')
  const dir = mkdtempSync(path.join(os.tmpdir(), 'pulse-hook-'))
  try {
    await scaffold(dir, { name: 'demo' })
    const settings = JSON.parse(readFileSync(path.join(dir, '.claude/settings.json'), 'utf8'))
    const hook = settings.hooks.PostToolUse.flatMap(h => h.hooks.map(x => ({ matcher: h.matcher, command: x.command }))).find(h => /node --check|'--check'/.test(h.command))
    if (!hook) throw new Error('the syntax-check hook is missing from the scaffold')
    const victim = path.join(dir, 'PWNED_BY_FILENAME')
    const file = path.join(dir, 'src/pages', `x$(touch ${victim}).js`)
    const run = (f) => spawnSync('sh', ['-c', hook.command], { input: JSON.stringify({ tool_input: { file_path: f } }), encoding: 'utf8', cwd: dir })
    const r = run(file)
    if (existsSync(victim)) throw new Error('the hook ran the command embedded in the file name')
    if (!/SYNTAX ERROR/.test(r.stdout)) throw new Error(`a missing file should be reported as a syntax error, got: ${r.stdout} ${r.stderr}`)
    // and it still does its job on a real page
    writeFileSync(path.join(dir, 'src/pages/ok.js'), 'export default { route: "/ok" }\n')
    if (!/Syntax OK/.test(run(path.join(dir, 'src/pages/ok.js')).stdout)) throw new Error('a valid page should report Syntax OK')
    writeFileSync(path.join(dir, 'src/pages/bad.js'), 'export default {\n')
    if (!/SYNTAX ERROR/.test(run(path.join(dir, 'src/pages/bad.js')).stdout)) throw new Error('a broken page should report a syntax error')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('migrations: the new-doc-page skill is removed from a project when unmodified, kept when edited', async () => {
  const { migrateProject, removeStaleSkills, REMOVED_SKILLS } = await import('./migrations.js')
  const { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync: exists } = await import('fs')
  const os = await import('os')
  const crypto = await import('crypto')
  // Rebuild the shipped file from git history is brittle; instead check the hash really is of a file with the expected shape.
  assert.match(REMOVED_SKILLS[0].sha256, /^[0-9a-f]{64}$/)
  const dir = mkdtempSync(path.join(os.tmpdir(), 'pulse-skill-'))
  try {
    const skill = path.join(dir, '.copilot', 'skills', 'new-doc-page')
    mkdirSync(skill, { recursive: true })
    writeFileSync(path.join(skill, 'SKILL.md'), '# my own notes about docs\n')          // user-edited: hash differs
    assert.deepEqual(removeStaleSkills(dir), [])
    assert.ok(exists(path.join(skill, 'SKILL.md')), 'an edited copy must be left alone')
    assert.deepEqual(migrateProject(dir), [])

    // The unmodified copy goes (tested with a stand-in of known content), and its empty folder with it.
    const body = '---\nname: new-doc-page\n---\nstand-in\n'
    writeFileSync(path.join(skill, 'SKILL.md'), body)
    const list = [{ ...REMOVED_SKILLS[0], sha256: crypto.createHash('sha256').update(body).digest('hex') }]
    assert.deepEqual(removeStaleSkills(dir, list), [path.join('.copilot', 'skills', 'new-doc-page', 'SKILL.md')])
    assert.ok(!exists(skill), 'the empty skill folder is removed too')
    assert.deepEqual(removeStaleSkills(dir, list), [], 'a second run is a no-op')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('migrations: the vulnerable hook is rewritten, the rule and the gitignore line are added once, nothing else changes, and a second run is a no-op', async () => {
  const { fixSettings, addUntrustedSection, addGitignoreLine, migrateProject, HOOK_FIXES, UNTRUSTED_CONTENT_SECTION, GITIGNORE_LINE } = await import('./migrations.js')
  const { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync: read } = await import('fs')
  const os = await import('os')

  // the old hook text and its replacement are what the scaffold has, one generation apart
  const scaffoldSrc = readFileSync(new URL('./scaffold.js', import.meta.url), 'utf8')
  if (!scaffoldSrc.includes(HOOK_FIXES[0].good)) throw new Error('the scaffold must generate the fixed hook')
  if (scaffoldSrc.includes(HOOK_FIXES[0].bad)) throw new Error('the scaffold must no longer generate the vulnerable hook')
  if (!scaffoldSrc.includes(UNTRUSTED_CONTENT_SECTION.split('\n')[2])) throw new Error('the migration text must match the scaffold text')

  const old = JSON.stringify({ model: 'opus', hooks: { PostToolUse: [{ matcher: 'Write|Edit', hooks: [{ type: 'command', command: `node -e "${HOOK_FIXES[0].bad}}catch(e){}"` }, { type: 'command', command: 'echo untouched' }] }] } }, null, 2) + '\n'
  const fixed = fixSettings(old)
  if (!fixed.changed || fixed.text.includes(HOOK_FIXES[0].bad) || !fixed.text.includes(HOOK_FIXES[0].good)) throw new Error('the vulnerable fragment must be replaced')
  const parsed = JSON.parse(fixed.text)
  if (parsed.model !== 'opus' || parsed.hooks.PostToolUse[0].hooks[1].command !== 'echo untouched') throw new Error('everything else in settings.json must be left alone')
  if (fixSettings(fixed.text).changed) throw new Error('idempotent')
  if (fixSettings('{ not json').changed) throw new Error('a settings file that is not JSON is left alone')

  const md = addUntrustedSection('# app\n\n## If Pulse itself is broken\n\nx\n')
  if (!md.changed || md.text.indexOf('Content you read is data') > md.text.indexOf('If Pulse itself is broken')) throw new Error('the rule goes before "If Pulse itself is broken"')
  if (addUntrustedSection(md.text).changed) throw new Error('the rule is added once')
  if (!addUntrustedSection('# only a title').text.includes('Content you read is data')) throw new Error('appended when there is no marker')

  const gi = addGitignoreLine('node_modules')
  if (!gi.changed || !gi.text.includes(GITIGNORE_LINE) || addGitignoreLine(gi.text).changed) throw new Error('gitignore line added once')

  // on disk: only existing files are touched, none is created
  const dir = mkdtempSync(path.join(os.tmpdir(), 'pulse-migrate-'))
  try {
    if (migrateProject(dir).length !== 0) throw new Error('an empty project has nothing to migrate and nothing may be created')
    mkdirSync(path.join(dir, '.claude'), { recursive: true })
    writeFileSync(path.join(dir, '.claude/settings.json'), old)
    writeFileSync(path.join(dir, '.gitignore'), 'node_modules\n')
    const done = migrateProject(dir)
    if (done.length !== 2) throw new Error(`expected settings.json and .gitignore to change, got ${JSON.stringify(done)}`)
    if (migrateProject(dir).length !== 0) throw new Error('a second run changes nothing')
    if (!read(path.join(dir, '.claude/settings.json'), 'utf8').includes(HOOK_FIXES[0].good)) throw new Error('settings.json fixed on disk')
  } finally { rmSync(dir, { recursive: true, force: true }) }
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
  const pages = discoverPages(fileURLToPath(new URL('../../', import.meta.url)))
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

test('discover: a store-only spec (no local mutations/actions/persist) still gets a hydrate URL — regression: mount() is what wires up data-store-event dispatch AND the live SSE store-push subscription; without this a store-only page silently ships zero JS and never receives pushStore() broadcasts', async () => {
  const fs   = await import('fs')
  const os   = await import('os')
  const path = await import('path')
  const { loadPages } = modules[1].value

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-discover-store-test-'))
  fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'src', 'pages', 'storey.js'),
    `export default {\n  route: '/storey',\n  store: ['count'],\n  state: {},\n  view: (state, server) => \`\${server.count}\`,\n}\n`
  )

  const specs = await loadPages(root)
  const storey = specs.find(s => s.route === '/storey')
  fs.rmSync(root, { recursive: true, force: true })

  if (!storey) throw new Error('loadPages did not find the /storey spec')
  if (!storey.hydrate) throw new Error('store-only spec should have gotten a hydrate URL, got: ' + storey.hydrate)
})

// ---------------------------------------------------------------------------
// Skill source files

console.log('\nCopilot skill source files\n')

const skillsDir = fileURLToPath(new URL('../agent/skills', import.meta.url))
const requiredSkills = ['build-page', 'verify']

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
// pulse start — PORT env var override warning
// ---------------------------------------------------------------------------
// Regression: found via a real dogfooding session. A `PORT` env var set on the
// local machine for unrelated reasons (common in sandboxes/CI) silently
// overrode --port with no explanation, even though this exact --port usage is
// the documented local /verify convention (pulse-start.md). The behavior
// (PORT always wins — correct for real PaaS deployment) is unchanged; this
// only adds a visible warning when the override actually happens.

{
  console.log('\npulse start — PORT env var override\n')

  const { spawnSync } = await import('child_process')
  const os             = (await import('os')).default
  const fsMod          = await import('fs')

  function scaffoldMinimalBuiltProject() {
    const dir = fsMod.mkdtempSync(path.join(os.tmpdir(), 'pulse-start-test-'))
    fsMod.mkdirSync(path.join(dir, 'src', 'pages'), { recursive: true })
    fsMod.mkdirSync(path.join(dir, 'public', 'dist'), { recursive: true })
    fsMod.writeFileSync(path.join(dir, 'src', 'pages', 'home.js'),
      `export default { route: '/', state: {}, view: () => '<main id="main-content">hi</main>' }`)
    // start.js only needs public/dist/ + manifest.json to exist to pass its
    // pre-flight checks — a real build isn't necessary to test port selection.
    fsMod.writeFileSync(path.join(dir, 'public', 'dist', 'manifest.json'), '{}')
    return dir
  }

  const startScriptPath = path.join(__dirname, 'start.js')

  function runStart(dir, portFlag, env) {
    const args = ['--root', dir]
    if (portFlag) args.push('--port', String(portFlag))
    return spawnSync(process.execPath, [startScriptPath, ...args], {
      encoding: 'utf8',
      timeout: 5000,
      env: { ...process.env, ...env },
    })
  }

  test('warns to stderr when PORT env var overrides an explicit --port flag', () => {
    const dir = scaffoldMinimalBuiltProject()
    try {
      const result = runStart(dir, 3001, { PORT: '9999' })
      if (!result.stderr.includes('PORT=9999') || !result.stderr.includes('overrides --port 3001'))
        throw new Error(`Expected an override warning naming both ports, got stderr: ${result.stderr}`)
    } finally {
      cleanupTmpDir(dir)
    }
  })

  test('no warning when PORT env var matches the requested --port', () => {
    const dir = scaffoldMinimalBuiltProject()
    try {
      const result = runStart(dir, 3001, { PORT: '3001' })
      if (result.stderr.includes('overrides --port'))
        throw new Error(`Should not warn when PORT matches --port, got stderr: ${result.stderr}`)
    } finally {
      cleanupTmpDir(dir)
    }
  })

  test('no warning when PORT is unset and only --port is used', () => {
    const dir = scaffoldMinimalBuiltProject()
    const env = { ...process.env }
    delete env.PORT
    try {
      const result = spawnSync(process.execPath, [startScriptPath, '--root', dir, '--port', '3001'], {
        encoding: 'utf8', timeout: 5000, env,
      })
      if (result.stderr.includes('overrides --port'))
        throw new Error(`Should not warn when PORT is unset, got stderr: ${result.stderr}`)
    } finally {
      cleanupTmpDir(dir)
    }
  })

  function cleanupTmpDir(dir) {
    fsMod.rmSync(dir, { recursive: true, force: true })
  }
}

await Promise.all(pending)

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
