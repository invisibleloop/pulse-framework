#!/usr/bin/env node
/**
 * Pulse CLI
 *
 * Usage:
 *   pulse              detect project or scaffold, then start AI session + dev server
 *   pulse dev          dev server only (no AI)
 *   pulse build        production build → public/dist/
 *   pulse start        production server (requires prior build)
 *   pulse update       re-copy pulse-ui.css/js from installed package → public/
 */

import path from 'path'
import fs   from 'fs'
import { scaffold } from './scaffold.js'

const args    = process.argv.slice(2)
const command = args[0]
const CWD     = process.cwd()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPulseProject(dir) {
  return (
    fs.existsSync(path.join(dir, 'pulse.config.js')) ||
    fs.existsSync(path.join(dir, 'src', 'pages'))
  )
}

// ---------------------------------------------------------------------------
// pulse dev
// ---------------------------------------------------------------------------

async function runDev(root) {
  const devScript  = new URL('./dev.js', import.meta.url).pathname
  const { spawn }  = await import('child_process')
  const proc = spawn(
    process.execPath,
    [devScript, '--root', root],
    { stdio: 'inherit' }
  )
  proc.on('exit', code => process.exit(code ?? 0))
}

// ---------------------------------------------------------------------------
// pulse build
// ---------------------------------------------------------------------------

async function runBuild(root) {
  const buildScript = new URL('../../scripts/build.js', import.meta.url).pathname
  const { spawn }   = await import('child_process')
  const proc = spawn(
    process.execPath,
    [buildScript, '--root', root],
    { stdio: 'inherit' }
  )
  proc.on('exit', code => process.exit(code ?? 0))
}

// ---------------------------------------------------------------------------
// pulse (no subcommand) — scaffold or start AI session
// ---------------------------------------------------------------------------

function prompt(question) {
  process.stdout.write(question)
  return new Promise(resolve => {
    process.stdin.setEncoding('utf8')
    process.stdin.once('data', d => resolve(d.trim()))
  })
}

function isDirEmpty(dir) {
  if (!fs.existsSync(dir)) return true
  return fs.readdirSync(dir).length === 0
}

async function runDefault(root) {
  if (!isPulseProject(root)) {
    console.log(`\n⚡ No Pulse project found here.\n`)

    let targetDir = root
    let name      = path.basename(root)

    if (!isDirEmpty(root)) {
      // Non-empty directory — ask for a project name and create a subdirectory
      const raw = await prompt(`  Project name: `)
      if (!raw) {
        console.log('\n  Aborted.\n')
        process.exit(0)
      }
      // Sanitise: lowercase, hyphens, no leading/trailing punctuation
      name      = raw.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
      targetDir = path.join(root, name)

      if (fs.existsSync(targetDir)) {
        console.error(`\n  Directory already exists: ${targetDir}\n`)
        process.exit(1)
      }
    } else {
      // Empty directory — confirm scaffold here
      const answer = await prompt(`  Scaffold a new Pulse app here? (${name}) [Y/n] `)
      if (answer.toLowerCase() === 'n') {
        console.log('\n  Aborted.\n')
        process.exit(0)
      }
    }

    console.log()
    await scaffold(targetDir, { name })

    if (targetDir !== root) {
      console.log(`\n✓ Project created at ./${name}/\n`)
      console.log(`  Next steps:\n`)
      console.log(`    cd ${name}`)
      console.log(`    pulse\n`)
    } else {
      console.log('\n✓ Project ready. Run `pulse` again to start your AI session.\n')
    }
    process.exit(0)
  }

  // Start dev server + AI session
  await launchSession(root)
}

// ---------------------------------------------------------------------------
// Launch AI session (Claude by default)
// ---------------------------------------------------------------------------

async function launchSession(root) {
  const { spawn } = await import('child_process')
  const os        = await import('os')

  // Load project config for agent preference
  const configPath = path.join(root, 'pulse.config.js')
  let agent = 'claude'
  if (fs.existsSync(configPath)) {
    try {
      const mod = await import(configPath)
      agent = mod.default?.agent || 'claude'
    } catch { /* use default */ }
  }

  // Write MCP config so the agent has access to Pulse tools
  const mcpServerPath = new URL('../mcp/server.js', import.meta.url).pathname
  const mcpConfig = {
    mcpServers: {
      pulse: {
        command: process.execPath,
        args:    [mcpServerPath, '--root', root],
      }
    }
  }
  const mcpConfigPath = path.join(os.default.tmpdir(), `pulse-mcp-${Date.now()}.json`)
  fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2))

  console.log(`\n⚡ Pulse project: ${root}`)
  console.log(`   Use /pulse-dev to start the dev server, /pulse-stop to stop it, /pulse-build to build, /pulse-start to run production.`)
  console.log(`   Tell me what you'd like to build — a new page, a component, a form, or anything else.\n`)

  // Launch the agent with MCP config — don't spawn a dev server here,
  // Claude Code cannot be launched as a child process from within a Claude session.
  // The dev server is started via the /dev slash command instead.
  const agentCmd  = agentCommand(agent, mcpConfigPath)
  const agentProc = spawn(agentCmd.cmd, agentCmd.args, {
    stdio: 'inherit',
    cwd:   root,
  })

  agentProc.on('exit', () => {
    try { fs.unlinkSync(mcpConfigPath) } catch { /* ignore */ }
    process.exit(0)
  })
}

function agentCommand(agent, mcpConfigPath) {
  if (agent === 'claude') {
    return { cmd: 'claude', args: ['--mcp-config', mcpConfigPath] }
  }
  // Future: copilot, etc.
  console.warn(`Unknown agent "${agent}", falling back to claude`)
  return { cmd: 'claude', args: ['--mcp-config', mcpConfigPath] }
}

// ---------------------------------------------------------------------------
// pulse stop
// ---------------------------------------------------------------------------

async function runStop(root) {
  const { execSync } = await import('child_process')
  let port = 3000
  const configPath = path.join(root, 'pulse.config.js')
  if (fs.existsSync(configPath)) {
    try {
      const mod = await import(configPath)
      if (mod.default?.port) port = mod.default.port
    } catch { /* use default */ }
  }
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null; true`, { stdio: 'inherit' })
    console.log(`\n⚡ Dev server on port ${port} stopped.\n`)
  } catch { /* nothing was running */ }
}

// ---------------------------------------------------------------------------
// pulse report-server
// ---------------------------------------------------------------------------

async function runReportServer(root) {
  const configPath = path.join(root, 'pulse.config.js')
  let devPort = 3000
  let reportPort = null
  if (fs.existsSync(configPath)) {
    try {
      const mod = await import(configPath)
      if (mod.default?.port)       devPort    = mod.default.port
      if (mod.default?.reportPort) reportPort = mod.default.reportPort
    } catch { /* use defaults */ }
  }
  if (!reportPort) reportPort = devPort + 1

  const script      = new URL('./report-server.js', import.meta.url).pathname
  const { spawn }   = await import('child_process')
  const proc = spawn(
    process.execPath,
    [script, '--root', root, '--port', String(reportPort)],
    { stdio: 'inherit' }
  )
  proc.on('exit', code => process.exit(code ?? 0))
}

// ---------------------------------------------------------------------------
// pulse save-report
// ---------------------------------------------------------------------------

async function runSaveReport(root) {
  const script    = new URL('./report.js', import.meta.url).pathname
  const { spawn } = await import('child_process')
  const proc = spawn(process.execPath, [script, '--root', root, ...process.argv.slice(3)], { stdio: 'inherit' })
  proc.on('exit', code => process.exit(code ?? 0))
}

// ---------------------------------------------------------------------------
// pulse load-test
// ---------------------------------------------------------------------------

async function runLoadTest(_root) {
  const script    = new URL('./load-runner.js', import.meta.url).pathname
  const { spawn } = await import('child_process')
  const proc = spawn(process.execPath, [script, ...process.argv.slice(3)], { stdio: 'inherit' })
  proc.on('exit', code => process.exit(code ?? 0))
}

// ---------------------------------------------------------------------------
// pulse save-load-report
// ---------------------------------------------------------------------------

async function runSaveLoadReport(root) {
  const script    = new URL('./load-report.js', import.meta.url).pathname
  const { spawn } = await import('child_process')
  const proc = spawn(process.execPath, [script, '--root', root, ...process.argv.slice(3)], { stdio: 'inherit' })
  proc.on('exit', code => process.exit(code ?? 0))
}

// ---------------------------------------------------------------------------
// pulse update
// ---------------------------------------------------------------------------

async function runUpdate(root) {
  if (!isPulseProject(root)) {
    console.error('\n  Not a Pulse project. Run from your project root.\n')
    process.exit(1)
  }

  const pkgPublic = new URL('../../public', import.meta.url).pathname
  const assets    = ['pulse-ui.css', 'pulse-ui.js', '.pulse-ui-version']
  const publicDir = path.join(root, 'public')
  const updated   = []
  const missing   = []

  for (const asset of assets) {
    const src = path.join(pkgPublic, asset)
    const dst = path.join(publicDir, asset)
    if (!fs.existsSync(src)) { missing.push(asset); continue }
    fs.copyFileSync(src, dst)
    updated.push(asset)
  }

  // Sync agent checklist into .claude/
  const checklistSrc = new URL('../agent/checklist.md', import.meta.url).pathname
  const checklistDst = path.join(root, '.claude', 'pulse-checklist.md')
  if (fs.existsSync(checklistSrc)) {
    fs.mkdirSync(path.dirname(checklistDst), { recursive: true })
    fs.copyFileSync(checklistSrc, checklistDst)
    updated.push('.claude/pulse-checklist.md')
  }

  // Read the new version for the success message
  const versionFile = path.join(publicDir, '.pulse-ui-version')
  const version     = fs.existsSync(versionFile) ? fs.readFileSync(versionFile, 'utf8').trim() : '?'

  console.log(`\n⚡ Pulse UI updated to ${version}\n`)
  for (const f of updated) console.log(`  ✓ public/${f}`)
  for (const f of missing) console.log(`  ✗ ${f} not found in package`)
  console.log()
}

// ---------------------------------------------------------------------------
// pulse start
// ---------------------------------------------------------------------------

async function runStart(root) {
  const startScript = new URL('./start.js', import.meta.url).pathname
  const { spawn }   = await import('child_process')
  // Forward any extra flags (e.g. --port 3002) to the start script
  const extraArgs   = args.slice(1)
  const proc = spawn(
    process.execPath,
    [startScript, '--root', root, ...extraArgs],
    { stdio: 'inherit' }
  )
  proc.on('exit', code => process.exit(code ?? 0))
}

// ---------------------------------------------------------------------------
// Route command
// ---------------------------------------------------------------------------

switch (command) {
  case 'dev':
    await runDev(CWD)
    break
  case 'stop':
    await runStop(CWD)
    break
  case 'build':
    await runBuild(CWD)
    break
  case 'start':
    await runStart(CWD)
    break
  case 'report-server':
    await runReportServer(CWD)
    break
  case 'save-report':
    await runSaveReport(CWD)
    break
  case 'load-test':
    await runLoadTest(CWD)
    break
  case 'save-load-report':
    await runSaveLoadReport(CWD)
    break
  case 'update':
    await runUpdate(CWD)
    break
  default:
    await runDefault(CWD)
}
