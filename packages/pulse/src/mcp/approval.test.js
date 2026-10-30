/**
 * Approval gates and tool containment — run with: node src/mcp/approval.test.js
 *
 * Drives the real MCP server over stdio, as a client would, including a client that supports
 * elicitation (the server asks the user through the client) and one that does not.
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import fs       from 'node:fs'
import os       from 'node:os'
import path     from 'node:path'
import http     from 'node:http'
import readline from 'node:readline'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createApprovals, askUser } from './approval.js'
import { previewId, buildReport } from '../cli/feedback.js'

const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'server.js')
const tmp = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix))

// ── unit: the nonce store ───────────────────────────────────────────────────

test('approvals: a nonce is single-use, expires, and is bound to its kind and subject', () => {
  let t = 1000
  const a = createApprovals({ ttlMs: 60_000, now: () => t })
  const id = a.issue('report', 'subject-1')
  assert.equal(a.consume('report', id, 'subject-1'), true, 'valid once')
  assert.equal(a.consume('report', id, 'subject-1'), false, 'and only once')

  const id2 = a.issue('report', 'subject-1')
  assert.equal(a.consume('update', id2, 'subject-1'), false, 'not for another kind')
  assert.equal(a.consume('report', id2, 'subject-1'), false, 'and a failed attempt burns it')

  const id3 = a.issue('report', 'subject-1')
  assert.equal(a.consume('report', id3, 'another report'), false, 'not for a different report')

  const id4 = a.issue('report', 's')
  t += 61_000
  assert.equal(a.consume('report', id4, 's'), false, 'expired')
  for (const forged of [undefined, null, '', 'abc', previewId({ title: 'x' })]) assert.equal(a.consume('report', forged, 's'), false, `forged ${forged}`)
})

test('askUser: unsupported without the capability, approved/declined from the answer, declined on error', async () => {
  const mk = (capabilities, impl) => ({ server: { getClientCapabilities: () => capabilities, elicitInput: impl } })
  assert.equal(await askUser(mk({}, async () => ({ action: 'accept', content: { approve: true } })), 'ok?'), 'unsupported')
  assert.equal(await askUser(mk({ elicitation: {} }, async () => ({ action: 'accept', content: { approve: true } })), 'ok?'), 'approved')
  assert.equal(await askUser(mk({ elicitation: {} }, async () => ({ action: 'accept', content: { approve: false } })), 'ok?'), 'declined')
  assert.equal(await askUser(mk({ elicitation: {} }, async () => ({ action: 'decline' })), 'ok?'), 'declined')
  assert.equal(await askUser(mk({ elicitation: {} }, async () => ({ action: 'cancel' })), 'ok?'), 'declined')
  assert.equal(await askUser(mk({ elicitation: {} }, async () => { throw new Error('boom') }), 'ok?'), 'declined')
})

// ── a small MCP client ──────────────────────────────────────────────────────

function startClient(root, { elicit = null } = {}) {
  const proc = spawn(process.execPath, [SERVER, '--root', root], { stdio: ['pipe', 'pipe', 'ignore'] })
  const waiting = new Map()
  let nextId = 1
  const elicitations = []
  const send = (m) => proc.stdin.write(JSON.stringify(m) + '\n')
  readline.createInterface({ input: proc.stdout }).on('line', (line) => {
    let m; try { m = JSON.parse(line) } catch { return }
    if (m.method === 'elicitation/create') {            // the server asking the user through us
      elicitations.push(m.params.message)
      send({ jsonrpc: '2.0', id: m.id, result: elicit(m.params) })
    } else if (m.id !== undefined && waiting.has(m.id)) {
      waiting.get(m.id)(m); waiting.delete(m.id)
    }
  })
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = nextId++
    const timer = setTimeout(() => reject(new Error(`no response to ${method}`)), 20_000)
    waiting.set(id, (m) => { clearTimeout(timer); resolve(m) })
    send({ jsonrpc: '2.0', id, method, params })
  })
  const ready = request('initialize', {
    protocolVersion: '2025-06-18', clientInfo: { name: 'test', version: '1' },
    capabilities: elicit ? { elicitation: {} } : {},
  }).then(() => send({ jsonrpc: '2.0', method: 'notifications/initialized' }))
  return {
    elicitations,
    async call(name, args) { await ready; return (await request('tools/call', { name, arguments: args })).result },
    async list() { await ready; return (await request('tools/list', {})).result.tools },
    close() { proc.kill() },
  }
}

const textOf = (r) => r.content[0].text

/** A feedback service that counts what it is sent. */
async function startSink() {
  const posts = []
  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      posts.push(body)
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ url: 'https://github.com/invisibleloop/pulse-framework/issues/1', number: 1 }))
    })
  })
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  return { posts, endpoint: `http://127.0.0.1:${server.address().port}/report`, close: () => new Promise(r => server.close(r)) }
}

const REPORT = { title: 'Button renders empty', description: 'button({ label }) renders no text.', expected: 'a label', actual: 'nothing' }

function reportProject(endpoint) {
  const root = tmp('pulse-approval-')
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"p","type":"module","dependencies":{"@invisibleloop/pulse":"*"}}')
  fs.writeFileSync(path.join(root, 'pulse.config.js'), `export default { reportEndpoint: ${JSON.stringify(endpoint)} }\n`)
  return root
}

const idFrom = (previewText) => previewText.match(/previewId: "([^"]+)"/)?.[1]

// ── pulse_report_issue ──────────────────────────────────────────────────────

test('report_issue without elicitation: a forged or recomputed id sends nothing; the issued id works once', async () => {
  const sink = await startSink(), root = reportProject(sink.endpoint), client = startClient(root)
  try {
    const preview = textOf(await client.call('pulse_report_issue', REPORT))
    assert.match(preview, /has NOT been sent/)
    const issued = idFrom(preview)
    assert.ok(issued && issued.length >= 12, 'a random id is issued')

    // the OLD id: a hash of the payload, which anyone who can read the preview could compute
    const payload = buildReport(REPORT, { version: '0.26.4', root }).payload
    const oldStyle = previewId(payload)
    assert.notEqual(issued, oldStyle, 'the id is no longer derived from the report')
    const forged = textOf(await client.call('pulse_report_issue', { ...REPORT, confirmed: true, previewId: oldStyle }))
    assert.match(forged, /^Not sent/)
    assert.equal(sink.posts.length, 0, 'nothing was sent for a forged id')

    const sent = textOf(await client.call('pulse_report_issue', { ...REPORT, confirmed: true, previewId: issued }))
    assert.match(sent, /issues\/1/, sent)
    assert.equal(sink.posts.length, 1)

    const replay = textOf(await client.call('pulse_report_issue', { ...REPORT, confirmed: true, previewId: issued }))
    assert.match(replay, /^Not sent/)
    assert.equal(sink.posts.length, 1, 'an id cannot be replayed')

    // an id for one report does not publish another
    const other = idFrom(textOf(await client.call('pulse_report_issue', { ...REPORT, title: 'A different report entirely' })))
    const swapped = textOf(await client.call('pulse_report_issue', { ...REPORT, title: 'A third, unrelated report', confirmed: true, previewId: other }))
    assert.match(swapped, /^Not sent/)
    assert.equal(sink.posts.length, 1)
  } finally { client.close(); await sink.close(); fs.rmSync(root, { recursive: true, force: true }) }
})

test('report_issue with elicitation: the user is asked through the client, and a declined report is not sent', async () => {
  const sink = await startSink(), root = reportProject(sink.endpoint)
  let answer = { action: 'decline' }
  const client = startClient(root, { elicit: () => answer })
  try {
    const id = idFrom(textOf(await client.call('pulse_report_issue', REPORT)))
    const declined = await client.call('pulse_report_issue', { ...REPORT, confirmed: true, previewId: id })
    assert.match(textOf(declined), /user did not approve/)
    assert.equal(sink.posts.length, 0, 'declined: nothing sent')
    assert.equal(client.elicitations.length, 1)
    assert.match(client.elicitations[0], /Button renders empty/, 'the user sees the report itself')
    assert.match(client.elicitations[0], /PUBLIC issue/, 'and that it becomes public')

    answer = { action: 'accept', content: { approve: true } }
    const id2 = idFrom(textOf(await client.call('pulse_report_issue', REPORT)))
    assert.match(textOf(await client.call('pulse_report_issue', { ...REPORT, confirmed: true, previewId: id2 })), /issues\/1/)
    assert.equal(sink.posts.length, 1, 'approved by the user: sent')

    answer = { action: 'accept', content: { approve: false } }
    const id3 = idFrom(textOf(await client.call('pulse_report_issue', REPORT)))
    assert.match(textOf(await client.call('pulse_report_issue', { ...REPORT, confirmed: true, previewId: id3 })), /user did not approve/)
    assert.equal(sink.posts.length, 1, 'accepted the dialog but answered no: not sent')
  } finally { client.close(); await sink.close(); fs.rmSync(root, { recursive: true, force: true }) }
})

// ── pulse_update ────────────────────────────────────────────────────────────

test('pulse_update will not install on a bare confirmed:true; it needs the id its own preview issued', async () => {
  const root = tmp('pulse-update-gate-')
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"p","type":"module","dependencies":{"@invisibleloop/pulse":"*"}}')
  const client = startClient(root)
  try {
    const noId = textOf(await client.call('pulse_update', { confirmed: true }))
    assert.match(noId, /^Not updated: no valid preview/)
    const forged = textOf(await client.call('pulse_update', { confirmed: true, previewId: 'latest' }))
    assert.match(forged, /^Not updated: no valid preview/)
    assert.ok(!fs.existsSync(path.join(root, 'node_modules')), 'nothing was installed')
  } finally { client.close(); fs.rmSync(root, { recursive: true, force: true }) }
})

// ── tool metadata ───────────────────────────────────────────────────────────

test('tools that publish or install say so in their annotations; tools that run spec code say so in their descriptions', async () => {
  const root = tmp('pulse-meta-')
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"p","type":"module"}')
  const client = startClient(root)
  try {
    const tools = Object.fromEntries((await client.list()).map(t => [t.name, t]))
    assert.equal(tools.pulse_report_issue.annotations?.openWorldHint, true)
    assert.equal(tools.pulse_report_issue.annotations?.readOnlyHint, false)
    assert.equal(tools.pulse_update.annotations?.destructiveHint, true)
    assert.equal(tools.pulse_update.annotations?.openWorldHint, true)
    for (const name of ['pulse_validate', 'pulse_review', 'pulse_create_page']) {
      assert.match(tools[name].description, /runs the spec's JavaScript on this machine, unsandboxed/, `${name} must say it runs the code`)
    }
  } finally { client.close(); fs.rmSync(root, { recursive: true, force: true }) }
})

// ── symlinks ────────────────────────────────────────────────────────────────

test('create_page / create_tests do not follow a symlink out of the project', { skip: process.platform === 'win32' && 'file symlinks need privileges on Windows' }, async () => {
  const root = tmp('pulse-links-'), outside = tmp('pulse-outside-')
  fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"p","type":"module","dependencies":{"@invisibleloop/pulse":"*"}}')
  fs.writeFileSync(path.join(outside, 'creds'), 'aws_secret_access_key = SECRET_TOKEN_VALUE\n')
  fs.symlinkSync(path.join(outside, 'creds'), path.join(root, 'src', 'pages', 'creds.js'))
  fs.writeFileSync(path.join(root, 'src', 'pages', 'home.js'), "export default { route: '/', state: {}, mutations: { inc: s => s }, view: () => '<main></main>' }\n")
  fs.symlinkSync(path.join(outside, 'newfile'), path.join(root, 'src', 'pages', 'home.test.js'))     // dangling
  const client = startClient(root)
  try {
    const page = await client.call('pulse_create_page', { name: 'creds' })
    assert.match(textOf(page), /^Error: path must be inside the project/)
    assert.equal(page.isError, true)
    assert.ok(!textOf(page).includes('SECRET_TOKEN_VALUE'), 'no content of the linked file may be echoed')

    const tests = await client.call('pulse_create_tests', { file: 'src/pages/home.js' })
    assert.match(textOf(tests), /^Error:/)
    assert.ok(!fs.existsSync(path.join(outside, 'newfile')), 'nothing may be written through the link')
  } finally { client.close(); fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(outside, { recursive: true, force: true }) }
})

// ── pulse_restart_server acts only on this project's own server ──────────────

test('pulse_restart_server does not reload another project that holds the configured port; it starts its own server elsewhere', async () => {
  // A demo agent's restart reported "specs reloaded" for ste-demo, which held port 3000.
  const reloads = []
  const other = http.createServer((req, res) => { reloads.push(req.url); res.statusCode = 204; res.end() })
  await new Promise(r => other.listen(0, '127.0.0.1', r))
  const busy = other.address().port
  const root = tmp('pulse-restart-')
  fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"p","type":"module"}')
  fs.writeFileSync(path.join(root, 'pulse.config.js'), `export default { port: ${busy} }\n`)
  fs.writeFileSync(path.join(root, 'src/pages/home.js'), "export default { route: '/', view: () => '<main id=\"main-content\"><h1>Mine</h1></main>' }\n")
  const client = startClient(root)
  let pid = null
  try {
    const out = textOf(await client.call('pulse_restart_server', {}))
    assert.deepEqual(reloads, [], 'the other project must not be sent a reload')
    const record = JSON.parse(fs.readFileSync(path.join(root, '.pulse', 'dev.json'), 'utf8'))
    pid = record.pid
    assert.notEqual(record.port, busy, 'this project moves to its own port')
    assert.match(out, new RegExp(`started on port ${record.port}\\b`))
    assert.match(await (await fetch(`http://127.0.0.1:${record.port}/`)).text(), /Mine/)

    // A second call reloads the server that is this project's, and still never the other one.
    assert.match(textOf(await client.call('pulse_restart_server', {})), new RegExp(`reloaded \\(hot\\) on port ${record.port}\\b`))
    assert.deepEqual(reloads, [], 'still no reload sent to the other project')
  } finally {
    client.close()
    if (pid) {
      try { process.kill(pid, 'SIGTERM') } catch { /* already gone */ }
      // Windows will not remove a folder a running process still has open, so wait for it to end
      for (let i = 0; i < 50; i++) {
        try { process.kill(pid, 0) } catch { break }
        await new Promise(r => setTimeout(r, 100))
      }
    }
    await new Promise(r => other.close(r))
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  }
})
