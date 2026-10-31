import { test } from 'node:test'
import assert   from 'node:assert/strict'
import fs       from 'node:fs'
import os       from 'node:os'
import path     from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { CLIENTS, serverEntry, configTargets, mergeEntry, snippet, writeConfig, ignoreInGit } from './init-ai.js'

const CLI = fileURLToPath(new URL('./index.js', import.meta.url))
const tmp = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix))
const LAUNCH = { root: '/p', serverPath: '/p/node_modules/@invisibleloop/pulse/src/mcp/server.js', nodeArgs: ['--preserve-symlinks'], execPath: '/usr/bin/node' }

test('the clients are the ones that read their own config file', () => {
  assert.deepEqual(CLIENTS, ['cursor', 'windsurf', 'claude-desktop'])
})

test('serverEntry runs the project\'s MCP server with absolute paths; only Cursor gets type stdio', () => {
  const cursor = serverEntry('cursor', LAUNCH)
  assert.deepEqual(cursor, { type: 'stdio', command: '/usr/bin/node', args: ['--preserve-symlinks', LAUNCH.serverPath, '--root', '/p'] })
  assert.equal('type' in serverEntry('claude-desktop', LAUNCH), false)
  assert.equal('type' in serverEntry('windsurf', LAUNCH), false)
})

test('configTargets: Cursor has a project file and a global file, both writable', () => {
  const t = configTargets('cursor', { root: '/p', home: '/h' })
  assert.equal(t.writable, true)
  assert.deepEqual(t.files.map(f => f.file), [path.join('/p', '.cursor', 'mcp.json'), path.join('/h', '.cursor', 'mcp.json')])
})

test('configTargets: Claude Desktop uses each system\'s own path, and says to quit it completely', () => {
  const file = (platform, extra = {}) => configTargets('claude-desktop', { root: '/p', home: '/h', platform, ...extra }).files[0].file
  assert.equal(file('darwin'), path.join('/h', 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'))
  assert.equal(file('win32', { appData: 'C:\\Users\\a\\AppData\\Roaming' }), path.join('C:\\Users\\a\\AppData\\Roaming', 'Claude', 'claude_desktop_config.json'))
  assert.equal(file('linux'), path.join('/h', '.config', 'Claude', 'claude_desktop_config.json'))
  assert.match(configTargets('claude-desktop', { root: '/p', home: '/h', platform: 'darwin' }).after, /Quit Claude Desktop completely/)
})

test('configTargets: Windsurf is not writable, because its docs name two files', () => {
  const t = configTargets('windsurf', { root: '/p', home: '/h', platform: 'linux', xdg: undefined })
  assert.equal(t.writable, false)
  assert.deepEqual(t.files.map(f => f.file), [path.join('/h', '.config', 'devin', 'mcp_config.json'), path.join('/h', '.codeium', 'windsurf', 'mcp_config.json')])
  assert.match(t.note, /two files/)
  assert.equal(configTargets('windsurf', { root: '/p', home: '/h', platform: 'linux', xdg: '/x' }).files[0].file, path.join('/x', 'devin', 'mcp_config.json'))
})

test('mergeEntry creates a config, keeps other servers and keys, and replaces an old pulse entry', () => {
  const entry = { command: 'node', args: ['a'] }
  const created = mergeEntry(null, entry)
  assert.deepEqual(JSON.parse(created.text), { mcpServers: { pulse: entry } })
  assert.equal(created.replaced, false)

  const existing = JSON.stringify({ theme: 'dark', mcpServers: { other: { command: 'npx' }, pulse: { command: 'old' } } })
  const merged = mergeEntry(existing, entry)
  const out = JSON.parse(merged.text)
  assert.equal(out.theme, 'dark')
  assert.deepEqual(out.mcpServers.other, { command: 'npx' })
  assert.deepEqual(out.mcpServers.pulse, entry)
  assert.equal(merged.replaced, true)
  assert.equal(mergeEntry('   \n', entry).ok, true, 'an empty file is treated as no file')
})

test('mergeEntry refuses a file it cannot read as a config, rather than overwrite it', () => {
  const entry = { command: 'node' }
  assert.match(mergeEntry('{ not json', entry).reason, /not valid JSON/)
  assert.match(mergeEntry('[1,2]', entry).reason, /JSON object/)
  assert.match(mergeEntry('{"mcpServers": []}', entry).reason, /not an object/)
  assert.match(mergeEntry('{"mcpServers": null}', entry).reason, /not an object/)
})

test('writeConfig backs up the old file first, and writes nothing when the file is unreadable', () => {
  const dir = tmp('pulse-initai-')
  try {
    const file = path.join(dir, 'sub', 'mcp.json')
    const first = writeConfig(file, { command: 'node' })
    assert.equal(first.wrote, true)
    assert.equal(first.backup, null, 'no file before, so nothing to back up')

    const before = fs.readFileSync(file, 'utf8')
    const second = writeConfig(file, { command: 'node2' })
    assert.equal(second.replaced, true)
    assert.equal(fs.readFileSync(second.backup, 'utf8'), before)

    fs.writeFileSync(file, '{ broken')
    const refused = writeConfig(file, { command: 'node3' })
    assert.equal(refused.wrote, false)
    assert.equal(fs.readFileSync(file, 'utf8'), '{ broken', 'the file is untouched')
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})

test('ignoreInGit adds the line once, and only to a project that has a .gitignore', () => {
  const dir = tmp('pulse-initai-git-')
  try {
    assert.equal(ignoreInGit(dir, '.cursor/mcp.json'), false, 'no .gitignore, nothing to edit')
    fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules')
    assert.equal(ignoreInGit(dir, '.cursor/mcp.json'), true)
    assert.equal(ignoreInGit(dir, '.cursor/mcp.json'), false)
    assert.equal(fs.readFileSync(path.join(dir, '.gitignore'), 'utf8'), 'node_modules\n.cursor/mcp.json\n')
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})

test('snippet is a whole config holding only the pulse entry', () => {
  assert.deepEqual(JSON.parse(snippet({ command: 'node' })), { mcpServers: { pulse: { command: 'node' } } })
})

// ── the command, run for real with HOME pointed at an empty folder ───────────

function project() {
  const root = tmp('pulse-initai-proj-')
  fs.writeFileSync(path.join(root, 'pulse.config.js'), 'export default {}\n')
  fs.writeFileSync(path.join(root, 'package.json'), '{"type":"module"}')
  const home = tmp('pulse-initai-home-')
  return { root, home, cleanup: () => { fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(home, { recursive: true, force: true }) } }
}

const run = (args, { root, home }) => spawnSync(process.execPath, [CLI, ...args], {
  cwd: root, encoding: 'utf8', timeout: 20000,
  env: { ...process.env, HOME: home, USERPROFILE: home, APPDATA: path.join(home, 'AppData', 'Roaming') },
})

test('pulse init-ai <client> prints the entry and the file, and writes nothing', () => {
  const p = project()
  try {
    const r = run(['init-ai', 'cursor'], p)
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stdout, /"mcpServers"/)
    assert.match(r.stdout, /"type": "stdio"/)
    assert.match(r.stdout, /--write/)
    assert.equal(fs.existsSync(path.join(p.root, '.cursor')), false)
    assert.equal(fs.existsSync(path.join(p.home, '.cursor')), false)
  } finally { p.cleanup() }
})

test('pulse init-ai cursor --global --write merges into the existing file and keeps a backup', () => {
  const p = project()
  try {
    const file = path.join(p.home, '.cursor', 'mcp.json')
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify({ mcpServers: { other: { command: 'npx' } } }))
    const r = run(['init-ai', 'cursor', '--write', '--global'], p)
    assert.equal(r.status, 0, r.stderr)
    const out = JSON.parse(fs.readFileSync(file, 'utf8'))
    assert.deepEqual(Object.keys(out.mcpServers).sort(), ['other', 'pulse'])
    assert.equal(out.mcpServers.pulse.type, 'stdio')
    assert.equal(fs.existsSync(`${file}.pulse-backup`), true)
  } finally { p.cleanup() }
})

test('pulse init-ai cursor --write puts the file in the project and keeps it out of git', () => {
  const p = project()
  try {
    fs.writeFileSync(path.join(p.root, '.gitignore'), 'node_modules\n')
    const r = run(['init-ai', 'cursor', '--write'], p)
    assert.equal(r.status, 0, r.stderr)
    assert.equal(fs.existsSync(path.join(p.root, '.cursor', 'mcp.json')), true)
    assert.match(fs.readFileSync(path.join(p.root, '.gitignore'), 'utf8'), /^\.cursor\/mcp\.json$/m)
    assert.equal(fs.existsSync(path.join(p.home, '.cursor')), false, 'the global file is not touched')
  } finally { p.cleanup() }
})

test('pulse init-ai windsurf --write refuses and writes no file; an unknown client is an error', () => {
  const p = project()
  try {
    const w = run(['init-ai', 'windsurf', '--write'], p)
    assert.equal(w.status, 1)
    assert.match(w.stderr, /two files/)
    assert.match(w.stderr, /"mcpServers"/, 'it still shows the entry to add by hand')
    assert.equal(fs.existsSync(path.join(p.home, '.codeium')), false)
    assert.equal(fs.existsSync(path.join(p.home, '.config')), false)
    const bad = run(['init-ai', 'vim'], p)
    assert.equal(bad.status, 1)
    assert.match(bad.stderr, /Unknown client "vim"/)
  } finally { p.cleanup() }
})

test('pulse init-ai outside a Pulse project is an error', () => {
  const root = tmp('pulse-initai-none-'), home = tmp('pulse-initai-nohome-')
  try {
    const r = run(['init-ai', 'cursor'], { root, home })
    assert.equal(r.status, 1)
    assert.match(r.stderr, /Not a Pulse project/)
  } finally { fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(home, { recursive: true, force: true }) }
})
