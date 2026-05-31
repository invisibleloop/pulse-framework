/**
 * Pulse — Agent runner with progress display
 *
 * Launches the AI agent (Claude or Copilot) with a composed prompt.
 *
 * Normal mode:  agent runs non-interactively (-p / --print) with stdout
 *               parsed for tool-call events → rendered as clean status lines.
 *
 * Verbose mode: agent runs with inherited stdio (full interactive TUI).
 */

import { spawn }  from 'child_process'
import path       from 'path'
import os         from 'os'
import fs         from 'fs'

// ---------------------------------------------------------------------------
// Tool call → human label map
// Only tools in this map are shown — everything else is silently skipped.
// Internal claude tools (Edit, Read, Write, Bash, Glob, ToolSearch etc.)
// are not listed here and will never appear in the progress display.
// ---------------------------------------------------------------------------

const TOOL_LABELS = {
  // Pulse MCP tools
  pulse_intake:             'Understanding your brief',
  pulse_extract_inspiration:'Extracting design inspiration',
  pulse_sketch:             'Exploring layout directions',
  pulse_intent:             'Planning the build',
  pulse_create_page:        'Writing page spec',
  pulse_create_component:   'Writing component',
  pulse_validate:           'Checking spec',
  pulse_suggest:            'Reviewing draft',
  pulse_review:             'Code review',
  pulse_design_review:      'Design review',
  pulse_layout_review:      'Layout check',
  pulse_restart_server:     'Starting dev server',
  pulse_fetch_page:         'Testing page render',
  pulse_run_tests:          'Running tests',
  pulse_build:              'Production build',
  pulse_list_structure:     'Reading project structure',
  pulse_check_contrast:     'Checking colour contrast',
  pulse_update:             'Updating assets',
  // Chrome DevTools MCP
  navigate_page:            'Navigating browser',
  take_screenshot:          'Taking screenshot',
  lighthouse_audit:         'Running Lighthouse',
  performance_start_trace:  'Profiling performance',
  list_console_messages:    'Checking console',
}

// ---------------------------------------------------------------------------
// ANSI progress renderer (no Ink — runs after wizard unmounts)
// ---------------------------------------------------------------------------

const C = {
  reset:  '\x1b[0m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  white:  '\x1b[37m',
}

const SPINNER = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']

class Progress {
  constructor() {
    this.active     = null   // { label, id }
    this.spinnerIdx = 0
    this.interval   = null
  }

  start() {
    this.interval = setInterval(() => {
      this.spinnerIdx = (this.spinnerIdx + 1) % SPINNER.length
      if (this.active) this._tick()
    }, 80)
  }

  stop() {
    clearInterval(this.interval)
    if (this.active) this._commit(this.active.label, 'done')
    this.active = null
  }

  toolStart(label, id) {
    if (this.active) this._commit(this.active.label, 'done')
    this.active = { label, id }
    this._tick()
  }

  toolDone(id) {
    if (!this.active) return
    if (id !== undefined && this.active.id !== id) return  // not our tool
    this._commit(this.active.label, 'done')
    this.active = null
  }

  toolError(id) {
    if (!this.active) return
    if (id !== undefined && this.active.id !== id) return
    this._commit(this.active.label, 'error')
    this.active = null
  }

  // Overwrite the current line in-place (spinner update)
  _tick() {
    const spin = `${C.cyan}${SPINNER[this.spinnerIdx]}${C.reset}`
    process.stdout.write(`\r  ${spin}  ${this.active.label}  `)
  }

  // Finalise the current line and move to next
  _commit(label, status) {
    const icon = status === 'done'
      ? `${C.green}✓${C.reset}`
      : `${C.red}✗${C.reset}`
    process.stdout.write(`\r  ${icon}  ${label}\n`)
  }
}

// ---------------------------------------------------------------------------
// Parse claude stream-json events
// ---------------------------------------------------------------------------

// Tracked tool_use_id → label for in-flight meaningful tool calls
const pending = new Map()

function normalizeToolName(raw) {
  return raw
    .replace(/^mcp__pulse__/, '')
    .replace(/^mcp__chrome-devtools__/, '')
}

function parseStreamLine(line, progress) {
  let event
  try { event = JSON.parse(line) } catch { return }

  if (event.type === 'assistant' && event.message?.content) {
    for (const block of event.message.content) {
      if (block.type !== 'tool_use') continue
      const name  = normalizeToolName(block.name)
      const label = TOOL_LABELS[name]
      if (!label) continue  // skip internal tools (Edit, Read, Bash, ToolSearch…)
      pending.set(block.id, label)
      progress.toolStart(label, block.id)
    }
  }

  // Tool result — only commit if it's one we're tracking
  if (event.type === 'tool' && event.tool_use_id) {
    const label = pending.get(event.tool_use_id)
    if (label) {
      pending.delete(event.tool_use_id)
      progress.toolDone(event.tool_use_id)
    }
  }
}

// ---------------------------------------------------------------------------
// Compose the initial build prompt from wizard answers
// ---------------------------------------------------------------------------

export function composeBuildPrompt(answers) {
  const parts = [
    `Build a new page for this project. Work fully autonomously — do not stop or ask for confirmation at any point.`,
    ``,
    `**What to build:** ${answers.intent}`,
    answers.name     && `**Product name:** ${answers.name}`,
    answers.audience && `**Target audience:** ${answers.audience}`,
    answers.features && `**Key features:** ${answers.features}`,
    answers.vibe     && `**Visual vibe:** ${answers.vibe}`,
    ``,
    `Run these steps once, in order, without repeating any earlier steps:`,
    `1. pulse_intake`,
    `2. pulse_sketch`,
    `3. pulse_intent`,
    `4. Write the spec file`,
    `5. pulse_validate — fix errors in the spec, then continue`,
    `6. pulse_fetch_page — confirm server renders the page`,
    `7. Screenshot + pulse_design_review + pulse_layout_review`,
    `8. Lighthouse (desktop then mobile) — fix any score below 100, do NOT re-run intake/sketch`,
    `9. pulse_review — fix issues found, do NOT re-run intake/sketch`,
    `10. Start the dev server`,
    ``,
    `When complete, output a single line: "Ready → http://localhost:PORT"`,
  ]
  return parts.filter(Boolean).join('\n')
}

// ---------------------------------------------------------------------------
// Launch Claude (normal — non-interactive with progress)
// ---------------------------------------------------------------------------

async function launchClaude(root, mcpConfigPath, prompt, verbose) {
  const progress = verbose ? null : new Progress()
  if (progress) progress.start()

  const args = verbose
    ? ['--mcp-config', mcpConfigPath, '--', prompt]
    : [
        '-p',
        '--output-format', 'stream-json',
        '--permission-mode', 'auto',
        '--mcp-config', mcpConfigPath,
        '--', prompt,
      ]

  const proc = spawn('claude', args, {
    stdio: verbose ? 'inherit' : ['ignore', 'pipe', 'ignore'],  // ignore stderr in normal mode
    cwd:   root,
  })

  if (!verbose) {
    let buf = ''
    proc.stdout.on('data', chunk => {
      buf += chunk.toString()
      const lines = buf.split('\n')
      buf = lines.pop()
      for (const line of lines) {
        if (line.trim()) parseStreamLine(line.trim(), progress)
      }
    })
  }

  return new Promise(resolve => {
    proc.on('exit', code => {
      if (progress) progress.stop()
      if (code && code !== 0) {
        process.stdout.write(`\n  ${C.red}Agent exited with code ${code}${C.reset}\n`)
        process.stdout.write(`  Run ${C.cyan}pulse --verbose${C.reset} to see full output.\n\n`)
      }
      resolve(code ?? 0)
    })
    proc.on('error', err => {
      if (progress) progress.stop()
      console.error(`\n  ${C.red}✗${C.reset}  Could not start claude: ${err.message}`)
      console.error(`  Make sure Claude Code is installed: https://claude.ai/code\n`)
      resolve(1)
    })
  })
}

// ---------------------------------------------------------------------------
// Launch Copilot (verbose only for now)
// ---------------------------------------------------------------------------

async function launchCopilot(root, mcpServerPath, prompt, verbose) {
  const { spawn: sp } = await import('child_process')
  const copilotArgs   = ['--mcp-config', JSON.stringify({
    mcpServers: {
      pulse: { command: process.execPath, args: [mcpServerPath, '--root', root] }
    }
  })]

  const proc = sp('gh', ['copilot', 'suggest', '--target', 'shell', prompt], {
    stdio: 'inherit',
    cwd:   root,
  })

  return new Promise(resolve => {
    proc.on('exit', code => resolve(code ?? 0))
    proc.on('error', err => {
      console.error(`\n  Could not start Copilot: ${err.message}\n`)
      resolve(1)
    })
  })
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function runAgent({ root, answers, agent = 'claude', verbose = false }) {
  const mcpServerPath = new URL('../mcp/server.js', import.meta.url).pathname
  const mcpConfigPath = path.join(os.tmpdir(), `pulse-mcp-${Date.now()}.json`)

  fs.writeFileSync(mcpConfigPath, JSON.stringify({
    mcpServers: {
      pulse: {
        command: process.execPath,
        args:    [mcpServerPath, '--root', root],
      }
    }
  }, null, 2))

  const prompt = composeBuildPrompt(answers)

  process.env.PULSE_AGENT_MODE = '1'

  if (!verbose) {
    process.stdout.write(`\n  Building ${answers.name || 'your page'}…\n\n`)
  }

  try {
    if (agent === 'copilot') {
      await launchCopilot(root, mcpServerPath, prompt, verbose)
    } else {
      await launchClaude(root, mcpConfigPath, prompt, verbose)
    }
  } finally {
    try { fs.unlinkSync(mcpConfigPath) } catch { /* ignore */ }
  }
}
