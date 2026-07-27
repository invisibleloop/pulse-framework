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

  const { waitUntilExit } = render(
    h(App, { projectName, projectRoot, claude, devServer }),
    { exitOnCtrlC: false }, // App handles Ctrl+C itself so it can clean up child processes first
  )

  await waitUntilExit()
  claude.destroy()
  devServer.destroy()
  process.exit(0)
}

main().catch((err) => {
  console.error('pulse-tui failed to start:', err.message)
  process.exit(1)
})
