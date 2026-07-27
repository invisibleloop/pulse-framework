#!/usr/bin/env node
/**
 * Pulse TUI — entrypoint
 *
 * Usage:
 *   pulse-tui [path-to-project]   (defaults to cwd)
 */

import React from 'react'
import { render } from 'ink'
import path from 'node:path'
import fs from 'node:fs'

import { App } from './App.js'
import { startClaudeSession } from './claude-session.js'
import { startDevServer } from './dev-server.js'
import { writeMcpConfig } from './mcp-config.js'

const h = React.createElement

async function main() {
  const arg = process.argv[2]
  const projectRoot = path.resolve(arg ?? process.cwd())

  if (!fs.existsSync(projectRoot)) {
    console.error(`No such directory: ${projectRoot}`)
    process.exit(1)
  }
  const looksLikePulseProject =
    fs.existsSync(path.join(projectRoot, 'pulse.config.js')) ||
    fs.existsSync(path.join(projectRoot, 'src', 'pages'))
  if (!looksLikePulseProject) {
    console.error(`${projectRoot} doesn't look like a Pulse project (no pulse.config.js or src/pages/).`)
    console.error('Run `pulse` there first to scaffold one, or point pulse-tui at an existing project.')
    process.exit(1)
  }

  const projectName = path.basename(projectRoot)

  const mcpConfigPath = await writeMcpConfig(projectRoot)
  const claude = startClaudeSession({ cwd: projectRoot, mcpConfigPath })
  const devServer = await startDevServer({ cwd: projectRoot, preferred: 3000 })

  // Ctrl+C is handled by App itself (goes through Ink's useInput so it can
  // interrupt an in-flight turn instead of always quitting — see App.js).
  // This handler is the safety net for everything Ctrl+C doesn't cover:
  // SIGTERM (closing the terminal tab, `kill <pid>` from elsewhere, a
  // process supervisor stopping this one) has no default cleanup hook in
  // Node — without this, the child `pulse dev` and `claude` subprocesses
  // are orphaned exactly like the EADDRINUSE/EMFILE bugs traced back to
  // leftover sessions earlier. Idempotent-safe to call alongside the normal
  // waitUntilExit() path below since destroy() on an already-dead process
  // just no-ops (both catch their own kill() failures).
  let cleaningUp = false
  function cleanupAndExit(signal) {
    if (cleaningUp) return
    cleaningUp = true
    claude.destroy()
    devServer.destroy()
    process.exit(signal ? 130 : 0) // 130 = conventional exit code for SIGINT/SIGTERM
  }
  process.on('SIGTERM', () => cleanupAndExit('SIGTERM'))
  process.on('SIGHUP',  () => cleanupAndExit('SIGHUP'))
  // SIGINT safety net — App's useInput-based Ctrl+C handling only applies
  // once Ink's raw mode is active; a SIGINT before that (or from a source
  // other than a raw-mode keypress) would otherwise hit Node's default
  // handler and terminate with no cleanup.
  process.on('SIGINT', () => cleanupAndExit('SIGINT'))

  const { waitUntilExit } = render(
    h(App, { projectName, projectRoot, claude, devServer }),
    { exitOnCtrlC: false }, // App handles Ctrl+C itself so it can clean up child processes first
  )

  await waitUntilExit()
  cleanupAndExit(null)
}

main().catch((err) => {
  console.error('pulse-tui failed to start:', err.message)
  process.exit(1)
})
