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

// Returns detected URL if found in agent text, otherwise null
function parseStreamLine(line, progress) {
  let event
  try { event = JSON.parse(line) } catch { return null }

  if (event.type === 'assistant' && event.message?.content) {
    let detectedUrl = null
    for (const block of event.message.content) {
      if (block.type === 'text') {
        // Look for "Ready → http://..." in the agent's final message
        const match = block.text?.match(/https?:\/\/localhost:\d+\S*/i)
        if (match) detectedUrl = match[0].replace(/[.,;)]$/, '')
      }
      if (block.type !== 'tool_use') continue
      const name  = normalizeToolName(block.name)
      const label = TOOL_LABELS[name]
      if (!label) continue  // skip internal tools (Edit, Read, Bash, ToolSearch…)
      pending.set(block.id, label)
      progress.toolStart(label, block.id)
    }
    if (detectedUrl) return detectedUrl
  }

  // Tool result — only commit if it's one we're tracking
  if (event.type === 'tool' && event.tool_use_id) {
    const label = pending.get(event.tool_use_id)
    if (label) {
      pending.delete(event.tool_use_id)
      progress.toolDone(event.tool_use_id)
    }
  }

  return null
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

async function launchClaude(root, mcpConfigPath, prompt, verbose, answers) {
  const progress = verbose ? null : new Progress()
  if (progress) progress.start()

  const args = verbose
    ? ['--mcp-config', mcpConfigPath, '--', prompt]
    : [
        '-p',
        '--output-format', 'stream-json',
        '--permission-mode', 'bypassPermissions',
        '--mcp-config', mcpConfigPath,
        '--', prompt,
      ]

  const proc = spawn('claude', args, {
    stdio: verbose ? 'inherit' : ['ignore', 'pipe', 'ignore'],  // ignore stderr in normal mode
    cwd:   root,
  })

  let detectedUrl = null

  if (!verbose) {
    let buf = ''
    proc.stdout.on('data', chunk => {
      buf += chunk.toString()
      const lines = buf.split('\n')
      buf = lines.pop()
      for (const line of lines) {
        const url = line.trim() ? parseStreamLine(line.trim(), progress) : null
        if (url) detectedUrl = url
      }
    })
  }

  return new Promise(resolve => {
    proc.on('exit', code => {
      if (progress) progress.stop()
      if (code && code !== 0) {
        process.stdout.write(`\n  ${C.red}✗  Agent exited with code ${code}${C.reset}\n`)
        process.stdout.write(`  Run ${C.cyan}pulse --verbose${C.reset} to see full output.\n\n`)
      } else {
        // Completion banner
        const url = detectedUrl || `http://localhost:3000`
        process.stdout.write(`\n  ${C.green}${C.bold}✓ Done!${C.reset}  ${answers.name || 'Your page'} is ready\n`)
        process.stdout.write(`\n  ${C.cyan}${url}${C.reset}\n\n`)
      }
      resolve(code ?? 0)
    })
    proc.on('error', err => {
      if (progress) progress.stop()
      process.stderr.write(`\n  ${C.red}✗${C.reset}  Could not start claude: ${err.message}\n`)
      process.stderr.write(`  Make sure Claude Code is installed: https://claude.ai/code\n\n`)
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

// ---------------------------------------------------------------------------
// Follow-up prompt — ask for changes after a completed build
// ---------------------------------------------------------------------------

function askFollowUp() {
  return new Promise(resolve => {
    process.stdout.write(`  ${C.gray}What would you like to change?${C.reset}  ${C.dim}(↵ to exit)${C.reset}  `)
    process.stdin.setEncoding('utf8')
    process.stdin.resume()
    process.stdin.once('data', d => {
      process.stdin.pause()
      resolve(d.trim())
    })
  })
}

function composeEditPrompt(feedback, answers) {
  return [
    `Edit the page you just built for "${answers.name || answers.intent}".`,
    ``,
    `Requested changes: ${feedback}`,
    ``,
    `Rules:`,
    `- Do NOT re-run pulse_intake, pulse_sketch, or pulse_intent`,
    `- Make only the changes requested — do not rebuild from scratch`,
    `- After editing, run pulse_validate, take a screenshot, run Lighthouse if layout changed`,
    `- Keep the dev server running throughout`,
    `- When done, output: "Ready → http://localhost:PORT"`,
  ].join('\n')
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

  process.env.PULSE_AGENT_MODE = '1'

  const isEdit = answers._isEdit === true

  // Status line
  if (!verbose) {
    const action = isEdit ? 'Working on' : 'Building'
    const subject = answers.name || (isEdit ? 'your project' : 'your page')
    process.stdout.write(`\n  ${action} ${subject}…\n\n`)
  }

  const runClaude = (prompt) => launchClaude(root, mcpConfigPath, prompt, verbose, answers)

  try {
    // For existing-project edits, skip the full intake workflow
    const initialPrompt = isEdit
      ? composeEditPrompt(answers.intent, answers)
      : composeBuildPrompt(answers)

    let code = agent === 'copilot'
      ? await launchCopilot(root, mcpServerPath, initialPrompt, verbose)
      : await runClaude(initialPrompt)

    // Follow-up loop — let user request changes until they press Enter
    if (code === 0 && !verbose && process.stdin.isTTY) {
      while (true) {
        const feedback = await askFollowUp()
        if (!feedback) {
          process.stdout.write('\n')
          break
        }
        process.stdout.write(`\n  Making changes…\n\n`)
        await runClaude(composeEditPrompt(feedback, answers))
      }
    }
  } finally {
    try { fs.unlinkSync(mcpConfigPath) } catch { /* ignore */ }
  }
}
