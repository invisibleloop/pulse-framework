/**
 * Pulse — webmcp.js tests
 * run: node src/cli/webmcp.test.js
 */

import { test } from 'node:test'
import assert   from 'node:assert/strict'
import { webMcpFormProblems, webMcpToolCount } from './webmcp.js'

const errors = (html) => webMcpFormProblems(html).filter(p => p.level === 'error').map(p => p.message)
const warns  = (html) => webMcpFormProblems(html).filter(p => p.level === 'warn').map(p => p.message)

const GOOD = `<form method="POST" toolname="signup" tooldescription="Sign up for the newsletter">
  <input type="hidden" name="_csrf" value="t">
  <label for="e">Email</label><input id="e" name="email" type="email">
  <button type="submit">Sign up</button>
</form>`

test('a complete tool form has no problems and is counted', () => {
  assert.deepEqual(webMcpFormProblems(GOOD), [])
  assert.equal(webMcpToolCount(GOOD), 1)
})

test('HTML with no tool form is not checked', () => {
  const html = '<form method="POST"><input name="q"></form><p>toolname is a word here</p>'
  assert.deepEqual(webMcpFormProblems(html), [])
  assert.equal(webMcpToolCount(html), 0)
  assert.deepEqual(webMcpFormProblems(undefined), [])
})

test('a name without a description, and a description without a name, are errors', () => {
  assert.match(errors('<form toolname="a"><input name="x" aria-label="x"></form>')[0], /toolname.*not.*tooldescription/)
  assert.match(errors('<form tooldescription="Does a thing"><input name="x" aria-label="x"></form>')[0], /tooldescription.*not.*toolname/)
})

test('an empty description is an error', () => {
  assert.match(errors('<form toolname="a" tooldescription="  "></form>')[0], /empty `tooldescription`/)
})

test('a tool name follows the spec rule: 1 to 128 ASCII letters, digits, _ - .', () => {
  for (const ok of ['a', 'create_support-request.v2', 'A'.repeat(128)]) {
    assert.deepEqual(errors(`<form toolname="${ok}" tooldescription="d"></form>`), [], ok)
  }
  for (const bad of ['', 'has space', 'naïve', 'a/b', 'A'.repeat(129)]) {
    assert.match(errors(`<form toolname="${bad}" tooldescription="d"></form>`)[0] ?? '', /not a valid tool name/, JSON.stringify(bad))
  }
})

test('a tool name must be unique on the page', () => {
  const html = '<form toolname="go" tooldescription="a"></form><form toolname="go" tooldescription="b"></form>'
  assert.match(errors(html)[0], /unique/)
})

test('toolautosubmit warns on a form that is not GET, and not on a GET search', () => {
  assert.match(warns('<form method="POST" toolautosubmit toolname="t" tooldescription="d"></form>')[0], /without the user clicking Submit/)
  assert.deepEqual(warns('<form method="GET" action="/s" toolautosubmit toolname="t" tooldescription="d"></form>'), [])
  assert.deepEqual(warns('<form action="/s" toolautosubmit toolname="t" tooldescription="d"></form>'), [], 'a form with no method is GET')
})

test('toolautosubmit with no tool name is an error', () => {
  assert.match(errors('<form toolautosubmit></form>')[0], /does nothing/)
})

test('a field needs some description: a label, aria, or toolparamdescription', () => {
  const wrap = (field) => `<form toolname="t" tooldescription="d">${field}</form>`
  for (const ok of [
    '<label for="q">Query</label><input id="q" name="q">',
    '<label>Query <input name="q"></label>',
    '<input name="q" aria-label="Query">',
    '<input name="q" aria-description="What to find">',
    '<input name="q" toolparamdescription="What to find">',
    '<select name="s" toolparamdescription="Team"><option>a</option></select>',
    '<input type="hidden" name="_csrf" value="x"><button type="submit">Go</button>',
  ]) assert.deepEqual(warns(wrap(ok)), [], ok)
  const w = warns(wrap('<input name="q"><textarea name="msg"></textarea>'))
  assert.equal(w.length, 1)
  assert.match(w[0], /`q`, `msg`/)
})

test('an empty toolparamdescription does not count as a description', () => {
  assert.equal(warns('<form toolname="t" tooldescription="d"><input name="q" toolparamdescription=""></form>').length, 1)
})

test('a > inside a quoted attribute does not cut the tag short', () => {
  const html = '<form toolname="t" tooldescription="Find a > b" toolautosubmit method="POST"><input name="q" aria-label="q"></form>'
  assert.equal(webMcpToolCount(html), 1)
  assert.deepEqual(errors(html), [])
  assert.match(warns(html)[0], /without the user clicking Submit/, 'toolautosubmit and method are still read')
  assert.equal(webMcpFormProblems('<form toolname="t" tooldescription="a > b"></form>').length, 0, 'the description is not read as empty')
})

test('a form named in a comment, a script or a style is not a form', () => {
  const html = '<!-- <form toolname="a b" tooldescription=""> --><script>const f = \'<form toolname="x">\'</script><style>/* <form toolautosubmit> */</style><p>ok</p>'
  assert.deepEqual(webMcpFormProblems(html), [])
  assert.equal(webMcpToolCount(html), 0)
})

test('a label outside the form counts, and the method is trimmed', () => {
  const html = '<label for="q">Query</label><form toolname="t" tooldescription="d" toolautosubmit method=" post "><input id="q" name="q"></form>'
  const w = warns(html)
  assert.equal(w.length, 1, 'only the autosubmit warning, no missing-label warning')
  assert.match(w[0], /method POST — /, 'printed as POST with no stray spaces')
})

test('an invalid name is not recorded as taken, so a valid later form is not called a duplicate', () => {
  const html = '<form toolname="a b" tooldescription="d"></form><form toolname="a b" tooldescription="d"></form>'
  assert.equal(errors(html).filter(e => /unique/.test(e)).length, 0)
})

test('attributes in single quotes or unquoted are read', () => {
  assert.deepEqual(webMcpFormProblems("<form toolname='t' tooldescription=Does>" + '</form>'), [])
  assert.equal(webMcpToolCount("<form toolname='t' tooldescription='d'></form>"), 1)
})
