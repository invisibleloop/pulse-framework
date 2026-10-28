/**
 * Pulse — path helpers.
 */

import path from 'path'

/**
 * A native file path with forward slashes. Anything that becomes part of generated JavaScript
 * (an import specifier inside a string literal), a manifest key or a URL must use this: on
 * Windows `path.relative` returns backslashes, and in a JS string `'..\src\pages\home.js'` is
 * `'..srcpageshome.js'`, so `pulse build` failed on every page. (Only the native separator is
 * converted; on POSIX a backslash is a legal filename character and stays.)
 */
export function toPosix(p, sep = path.sep) {
  return sep === '/' ? p : p.split(sep).join('/')
}
