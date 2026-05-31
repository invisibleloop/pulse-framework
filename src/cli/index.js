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

// Extract --agent and --verbose flags before routing
const rawArgs     = process.argv.slice(2)
let agentFlag     = null
let verboseFlag   = false
const args        = []
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--agent' && rawArgs[i + 1] && !rawArgs[i + 1].startsWith('-')) {
    agentFlag = rawArgs[++i]
  } else if (rawArgs[i] === '--verbose' || rawArgs[i] === '-v') {
    verboseFlag = true
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

async function runDefault(root, agentFlag = null, verbose = false) {
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

  // Run wizard then launch agent
  await launchSession(root, agentFlag, verbose)
}

// ---------------------------------------------------------------------------
// Launch AI session (Claude by default) — wizard first, then agent
// ---------------------------------------------------------------------------

async function launchSession(root, agentOverride = null, verbose = false) {
  // Load project config for agent preference — CLI flag takes priority
  const configPath = path.join(root, 'pulse.config.js')
  let agent = agentOverride || 'claude'
  if (!agentOverride && fs.existsSync(configPath)) {
    try {
      const mod = await import(configPath)
      agent = mod.default?.agent || 'claude'
    } catch { /* use default */ }
  }

  // Read package version for the wizard header
  const pkgPath = new URL('../../package.json', import.meta.url).pathname
  const version = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version

  // Run conversational wizard to gather what the user wants to build
  const { runWizard } = await import('./wizard.js')
  const answers = await runWizard({ version, root })

  // runAgent handles both new builds (_isEdit: false) and edits (_isEdit: true)
  const { runAgent } = await import('./agent-runner.js')
  await runAgent({ root, answers, agent, verbose })
  process.exit(0)
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

  // Copy assets from the package this CLI binary lives in (import.meta.url).
  // When globally npm-linked to the dev repo, this resolves to dev source.
  // When installed normally, this resolves to the installed version.
  const pkgPublic = new URL('../../public', import.meta.url).pathname
  const pkgSrc    = new URL('..', import.meta.url).pathname
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
    [path.join(pkgSrc, 'agent', 'checklist.md'),      'pulse-checklist.md'],
    [path.join(pkgSrc, 'agent', 'coverage-check.js'), 'coverage-check.js'],
  ]
  for (const [src, dst] of agentFiles) {
    if (fs.existsSync(src)) {
      const dstPath = path.join(root, '.claude', dst)
      fs.mkdirSync(path.dirname(dstPath), { recursive: true })
      fs.copyFileSync(src, dstPath)
      updated.push(`.claude/${dst}`)
    }
  }

  // Sync slash commands into .claude/commands/
  const commandsSrc = path.join(pkgSrc, 'agent', 'commands')
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

  const { c, ok: fmtOk, fail: fmtFail, icon } = await import('./fmt.js').catch(() => ({
    c: { dim: s => s, bold: s => s },
    ok: s => `  ✓ ${s}`,
    fail: s => `  ✗ ${s}`,
    icon: { bolt: () => '⚡' },
  }))

  console.log(`\n  ${icon.bolt()} ${c.bold('Pulse')} updated to ${c.bold(version)}\n`)
  for (const f of updated) console.log(fmtOk(f))
  for (const f of missing) console.log(fmtFail(`${f} not found in package`))
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
  case '-h': {
    const { c, icon } = await import('./fmt.js').catch(() => ({
      c: { bold: s => s, dim: s => s, cyan: s => s, purple: s => s, white: s => s },
      icon: { bolt: () => '⚡' },
    }))
    console.log(`
  ${icon.bolt()} ${c.bold('Pulse')}  ${c.dim('— spec-first frontend framework')}

  ${c.bold('Usage:')}  pulse ${c.dim('[command] [options]')}

  ${c.bold('Commands:')}
    ${c.cyan('(none)')}           ask what to build, then build it
    ${c.cyan('dev')}              start the dev server
    ${c.cyan('build')}            production build  ${c.dim('→ public/dist/')}
    ${c.cyan('start')}            production server ${c.dim('(requires prior build)')}
    ${c.cyan('update')}           re-copy pulse-ui assets from installed package

  ${c.bold('Options:')}
    ${c.cyan('--agent')} ${c.dim('<name>')}     use specific agent ${c.dim('(claude | copilot)')}
    ${c.cyan('--verbose')}          show full agent output while building
    ${c.cyan('-v')}, ${c.cyan('--version')}      print version and exit
    ${c.cyan('-h')}, ${c.cyan('--help')}         show this help

  ${c.bold('Examples:')}
    ${c.dim('pulse                      # wizard: ask, then build')}
    ${c.dim('pulse --verbose            # build with full agent output')}
    ${c.dim('pulse --agent copilot      # use GitHub Copilot CLI')}
    ${c.dim('pulse dev                  # dev server only')}
    ${c.dim('pulse build                # bundle for production')}
`)
    process.exit(0)
  }
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
  case 'link': {
    // DEV-ONLY: npm link the local dev repo into this project, then pulse update.
    const { execSync } = await import('child_process')
    console.log('\n  Linking @invisibleloop/pulse from dev repo…\n')
    execSync('npm link @invisibleloop/pulse', { cwd: CWD, stdio: 'inherit' })
    await runUpdate(CWD)
    break
  }
  default:
    await runDefault(CWD, agentFlag, verboseFlag)
}
