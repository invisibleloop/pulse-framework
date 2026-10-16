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
import dns  from 'dns'
import http from 'http'
import https from 'https'

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

  // realpath the deepest existing ancestor so not-yet-created files are still checked.
  // lstat, not existsSync: existsSync follows symlinks, so a dangling link looks
  // "missing" and the walk would skip past it — then a later write through the link
  // creates the file at the link's (outside-the-project) target.
  const lexists = (f) => { try { fs.lstatSync(f); return true } catch { return false } }
  let probe = abs
  while (!lexists(probe)) {
    const parent = path.dirname(probe)
    if (parent === probe) break
    probe = parent
  }
  let realProbe
  try { realProbe = fs.realpathSync(probe) }
  catch { throw new Error(`path goes through a broken symlink: ${file}`) }
  const real = path.join(realProbe, path.relative(probe, abs))

  const rel = path.relative(rootReal, real)
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`path must be inside the project (${root}): ${file}`)
  }
  return abs
}

/**
 * True when `p` is strictly inside directory `dir` (lexical check on already-joined paths).
 * A bare startsWith(dir) is wrong: "/proj/src/pages-old/x.js" starts with "/proj/src/pages".
 */
export function isInsideDir(dir, p) {
  return p.startsWith(dir.endsWith(path.sep) ? dir : dir + path.sep)
}

/** True for http(s) URLs that point at this machine (localhost / 127.0.0.0/8 / ::1). */
export function isLoopbackUrl(rawUrl) {
  let u
  try { u = new URL(rawUrl) } catch { return false }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  // 127.x counts only as a real IPv4 literal: a hostname such as "127.evil.com" or
  // "127.0.0.1.nip.io" also starts with "127." but resolves anywhere.
  return host === 'localhost' || host.endsWith('.localhost') || host === '::1' ||
    (net.isIPv4(host) && host.startsWith('127.'))
}

// Everything that is not a routable public unicast address. IPv6 forms that embed
// an IPv4 address are covered too: URL parsing rewrites "[::ffff:127.0.0.1]" to
// "::ffff:7f00:1", which a dotted-quad check does not recognise. net.BlockList applies
// the IPv4 rules to IPv4-mapped IPv6 addresses itself (so ::ffff:0:0/96 must NOT be
// listed — it would match every IPv4 address); IPv4-compatible (::/96), NAT64
// (64:ff9b::/96) and 6to4 (2002::/16) are blocked outright.
const NON_PUBLIC = new net.BlockList()
for (const [addr, bits] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
]) NON_PUBLIC.addSubnet(addr, bits, 'ipv4')
for (const [addr, bits] of [
  ['::', 96], ['64:ff9b::', 96], ['64:ff9b:1::', 48], ['100::', 64],
  ['2001::', 32], ['2001:db8::', 32], ['2002::', 16], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
]) NON_PUBLIC.addSubnet(addr, bits, 'ipv6')

/** True when an IP literal is loopback, private, link-local, CGNAT, multicast, reserved or otherwise non-public. */
export function isPrivateAddress(ip) {
  const bare = String(ip).replace(/^\[|\]$/g, '').split('%')[0]
  if (net.isIPv4(bare)) return NON_PUBLIC.check(bare, 'ipv4')
  if (net.isIPv6(bare)) return NON_PUBLIC.check(bare, 'ipv6')
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
  const addrs = await dns.promises.lookup(host, { all: true })
  if (!addrs.length || addrs.some(a => isPrivateAddress(a.address))) {
    throw new Error(`${host} resolves to a non-public address`)
  }
}

/**
 * A dns.lookup replacement that refuses non-public results. Passed to http(s).request
 * as `lookup`, it runs on the very resolution the socket then connects to — so a
 * hostname that answers "public" to a pre-flight check and "127.0.0.1" a moment later
 * (DNS rebinding) cannot slip through the gap that a separate assertPublicUrl() leaves.
 *
 * @param {Function} [resolve] dns.lookup-compatible resolver (injectable for tests)
 */
export function makePublicLookup(resolve = dns.lookup) {
  return (hostname, options, callback) => {
    if (typeof options === 'function') { callback = options; options = {} }
    resolve(hostname, { ...options, all: true }, (err, addrs) => {
      if (err) return callback(err)
      if (!addrs?.length || addrs.some(a => isPrivateAddress(a.address))) {
        return callback(new Error(`${hostname} resolves to a non-public address`))
      }
      if (options.all) return callback(null, addrs)
      callback(null, addrs[0].address, addrs[0].family)
    })
  }
}

/**
 * Make one HTTP(S) request to a public address and resolve with { status, headers }.
 * Redirects are NOT followed (callers walk them, re-checking each hop). The body is
 * discarded. Private/loopback/metadata targets are refused both up front (IP literals)
 * and at connect time (hostnames).
 *
 * @param {string|URL} rawUrl
 * @param {{ method?: string, headers?: object, timeout?: number, lookup?: Function }} [opts]
 */
export function requestPublic(rawUrl, { method = 'HEAD', headers = {}, timeout = 5000, lookup = makePublicLookup() } = {}) {
  return new Promise((resolve, reject) => {
    let u
    try { u = rawUrl instanceof URL ? rawUrl : new URL(rawUrl) } catch (e) { return reject(e) }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return reject(new Error(`only http(s) URLs are allowed (got ${u.protocol})`))
    }
    const host = u.hostname.replace(/^\[|\]$/g, '')
    if (net.isIP(host) && isPrivateAddress(host)) return reject(new Error(`${host} is not a public address`))

    const lib = u.protocol === 'https:' ? https : http
    const req = lib.request(u, { method, headers, lookup, timeout }, (res) => {
      resolve({ status: res.statusCode, headers: res.headers })
      res.destroy()
    })
    req.on('timeout', () => req.destroy(Object.assign(new Error('timed out'), { name: 'TimeoutError' })))
    req.on('error', reject)
    req.end()
  })
}
