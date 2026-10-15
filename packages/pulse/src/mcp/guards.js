/**
 * Input guards for MCP tools.
 *
 * The MCP server runs locally, but its tool arguments are chosen by an AI agent
 * that may have read untrusted content (a fetched page, a pasted brief). These
 * helpers keep a steered tool call inside the project and off internal networks.
 */

import fs   from 'fs'
import path from 'path'
import net  from 'net'
import dns  from 'dns/promises'

/**
 * Resolve a caller-supplied file path and require it to live inside `root`.
 * Relative paths resolve against `root`. Symlinks are followed before the check
 * so a link inside the project cannot point outside it.
 *
 * @returns {string} absolute path inside root
 * @throws  {Error}  when the path escapes root
 */
export function resolveInRoot(root, file) {
  const rootReal = fs.realpathSync(root)
  const abs      = path.resolve(root, file)

  // realpath the deepest existing ancestor so not-yet-created files are still checked
  let probe = abs
  while (!fs.existsSync(probe)) {
    const parent = path.dirname(probe)
    if (parent === probe) break
    probe = parent
  }
  const real = path.join(fs.realpathSync(probe), path.relative(probe, abs))

  const rel = path.relative(rootReal, real)
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`path must be inside the project (${root}): ${file}`)
  }
  return abs
}

/** True for http(s) URLs that point at this machine (localhost / 127.0.0.0/8 / ::1). */
export function isLoopbackUrl(rawUrl) {
  let u
  try { u = new URL(rawUrl) } catch { return false }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  return host === 'localhost' || host.endsWith('.localhost') || host === '::1' || /^127\./.test(host)
}

/** True when an IP literal is loopback, private, link-local, CGNAT, multicast or otherwise non-public. */
export function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase()
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateAddress(mapped[1])
    return v === '::' || v === '::1' ||
      /^f[cd]/.test(v) ||            // fc00::/7 unique local
      /^fe[89ab]/.test(v) ||         // fe80::/10 link-local
      /^ff/.test(v)                  // multicast
  }
  return true // not an IP — treat as unsafe
}

/**
 * Require a URL to be http(s) and resolve only to public addresses.
 * Call before every request, including each redirect hop.
 *
 * @throws {Error} when the URL is not http(s) or resolves to a non-public address
 */
export async function assertPublicUrl(rawUrl) {
  const u = rawUrl instanceof URL ? rawUrl : new URL(rawUrl)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error(`only http(s) URLs are allowed (got ${u.protocol})`)
  }
  const host = u.hostname.replace(/^\[|\]$/g, '')
  if (net.isIP(host)) {
    if (isPrivateAddress(host)) throw new Error(`${host} is not a public address`)
    return
  }
  const addrs = await dns.lookup(host, { all: true })
  if (!addrs.length || addrs.some(a => isPrivateAddress(a.address))) {
    throw new Error(`${host} resolves to a non-public address`)
  }
}
