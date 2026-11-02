#!/usr/bin/env node
/**
 * Black-box security check. It sees only HTTP responses, so it works on any framework.
 * The checks are fixed here, before any output is looked at, and no model is involved.
 *
 *   node scripts/seccheck.js <baseUrl> [--pkg <dir with package.json>] [--json]
 *
 * Exit code 1 when any check fails. Checks that do not apply (no cookies, no forms,
 * plain http) are reported as skipped and do not count.
 */
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export async function runChecks(baseUrl, { pkgDir = null } = {}) {
  const base = baseUrl.replace(/\/$/, '')
  const isHttps = base.startsWith('https://')
  const results = [] // { id, area, title, status: pass|fail|skip, note }
  const add = (id, area, title, status, note = '') => results.push({ id, area, title, status, note })

  const get = async (path, init = {}) => {
    const res = await fetch(base + path, { redirect: 'manual', ...init })
    const text = await res.text()
    return { res, text, h: (n) => res.headers.get(n) }
  }

  // ---------- 1. Headers on the home page ----------
  const home = await get('/')
  const csp = home.h('content-security-policy') || ''
  const dir = (name) => {
    const m = csp.split(';').map(s => s.trim()).find(s => s.startsWith(name + ' '))
    return m ? m.slice(name.length + 1).split(/\s+/) : null
  }
  const scriptSrc = dir('script-src') ?? dir('default-src')

  add('H1', 'headers', 'Content-Security-Policy is set', csp ? 'pass' : 'fail')
  if (csp) {
    add('H2', 'headers', 'CSP has no unsafe-eval', csp.includes("'unsafe-eval'") ? 'fail' : 'pass')
    // 'unsafe-inline' next to a nonce is ignored by browsers, so it only counts when no nonce/hash is present.
    const hasNonce = scriptSrc?.some(s => /^'(nonce|sha\d+)-/.test(s))
    const unsafeInline = scriptSrc?.includes("'unsafe-inline'")
    add('H3', 'headers', 'script-src blocks inline script injection (nonce/hash, or no unsafe-inline)',
      scriptSrc && (!unsafeInline || hasNonce) && !scriptSrc.includes('*') ? 'pass' : 'fail',
      scriptSrc ? scriptSrc.join(' ').slice(0, 80) : 'no script-src or default-src')
    add('H4', 'headers', 'CSP restricts object-src (or default-src is none/self)',
      (dir('object-src')?.includes("'none'") || ['\'none\'', '\'self\''].includes(dir('default-src')?.[0])) ? 'pass' : 'fail')
  } else {
    for (const [id, t] of [['H2', 'CSP has no unsafe-eval'], ['H3', 'script-src blocks inline script injection'], ['H4', 'CSP restricts object-src']]) add(id, 'headers', t, 'fail', 'no CSP')
  }
  const frameOk = /frame-ancestors/.test(csp) || /^(deny|sameorigin)$/i.test(home.h('x-frame-options') || '')
  add('H5', 'headers', 'Clickjacking protection (frame-ancestors or X-Frame-Options)', frameOk ? 'pass' : 'fail')
  add('H6', 'headers', 'X-Content-Type-Options: nosniff', /nosniff/i.test(home.h('x-content-type-options') || '') ? 'pass' : 'fail')
  add('H7', 'headers', 'Referrer-Policy is set', home.h('referrer-policy') ? 'pass' : 'fail')
  add('H8', 'headers', 'Permissions-Policy is set', home.h('permissions-policy') ? 'pass' : 'fail')
  if (isHttps) add('H9', 'headers', 'Strict-Transport-Security is set', home.h('strict-transport-security') ? 'pass' : 'fail')
  else add('H9', 'headers', 'Strict-Transport-Security is set', 'skip', 'plain http (HSTS only applies on https)')
  const leak = [home.h('x-powered-by'), home.h('server')].filter(v => v && /\d/.test(v))
  add('H10', 'headers', 'No framework or server version in headers', leak.length ? 'fail' : 'pass', leak.join(', '))

  // ---------- 2. Cookies ----------
  const cookies = home.res.headers.getSetCookie?.() ?? []
  if (!cookies.length) add('C1', 'cookies', 'Cookies set on the home page are HttpOnly, SameSite and (https) Secure', 'skip', 'no cookies set')
  else {
    const bad = cookies.filter(c => !/httponly/i.test(c) || !/samesite=/i.test(c) || (isHttps && !/;\s*secure/i.test(c)))
    add('C1', 'cookies', 'Cookies set on the home page are HttpOnly, SameSite and (https) Secure', bad.length ? 'fail' : 'pass', bad.map(c => c.split('=')[0]).join(', '))
  }

  // ---------- 3. Reflection (XSS probe) ----------
  const probe = `zq"'<svg onload=alert(1)>zq`
  const reflected = async (path) => {
    const { text } = await get(path)
    return text.includes('<svg onload=alert(1)>')
  }
  const qHit = await reflected(`/?q=${encodeURIComponent(probe)}&name=${encodeURIComponent(probe)}&s=${encodeURIComponent(probe)}`)
  const pHit = await reflected(`/${encodeURIComponent(probe)}`)
  add('X1', 'xss', 'Hostile query-string values are not reflected as markup', qHit ? 'fail' : 'pass')
  add('X2', 'xss', 'Hostile URL path is not reflected as markup (404 page)', pHit ? 'fail' : 'pass')

  // ---------- 4. Forms and CSRF ----------
  const formRe = /<form\b[^>]*>/gi
  const forms = [...home.text.matchAll(formRe)].map(m => m[0]).filter(f => /method=["']?post/i.test(f))
  // also look one level deep at same-origin links
  const links = [...new Set([...home.text.matchAll(/href="(\/[^"#?]*)"/g)].map(m => m[1]))].slice(0, 12)
  const postTargets = new Set()
  for (const f of forms) postTargets.add(((f.match(/action=["']([^"']*)["']/i) || [])[1]) || '/')
  for (const l of links) {
    try {
      const p = await get(l)
      for (const m of p.text.matchAll(formRe)) if (/method=["']?post/i.test(m[0])) postTargets.add(((m[0].match(/action=["']([^"']*)["']/i) || [])[1]) || l)
    } catch { /* ignore */ }
  }
  if (!postTargets.size) {
    add('F1', 'forms', 'POST without a CSRF token is rejected', 'skip', 'no POST forms found')
  } else {
    const accepted = []
    for (const t of postTargets) {
      const r = await fetch(base + t, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://evil.example' }, body: 'name=a&email=a%40b.co&message=csrf' })
      if (r.status < 400) accepted.push(`${t} -> ${r.status}`)
    }
    add('F1', 'forms', 'POST without a CSRF token (cross-origin) is rejected', accepted.length ? 'fail' : 'pass', accepted.join(', '))
  }

  // ---------- 5. Exposure ----------
  const exposed = []
  for (const p of ['/.env', '/.git/config', '/package.json', '/server.js', '/pulse.config.js']) {
    const r = await get(p).catch(() => null)
    if (r && r.res.status === 200 && !/<html/i.test(r.text.slice(0, 200)) && r.text.length) exposed.push(p)
  }
  add('E1', 'exposure', 'Secrets and source files are not served (.env, .git, package.json, server.js)', exposed.length ? 'fail' : 'pass', exposed.join(', '))
  const scriptUrls = [...home.text.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(m => m[1]).filter(u => u.startsWith('/')).slice(0, 4)
  const maps = []
  for (const u of scriptUrls) {
    const r = await get(u.split('?')[0] + '.map').catch(() => null)
    if (r && r.res.status === 200 && /"mappings"/.test(r.text.slice(0, 2000))) maps.push(u)
  }
  add('E2', 'exposure', 'No source maps served in production', maps.length ? 'fail' : 'pass', maps.join(', '))

  // ---------- 6. Dependencies ----------
  if (pkgDir) {
    try {
      const out = execFileSync('npm', ['audit', '--omit=dev', '--json'], { cwd: pkgDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      const v = JSON.parse(out).metadata?.vulnerabilities ?? {}
      add('D1', 'dependencies', 'npm audit (production deps): no high or critical', (v.high || 0) + (v.critical || 0) ? 'fail' : 'pass', JSON.stringify(v))
    } catch (e) {
      const out = e.stdout ? String(e.stdout) : ''
      try { const v = JSON.parse(out).metadata.vulnerabilities; add('D1', 'dependencies', 'npm audit (production deps): no high or critical', (v.high || 0) + (v.critical || 0) ? 'fail' : 'pass', JSON.stringify(v)) }
      catch { add('D1', 'dependencies', 'npm audit (production deps): no high or critical', 'skip', 'audit could not run (offline or no lockfile)') }
    }
  } else add('D1', 'dependencies', 'npm audit (production deps): no high or critical', 'skip', 'no --pkg given')


  return results
}

export function summarize(results) {
  const counted = results.filter(r => r.status !== 'skip')
  return { passed: counted.filter(r => r.status === 'pass').length, total: counted.length, failed: counted.filter(r => r.status === 'fail') }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const base = args[0] || ''
  const pkgDir = args.includes('--pkg') ? args[args.indexOf('--pkg') + 1] : null
  if (!/^https?:\/\//.test(base)) { console.error('usage: seccheck.js <baseUrl> [--pkg dir] [--json]'); process.exit(2) }
  const results = await runChecks(base, { pkgDir })
  const { passed, total, failed } = summarize(results)
  if (args.includes('--json')) console.log(JSON.stringify({ base, passed, total, results }, null, 2))
  else {
    console.log(`\nSecurity check: ${base}\n`)
    for (const r of results) console.log(`  ${r.status === 'pass' ? '✓' : r.status === 'fail' ? '✗' : '–'} ${r.id.padEnd(4)} ${r.title}${r.note ? `  [${r.note}]` : ''}`)
    console.log(`\n  ${passed}/${total} passed, ${results.length - total} skipped\n`)
  }
  process.exit(failed.length ? 1 : 0)
}
