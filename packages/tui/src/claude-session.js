/**
 * Pulse TUI — Claude Code session driver
 *
 * Spawns `claude` as a subprocess in bidirectional stream-json mode and
 * exposes its event stream as a Node EventEmitter. This is the ONLY place
 * that knows about the Claude Code CLI's process/protocol shape — everything
 * above this (the Ink UI) only deals with parsed events.
 *
 * Auth: this uses the `claude` CLI exactly as an interactive terminal
 * session would — whatever account/subscription you're already logged into
 * on this machine. No separate API key, no separate billing.
 *
 * Protocol: --input-format stream-json / --output-format stream-json.
 * Input:  one JSON object per line on stdin, shape:
 *           { type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } }
 * Output: one JSON object per line on stdout. Observed event types:
 *           system   (subtype: 'init' — session_id, tools, mcp_servers, ...)
 *           assistant (message: { content: [...], usage, ... })
 *           rate_limit_event
 *           result   (final turn summary — cost, usage, stop_reason)
 *         Tool-use content blocks arrive nested inside assistant message
 *         content (type: 'tool_use') and their results as a following
 *         'user' message with a tool_result content block.
 *
 * IMPORTANT — verified against the real CLI, not assumed: `--print` mode is
 * fire-and-forget per turn. There is NO interactive mid-turn tool-approval
 * channel — `--permission-mode manual` does not pause and wait for a
 * decision, it silently auto-denies every tool call for that turn (each
 * shows up as a tool_result with is_error:true / non_execution_kind:
 * "user-rejected", and the denials are summarized in the final `result`
 * event's permission_denials array). Real interactive approve-before-it-
 * happens requires the Claude Agent SDK's canUseTool callback instead (a
 * different, API-key-billed auth model) — not available via this subprocess
 * approach.
 *
 * `acceptEdits` alone only covers file writes — browser-automation tools
 * (screenshot, tab management, used by /verify-style workflows) and other
 * non-edit tool categories were still silently denied under it (confirmed:
 * Claude reported "no permission to view screenshots" mid-session with no
 * way to grant it, since there's no interactive prompt in --print mode).
 * Defaults to `bypassPermissions` instead — this is a local dev tool acting
 * on the user's own machine/project, same trust boundary as running `claude`
 * directly in a terminal, so there is no meaningful safety benefit to
 * partial gating here, only broken tool categories. The UI layer shows a
 * git-diff-based review AFTER each turn completes, with revert as the
 * recovery path, rather than a pre-commit approval gate.
 */

import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import readline from 'node:readline'

/**
 * @param {object} opts
 * @param {string} opts.cwd - Project directory to run Claude Code in
 * @param {string} [opts.mcpConfigPath] - Path to a temp MCP config JSON file
 * @param {'manual'|'acceptEdits'|'auto'|'bypassPermissions'} [opts.permissionMode]
 * @returns {ClaudeSession}
 */
export function startClaudeSession({ cwd, mcpConfigPath, permissionMode = 'bypassPermissions' }) {
  return new ClaudeSession({ cwd, mcpConfigPath, permissionMode })
}

export class ClaudeSession extends EventEmitter {
  constructor({ cwd, mcpConfigPath, permissionMode }) {
    super()
    this.cwd = cwd
    this.sessionId = null
    this.ready = false

    const args = [
      '--print',
      '--output-format', 'stream-json',
      '--input-format', 'stream-json',
      '--verbose',
      '--permission-mode', permissionMode,
    ]
    if (mcpConfigPath) args.push('--mcp-config', mcpConfigPath)

    this.proc = spawn('claude', args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] })

    const rl = readline.createInterface({ input: this.proc.stdout })
    rl.on('line', (line) => this._handleLine(line))

    this.proc.stderr.on('data', (chunk) => {
      this.emit('stderr', chunk.toString())
    })

    this.proc.on('exit', (code, signal) => {
      this.emit('exit', { code, signal })
    })

    this.proc.on('error', (err) => {
      this.emit('error', err)
    })
  }

  _handleLine(line) {
    if (!line.trim()) return
    let event
    try {
      event = JSON.parse(line)
    } catch {
      // Non-JSON stdout noise — ignore rather than crash the session
      return
    }

    if (event.type === 'system' && event.subtype === 'init') {
      this.sessionId = event.session_id
      this.ready = true
    }

    this.emit('event', event)
    // Convenience: also emit by type so consumers don't all need a switch
    this.emit(event.type, event)
  }

  /**
   * Send a user turn. Must only be called after the session is ready
   * (after the first 'system' init event) for anything past the first turn —
   * the very first send() is what starts the session.
   * @param {string} text
   */
  send(text) {
    const line = JSON.stringify({
      type: 'user',
      message: { role: 'user', content: [{ type: 'text', text }] },
    })
    this.proc.stdin.write(line + '\n')
  }

  /**
   * Interrupt the current in-flight turn without ending the session or
   * killing the subprocess — verified directly against the real CLI (not
   * assumed/documented anywhere): sending a control_request with
   * subtype 'interrupt' gets a control_response, the CLI injects a
   * synthetic "[Request interrupted by user]" user message, and the
   * current turn's `result` event fires immediately with is_error: true
   * instead of running to completion. Safe to call with no turn in
   * flight — the CLI just responds success with nothing to interrupt.
   */
  interrupt() {
    const line = JSON.stringify({
      type: 'control_request',
      request: { subtype: 'interrupt' },
    })
    this.proc.stdin.write(line + '\n')
  }

  /** Tear down the subprocess — call when the TUI exits or the session ends. */
  destroy() {
    try { this.proc.stdin.end() } catch { /* already closed */ }
    try { this.proc.kill('SIGTERM') } catch { /* already dead */ }
  }
}
