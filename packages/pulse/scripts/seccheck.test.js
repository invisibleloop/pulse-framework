/**
 * Security checker tests — run with: node scripts/seccheck.test.js
 *
 * The checker must fail on an insecure server (otherwise a pass means nothing)
 * and pass on a Pulse server that has a CSRF-protected form.
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import http     from 'node:http'
import { runChecks, summarize } from './seccheck.js'
import { createServer } from '../src/server/index.js'

const byId = (results, id) => results.find(r => r.id === id)

test('seccheck: an insecure server fails the header, XSS, CSRF, cookie and exposure checks', async () => {
  const bad = http.createServer((req, res) => {
    const pathname = req.url.split('?')[0]
    res.setHeader('X-Powered-By', 'Express 4.17.1')
    res.setHeader('Set-Cookie', 'sid=abc')
    if (req.method === 'POST') { res.statusCode = 200; return res.end('saved') }
    if (pathname === '/.env') return res.end('SECRET=1')
    res.setHeader('content-type', 'text/html')
    // Always contains the hostile marker, as a reflecting page would, without echoing request data.
    res.end('<html><body><form method="POST" action="/c"><input name=a></form><svg onload=alert(1)></body></html>')
  })
  await new Promise(r => bad.listen(0, '127.0.0.1', r))
  try {
    const results = await runChecks(`http://127.0.0.1:${bad.address().port}`)
    for (const id of ['H1', 'H5', 'H6', 'H7', 'H8', 'H10', 'C1', 'X1', 'X2', 'F1', 'E1']) {
      assert.equal(byId(results, id).status, 'fail', `${id} should fail on the insecure server`)
    }
    assert.ok(summarize(results).failed.length >= 11)
  } finally {
    bad.close()
  }
})

test('seccheck: a default Pulse server with a CSRF-protected form passes every applicable check', async () => {
  const spec = {
    route: '/',
    meta: { title: 'Contact', description: 'Contact form', theme: 'dark' },
    submit: async (ctx) => { await ctx.formData(); return { redirect: '/' } },
    view: (_state, server) => `<main id="main-content"><form method="POST">${server.csrf}<input name="email"><button>Send</button></form></main>`,
  }
  const { server } = await createServer([spec], { port: 0, quiet: true })
  try {
    const results = await runChecks(`http://127.0.0.1:${server.address().port}`)
    const { failed } = summarize(results)
    assert.deepEqual(failed.map(f => `${f.id} ${f.note}`), [], 'Pulse defaults should pass every applicable check')
    assert.equal(byId(results, 'F1').status, 'pass', 'the form check must run, not be skipped')
  } finally {
    await new Promise(r => server.close(r))
  }
})
