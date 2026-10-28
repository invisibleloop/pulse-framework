/**
 * Pulse — start other programs, the same way on every platform.
 *
 * On Windows `npm`, `pnpm`, `yarn`, `claude` and `copilot` are .cmd shims, and Node cannot start a
 * .cmd without a shell (ENOENT, or EINVAL on current Node). So there a shell is used, and each
 * argument is quoted for it: the install ranges contain spaces and `||`
 * (`zod@^3.25 || ^4.0`), which cmd.exe would otherwise treat as an operator. Elsewhere no shell
 * is involved and the arguments go through untouched.
 */

import { spawn, spawnSync } from 'child_process'

/** Quote one argument for cmd.exe (inside double quotes `^ & | < >` are literal). */
export function quoteWindowsArg(arg) {
  const s = String(arg)
  if (s !== '' && !/[\s"&|<>^()%!]/.test(s)) return s
  return '"' + s.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, '$1$1') + '"'
}

function prepare(command, args, options, platform) {
  if (platform !== 'win32') return [command, args, options]
  return [command, args.map(quoteWindowsArg), { ...options, shell: true }]
}

export function spawnCommand(command, args = [], options = {}, platform = process.platform) {
  return spawn(...prepare(command, args, options, platform))
}

export function spawnCommandSync(command, args = [], options = {}, platform = process.platform) {
  return spawnSync(...prepare(command, args, options, platform))
}
