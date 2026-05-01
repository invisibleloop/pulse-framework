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
 *   pulse --version    print installed version and exit
 *   pulse -v           alias for --version
 *   pulse --help       show usage and exit
 *   pulse -h           alias for --help
 *   pulse --agent copilot   use GitHub Copilot CLI instead of Claude
 */

import path from 'path'
import fs   from 'fs'
import { scaffold } from './scaffold.js'

// Extract --agent flag before routing, so it works alongside any subcommand
const rawArgs   = process.argv.slice(2)
let agentFlag   = null
const args      = []
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--agent' && rawArgs[i + 1] && !rawArgs[i + 1].startsWith('-')) {
    agentFlag = rawArgs[++i]
  } else {
    args.push(rawArgs[i])
  }
}
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
    await scaffold(targetDir, { name, agent: agentFlag })

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
  await launchSession(root, agentFlag)
}

// ---------------------------------------------------------------------------
// Launch AI session (Claude by default)
// ---------------------------------------------------------------------------

async function launchSession(root, agentOverride = null) {
  const { spawn } = await import('child_process')
  const os        = await import('os')

  // Load project config for agent preference — CLI flag takes priority
  const configPath = path.join(root, 'pulse.config.js')
  let agent = agentOverride || 'claude'
  if (!agentOverride && fs.existsSync(configPath)) {
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

  console.log(`\n⚡ Pulse project: ${root}`)
  console.log(`   Use /pulse-dev to start the dev server, /pulse-stop to stop it, /pulse-build to build, /pulse-start to run production.`)
  console.log(`   Tell me what you'd like to build — a new page, a component, a form, or anything else.\n`)

  if (agent === 'copilot') {
    await launchCopilotSession(root, mcpServerPath, spawn, os.default)
  } else {
    await launchClaudeSession(root, mcpConfig, spawn, os.default)
  }
}

// ---------------------------------------------------------------------------
// Claude session — temp MCP config file passed via --mcp-config flag
// ---------------------------------------------------------------------------

async function launchClaudeSession(root, mcpConfig, spawn, os) {
  const mcpConfigPath = path.join(os.tmpdir(), `pulse-mcp-${Date.now()}.json`)
  fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2))

  // Launch the agent with MCP config — don't spawn a dev server here,
  // Claude Code cannot be launched as a child process from within a Claude session.
  // The dev server is started via the /dev slash command instead.
  const agentProc = spawn('claude', ['--mcp-config', mcpConfigPath], {
    stdio: 'inherit',
    cwd:   root,
  })

  agentProc.on('exit', () => {
    try { fs.unlinkSync(mcpConfigPath) } catch { /* ignore */ }
    process.exit(0)
  })
}

// ---------------------------------------------------------------------------
// Copilot session — pulse entry injected into ~/.copilot/mcp-config.json
// ---------------------------------------------------------------------------

async function launchCopilotSession(root, mcpServerPath, spawn, os) {
  const mcpConfigPath = path.join(os.homedir(), '.copilot', 'mcp-config.json')

  // Read existing Copilot MCP config (or start fresh)
  let config = { mcpServers: {} }
  if (fs.existsSync(mcpConfigPath)) {
    try { config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8')) } catch { /* use default */ }
  }
  config.mcpServers ??= {}

  const hadPulse      = 'pulse' in config.mcpServers
  const originalPulse = hadPulse ? config.mcpServers.pulse : undefined

  // Inject pulse MCP server
  config.mcpServers.pulse = {
    type:    'local',
    command: process.execPath,
    args:    [mcpServerPath, '--root', root],
    tools:   ['*'],
  }
  fs.mkdirSync(path.dirname(mcpConfigPath), { recursive: true })
  fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2))

  // Restore config on exit — removes pulse entry (or restores original if it existed)
  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    try {
      const current = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'))
      if (hadPulse) {
        current.mcpServers.pulse = originalPulse
      } else {
        delete current.mcpServers.pulse
      }
      fs.writeFileSync(mcpConfigPath, JSON.stringify(current, null, 2))
    } catch { /* ignore cleanup errors */ }
    process.exit(0)
  }

  process.on('SIGINT',  cleanup)
  process.on('SIGTERM', cleanup)

  const agentProc = spawn('copilot', [], { stdio: 'inherit', cwd: root })
  agentProc.on('exit', cleanup)
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
    updated.push(`public/${asset}`)
  }

  // Sync agent files into .claude/
  const agentFiles = [
    ['../agent/checklist.md',      'pulse-checklist.md'],
    ['../agent/coverage-check.js', 'coverage-check.js'],
  ]
  for (const [rel, dst] of agentFiles) {
    const src = new URL(rel, import.meta.url).pathname
    if (fs.existsSync(src)) {
      const dstPath = path.join(root, '.claude', dst)
      fs.mkdirSync(path.dirname(dstPath), { recursive: true })
      fs.copyFileSync(src, dstPath)
      updated.push(`.claude/${dst}`)
    }
  }

  // Sync slash commands into .claude/commands/
  const commandsSrc = new URL('../agent/commands', import.meta.url).pathname
  const commandsDst = path.join(root, '.claude', 'commands')
  if (fs.existsSync(commandsSrc)) {
    fs.mkdirSync(commandsDst, { recursive: true })
    for (const file of fs.readdirSync(commandsSrc).filter(f => f.endsWith('.md'))) {
      fs.copyFileSync(path.join(commandsSrc, file), path.join(commandsDst, file))
      updated.push(`.claude/commands/${file}`)
    }
  }

  // Sync Copilot skills into .copilot/skills/
  const skillsSrc = new URL('../agent/skills', import.meta.url).pathname
  if (fs.existsSync(skillsSrc)) {
    for (const skillDir of fs.readdirSync(skillsSrc)) {
      const skillMd = path.join(skillsSrc, skillDir, 'SKILL.md')
      if (fs.existsSync(skillMd)) {
        const dstDir = path.join(root, '.copilot', 'skills', skillDir)
        fs.mkdirSync(dstDir, { recursive: true })
        fs.copyFileSync(skillMd, path.join(dstDir, 'SKILL.md'))
        updated.push(`.copilot/skills/${skillDir}/SKILL.md`)
      }
    }
  }

  // Sync checklist to .github/instructions/ for Copilot
  const checklistSrc = new URL('../agent/checklist.md', import.meta.url).pathname
  if (fs.existsSync(checklistSrc)) {
    const checklistDst = path.join(root, '.github', 'instructions', 'pulse-checklist.instructions.md')
    fs.mkdirSync(path.dirname(checklistDst), { recursive: true })
    fs.copyFileSync(checklistSrc, checklistDst)
    updated.push('.github/instructions/pulse-checklist.instructions.md')
  }

  // Read the new version for the success message
  const versionFile = path.join(publicDir, '.pulse-ui-version')
  const version     = fs.existsSync(versionFile) ? fs.readFileSync(versionFile, 'utf8').trim() : '?'

  console.log(`\n⚡ Pulse updated to ${version}\n`)
  for (const f of updated) console.log(`  ✓ ${f}`)
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
  case '--version':
  case '-v': {
    const pkgPath = new URL('../../package.json', import.meta.url).pathname
    const { version } = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    console.log(version)
    process.exit(0)
  }
  case '--help':
  case '-h':
    console.log(`
  ⚡ Pulse — spec-first frontend framework

  Usage: pulse [command] [options]

  Commands:
    (none)      detect project or start scaffold wizard
    dev         start dev server
    build       production build → public/dist/
    start       production server (requires prior build)
    update      re-copy pulse-ui assets from installed package → public/

  Options:
    --agent <name>  AI agent to use: claude (default) or copilot
    -v, --version   print version and exit
    -h, --help      show this help

  Examples:
    pulse                    start with Claude (default)
    pulse --agent copilot    start with GitHub Copilot CLI
`)
    process.exit(0)
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
