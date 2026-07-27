/**
 * Pulse TUI — root Ink app
 *
 * No JSX — Node doesn't strip JSX natively and this package intentionally
 * has no build step (`node --watch src/cli.js` runs it directly, matching
 * the rest of this repo's no-bundler-in-dev philosophy). Ink is just React,
 * so React.createElement works exactly the same as JSX would, just more
 * verbose. `h` is a short alias to keep the component bodies readable.
 */

import React, { useState, useEffect } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { renderMarkdown } from './markdown.js'

const h = React.createElement

// Real slash_commands only arrives on the system:init event, which — per
// the verified stream-json protocol — only fires after the FIRST message is
// sent. That leaves a real gap: typing "/" before sending anything shows no
// suggestions at all. Seed a small, commonly-used fallback so "/" always
// shows something from the very first keystroke; the moment the real list
// arrives it fully replaces this (see setSlashCommands in App below).
const FALLBACK_COMMANDS = ['model', 'clear', 'compact', 'context', 'effort', 'config', 'review']

// Second-level argument suggestions for the handful of commands where it's
// genuinely safe and useful — verified directly against real `/model` and
// `/effort` usage text (Usage: /model <name>. Available: ...) rather than
// assumed. Deliberately NOT exhaustive: most slash commands either act
// immediately with no args (e.g. /clear — confirmed unsafe to "probe" for
// usage, it just clears the session) or have far too many options to
// usefully hardcode (/config alone has 30+ keys, each with its own enum) —
// those stay plain text entry with no second-level autocomplete.
const COMMAND_ARGS = {
  model:  ['sonnet', 'opus', 'haiku', 'fable', 'best', 'sonnet[1m]', 'opus[1m]', 'fable[1m]', 'opusplan', 'default'],
  effort: ['low', 'medium', 'high', 'xhigh', 'max', 'auto'],
}

// Mirrors Forge's own theme tokens (packages/tui's sibling desktop-app
// project) for visual continuity across the two front ends to the same
// underlying Pulse + Claude Code workflow.
const COLORS = {
  accent:    '#5b8def',
  accentDim: '#3a4a6b',
  muted:     '#6b7a99',
  surface:   '#13161e',
  green:     '#3ecf8e',
  yellow:    '#f5a623',
  red:       '#f75656',
  code:      '#f5a623',
}

function StatusBar({ projectName, devServer, claudeReady }) {
  const serverLabel = !devServer
    ? h(Text, { color: COLORS.muted }, '○ server: stopped')
    : devServer.ready
      ? h(Text, { color: COLORS.green }, `● server: ${devServer.url}`)
      : h(Text, { color: COLORS.yellow }, '◐ server: starting…')

  return h(Box, {
    borderStyle: 'round',
    borderColor: COLORS.muted,
    paddingX: 1,
    justifyContent: 'space-between',
  },
    h(Text, { bold: true, color: COLORS.accent }, `⚡ ${projectName}`),
    h(Box, { gap: 2 },
      serverLabel,
      h(Text, { color: claudeReady ? COLORS.green : COLORS.muted },
        claudeReady ? '● claude: ready' : '◐ claude: starting…'),
    ),
  )
}

function Message({ role, text }) {
  const isUser = role === 'user'
  return h(Box, { marginBottom: 1, flexDirection: 'column' },
    h(Box, { gap: 1 },
      h(Text, { color: isUser ? COLORS.accent : COLORS.green }, isUser ? '❯' : '✦'),
      h(Text, { bold: true, color: isUser ? COLORS.accent : COLORS.green },
        isUser ? 'you' : 'claude'),
    ),
    // User turns are plain text/slash commands — no markdown to parse.
    // Claude's replies routinely use bold/code/lists, so render those
    // properly instead of showing raw ** and ` characters.
    isUser
      ? h(Box, { paddingLeft: 2 }, h(Text, null, text))
      : h(Box, { flexDirection: 'column', paddingLeft: 2 },
          ...renderMarkdown(text, {
            accentColor: COLORS.accent,
            mutedColor: COLORS.muted,
            greenColor: COLORS.green,
            yellowColor: COLORS.yellow,
            redColor: COLORS.red,
          })),
  )
}

// Per-tool-type human-readable summary. Bash carries its own `description`
// field ("List files in current directory") which reads far better than the
// raw command — verified against real tool_use events, not assumed; other
// tools (Write, Edit, Read, Grep) have no such field and need their own
// shape-specific formatting instead of one generic fallback.
function summarizeToolInput(name, input) {
  if (!input) return name
  if (name === 'Bash') return input.description || input.command || name
  if (name === 'Write' || name === 'Read') return `${name} ${shortenPath(input.file_path)}`
  if (name === 'Edit') return `Edit ${shortenPath(input.file_path)}`
  if (name === 'Grep') return `Grep "${input.pattern}"${input.path ? ` in ${shortenPath(input.path)}` : ''}`
  if (input.file_path) return `${name} ${shortenPath(input.file_path)}`
  if (input.command) return `${name} ${input.command}`
  return name
}

function shortenPath(p) {
  if (!p) return ''
  const parts = p.split('/')
  return parts.length > 3 ? `…/${parts.slice(-2).join('/')}` : p
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

function useSpinnerFrame(active) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (!active) return
    // 80ms (12.5fps) caused visible whole-screen flicker/jitter in real use
    // — Ink redraws its full output buffer on every state change, it's not
    // a localized DOM patch like a browser, so a fast ambient spinner tick
    // has real cost here. 250ms (4fps) still reads as "alive" without it.
    const id = setInterval(() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length), 250)
    return () => clearInterval(id)
  }, [active])
  return SPINNER_FRAMES[frame]
}

// `/status` is a real slash command in interactive `claude` but the CLI
// itself refuses it under --print/stream-json — verified directly against
// the subprocess: it returns a synthetic assistant reply ("/status isn't
// available in this environment", model: "<synthetic>", zero tokens) rather
// than the real status panel. Forwarding it is a dead end, so it's
// intercepted client-side instead and rendered from state this UI already
// tracks (system:init payload + dev server state) rather than sent to Claude.
function StatusMessage({ info, devServer }) {
  // sessionInfo only exists once system:init has fired, which only happens
  // after the FIRST real turn is sent to the subprocess — if /status is the
  // very first message ever sent, info is still null at render time (a real
  // data-availability gap, not a stale snapshot). Show a clear "still
  // starting" line instead of a wall of "—" placeholders that look broken.
  if (!info) {
    return h(Box, { flexDirection: 'column', marginBottom: 1 },
      h(Box, { gap: 1 },
        h(Text, { color: COLORS.green }, '✦'),
        h(Text, { bold: true, color: COLORS.green }, 'status'),
      ),
      h(Box, { paddingLeft: 2 },
        h(Text, { color: COLORS.muted }, 'Session details arrive after the first message — try /status again.'),
      ),
    )
  }
  const row = (label, value) => h(Box, { key: label, gap: 1 },
    h(Text, { color: COLORS.muted }, `${label}:`),
    h(Text, null, value ?? '—'),
  )
  return h(Box, { flexDirection: 'column', marginBottom: 1 },
    h(Box, { gap: 1 },
      h(Text, { color: COLORS.green }, '✦'),
      h(Text, { bold: true, color: COLORS.green }, 'status'),
    ),
    h(Box, { flexDirection: 'column', paddingLeft: 2 },
      row('model', info.model),
      row('permission mode', info.permissionMode),
      row('session id', info.sessionId),
      row('cwd', info.cwd),
      row('claude code', info.version),
      row('mcp servers', info.mcpServers?.length
        ? info.mcpServers.map((s) => `${s.name} (${s.status})`).join(', ')
        : 'none'),
      row('dev server', devServer?.ready ? devServer.url : 'starting…'),
    ),
  )
}

function ToolCallLine({ name, input, status }) {
  // A running tool (e.g. Write/Edit on a large file) can take real time with
  // no other events on the wire in between — a static "⚙" gave no sign
  // anything was still happening, easy to mistake for a stalled/dead line.
  // Animate the icon itself while running, same spinner as ThinkingLine, so
  // the specific in-flight tool call is what visibly pulses.
  const runningFrame = useSpinnerFrame(status === 'running')
  const icon = status === 'done' ? h(Text, { color: COLORS.green }, '✓')
    : status === 'error' ? h(Text, { color: COLORS.red }, '✗')
    : h(Text, { color: COLORS.yellow }, runningFrame)
  // marginBottom matches Message's spacing — without it, a tool line sat
  // flush against the next message with no visual separation.
  return h(Box, { gap: 1, marginBottom: 1 },
    icon,
    h(Text, { color: COLORS.muted }, summarizeToolInput(name, input)),
  )
}

function ThinkingLine() {
  const frame = useSpinnerFrame(true)
  return h(Box, { gap: 1 },
    h(Text, { color: COLORS.accent }, frame),
    h(Text, { color: COLORS.muted }, 'thinking…'),
  )
}

function InterruptedLine() {
  return h(Box, { gap: 1, marginBottom: 1 },
    h(Text, { color: COLORS.red }, '✗'),
    h(Text, { color: COLORS.muted }, 'Interrupted'),
  )
}

// Rendering every message ever received with no bound was a real, confirmed
// bug: as a conversation grows, Ink has to redraw an ever-taller full-screen
// buffer on every state change (Ink reprints its whole output on each
// render, it doesn't patch the terminal like a browser DOM), which is what
// caused "the whole window shifts" and constant scrollbar flicker in real
// use, and effectively pushed the input bar off-screen as history grew.
// This is a stopgap (show only the most recent messages) rather than real
// scrollback — a proper scrollable history view is a bigger feature.
const MAX_VISIBLE_MESSAGES = 20

function ConversationPane({ messages, isThinking }) {
  const visible = messages.slice(-MAX_VISIBLE_MESSAGES)
  return h(Box, { flexDirection: 'column', flexGrow: 1, paddingX: 1 },
    messages.length > visible.length
      ? h(Text, { key: 'truncated', color: COLORS.muted, dimColor: true },
          `… ${messages.length - visible.length} earlier message${messages.length - visible.length === 1 ? '' : 's'} not shown`)
      : null,
    ...visible.map((m, i) => {
      if (m.kind === 'tool') return h(ToolCallLine, { key: i, name: m.name, input: m.input, status: m.status })
      if (m.kind === 'status') return h(StatusMessage, { key: i, info: m.info, devServer: m.devServer })
      if (m.kind === 'interrupted') return h(InterruptedLine, { key: i })
      return h(Message, { key: i, role: m.role, text: m.text })
    }),
    isThinking ? h(ThinkingLine, { key: 'thinking' }) : null,
  )
}

// A right-hand column was tried here (full-height flex sibling next to
// ConversationPane) but reverted — a real, confirmed problem, not just
// cosmetic: Ink pads every row of a flex-grown Box out to its full computed
// width with invisible spaces, since terminal output is a character grid,
// not a DOM where empty space costs nothing. Every short conversation line
// was followed by a long run of blank cells before the output column's
// border, and that padding is exactly what a terminal's click-drag selection
// captures — copy/paste picked up huge invisible gaps on every line. Back to
// a horizontal strip below the conversation, which doesn't force a tall
// empty column to pad against.
const OUTPUT_PANE_VISIBLE_LINES = 8

// scrollOffset is "lines back from the newest line" (0 = following latest),
// owned by App and adjusted via PageUp/PageDown — the pane buffers up to 200
// lines but previously only ever showed the last 8 with no way to reach the
// rest, a real gap since dev-server errors could scroll out of view unseen.
function OutputPane({ lines, scrollOffset }) {
  // Self-clamp rather than trust the caller's offset is always in range —
  // an offset stale from a longer buffer (e.g. after a reconnect resets
  // outputLines to a shorter array) previously produced an empty {0,0}
  // window instead of falling back to the oldest available lines.
  const clampedOffset = Math.max(0, Math.min(scrollOffset, Math.max(0, lines.length - OUTPUT_PANE_VISIBLE_LINES)))
  const end = Math.max(0, lines.length - clampedOffset)
  const start = Math.max(0, end - OUTPUT_PANE_VISIBLE_LINES)
  const visible = lines.slice(start, end)
  const hasMoreAbove = start > 0
  const isScrolledBack = clampedOffset > 0

  return h(Box, {
    flexDirection: 'column',
    borderStyle: 'round',
    borderColor: COLORS.muted,
    paddingX: 1,
    height: 10,
  },
    h(Box, { justifyContent: 'space-between' },
      h(Text, { bold: true, color: COLORS.muted }, 'dev server output'),
      (hasMoreAbove || isScrolledBack)
        ? h(Text, { color: COLORS.muted, dimColor: true },
            `[${start + 1}-${end}/${lines.length}]${isScrolledBack ? ' PgDn to follow' : ' PgUp for more'}`)
        : null,
    ),
    ...visible.map((l, i) =>
      h(Text, { key: start + i, color: l.level === 'error' ? COLORS.red : undefined, wrap: 'truncate' }, l.text)
    ),
  )
}

const MAX_SUGGESTIONS = 8

// Slash commands come from the system:init event's slash_commands array —
// plain names with no leading slash (e.g. "model", "clear"), verified
// against real output earlier. Filters to commands whose name starts with
// whatever's typed after the "/".
function matchCommands(commands, typed) {
  const query = typed.slice(1).toLowerCase() // drop the leading '/'
  return commands
    .filter((c) => c.toLowerCase().startsWith(query))
    .slice(0, MAX_SUGGESTIONS)
}

// Once a full command name is followed by a space (e.g. "/model " or
// "/model son"), suggest that command's known argument values if we have
// them in COMMAND_ARGS. Returns null (not an empty array) when the typed
// command has no known args, so callers can tell "no matches for what you
// typed" apart from "this command has no suggestion list at all".
function matchCommandArgs(typed) {
  const spaceIndex = typed.indexOf(' ')
  if (spaceIndex === -1) return null
  const commandName = typed.slice(1, spaceIndex).toLowerCase()
  const args = COMMAND_ARGS[commandName]
  if (!args) return null
  const argQuery = typed.slice(spaceIndex + 1).toLowerCase()
  return args.filter((a) => a.toLowerCase().startsWith(argQuery)).slice(0, MAX_SUGGESTIONS)
}

function CommandSuggestions({ matches, selectedIndex, prefix }) {
  if (matches.length === 0) return null
  return h(Box, { flexDirection: 'column', paddingX: 1 },
    ...matches.map((item, i) =>
      h(Text, {
        key: item,
        color: i === selectedIndex ? COLORS.accent : COLORS.muted,
        bold: i === selectedIndex,
      }, `${i === selectedIndex ? '❯ ' : '  '}${prefix}${item}`)
    ),
  )
}

// Word-boundary helpers for Option/Ctrl+Arrow-style jumps — treats runs of
// non-whitespace as a "word", mirroring standard terminal/editor behavior.
function prevWordBoundary(value, cursor) {
  let i = cursor
  while (i > 0 && /\s/.test(value[i - 1])) i--
  while (i > 0 && !/\s/.test(value[i - 1])) i--
  return i
}
function nextWordBoundary(value, cursor) {
  let i = cursor
  while (i < value.length && /\s/.test(value[i])) i++
  while (i < value.length && !/\s/.test(value[i])) i++
  return i
}

function InputBar({ onSubmit, commands }) {
  const [value, setValue] = useState('')
  // Index into value where the next typed character is inserted — without
  // this, edits could only ever append/backspace at the end of the string,
  // making arrow-key navigation and mid-string edits structurally
  // impossible (a real, confirmed bug, not just a missing key handler).
  const [cursor, setCursorRaw] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Every write goes through this so the cursor can never point outside the
  // current string, regardless of what changed value (typing, backspace,
  // or autocomplete replacing the whole string via setValue).
  const setCursor = (next) => setCursorRaw(Math.max(0, Math.min(next, value.length)))

  // Two distinct suggestion modes, mutually exclusive:
  //   command mode  — "/mo"        -> suggest command names ("model", ...)
  //   argument mode — "/model son" -> suggest that command's known values
  // matchCommandArgs returns null when there's no known arg list for the
  // typed command (most commands), which falls back to no suggestions at
  // all for the argument portion — plain text entry, same as before.
  const isCommandMode = value.startsWith('/') && !value.includes(' ')
  const argMatches = value.startsWith('/') && value.includes(' ') ? matchCommandArgs(value) : null
  const isArgMode = argMatches !== null

  const matches = isCommandMode ? matchCommands(commands, value)
    : isArgMode ? argMatches
    : []
  const suggestionPrefix = isCommandMode ? '/' : ''
  const showingSuggestions = isCommandMode || isArgMode

  useInput((input, key) => {
    if (showingSuggestions && matches.length > 0) {
      if (key.upArrow) {
        setSelectedIndex((i) => (i - 1 + matches.length) % matches.length)
        return
      }
      if (key.downArrow) {
        setSelectedIndex((i) => (i + 1) % matches.length)
        return
      }
      if (key.tab) {
        if (isCommandMode) {
          const next = `/${matches[selectedIndex]} `
          setValue(next)
          setCursorRaw(next.length)
        } else {
          // Replace only the argument portion, keep "/command " as-is
          const spaceIndex = value.indexOf(' ')
          const next = `${value.slice(0, spaceIndex + 1)}${matches[selectedIndex]}`
          setValue(next)
          setCursorRaw(next.length)
        }
        setSelectedIndex(0)
        return
      }
    }

    if (key.return) {
      // Enter with an active suggestion accepts it rather than submitting
      // the partial "/mo" text — matches the familiar autocomplete pattern
      // (Slack, Discord, Claude Code's own CLI). In argument mode this
      // submits the full command immediately rather than just filling it
      // in, since picking a value is normally the last step.
      if (isCommandMode && matches.length > 0) {
        onSubmit(`/${matches[selectedIndex]}`)
        setValue('')
        setCursorRaw(0)
        setSelectedIndex(0)
        return
      }
      if (isArgMode && matches.length > 0) {
        const spaceIndex = value.indexOf(' ')
        onSubmit(`${value.slice(0, spaceIndex + 1)}${matches[selectedIndex]}`)
        setValue('')
        setCursorRaw(0)
        setSelectedIndex(0)
        return
      }
      const trimmed = value.trim()
      if (trimmed) {
        onSubmit(trimmed)
        setValue('')
        setCursorRaw(0)
      }
      return
    }

    // Cursor movement — plain arrow keys move one character; meta/ctrl+arrow
    // (Option+Arrow on macOS terminals, Ctrl+Arrow elsewhere) jumps by word,
    // matching standard terminal/editor conventions. Without this the input
    // could only ever be edited at its end (the original bug report).
    if (key.leftArrow) {
      setCursor(key.meta || key.ctrl ? prevWordBoundary(value, cursor) : cursor - 1)
      return
    }
    if (key.rightArrow) {
      setCursor(key.meta || key.ctrl ? nextWordBoundary(value, cursor) : cursor + 1)
      return
    }
    if (key.home || (key.ctrl && input === 'a')) {
      setCursor(0)
      return
    }
    if (key.end || (key.ctrl && input === 'e')) {
      setCursor(value.length)
      return
    }

    if (key.backspace || key.delete) {
      if (cursor === 0) return
      setValue((v) => v.slice(0, cursor - 1) + v.slice(cursor))
      setCursorRaw((c) => c - 1)
      setSelectedIndex(0)
      return
    }
    // Ignore other control/meta keys — only accumulate printable input
    if (!key.ctrl && !key.meta && input) {
      setValue((v) => v.slice(0, cursor) + input + v.slice(cursor))
      setCursorRaw((c) => c + input.length)
      setSelectedIndex(0)
    }
  })

  // Fake terminal cursor — Ink's real useCursor hook is coordinate-based (for
  // IME support) and needs manual text-width measurement to place correctly
  // inside a Box; an inverted single-character block is the standard pattern
  // other Ink CLIs use for a plain single-line input instead. Split the value
  // at the cursor index so the block renders at the actual edit position,
  // not always trailing — otherwise there is no visual feedback for where
  // edits will land after moving the cursor mid-string.
  const before = value.slice(0, cursor)
  const atCursor = value[cursor] ?? ' '
  const after = value.slice(cursor + 1)

  return h(Box, { flexDirection: 'column' },
    showingSuggestions ? h(CommandSuggestions, { matches, selectedIndex, prefix: suggestionPrefix }) : null,
    h(Box, { borderStyle: 'round', borderColor: COLORS.accent, paddingX: 1 },
      h(Text, { color: COLORS.accent }, '❯ '),
      h(Text, null,
        h(Text, null, before),
        h(Text, { inverse: true }, atCursor),
        h(Text, null, after),
      ),
    ),
  )
}

export function App({ projectName, claude, devServer }) {
  const { exit } = useApp()
  // Static, no API call — instant on startup rather than waiting on a real
  // turn just to say hello. Seeded once from the initial useState value, not
  // re-added on every render.
  const [messages, setMessages] = useState(() => [
    { role: 'assistant', text: `Ready to build ${projectName}. Tell me what you'd like to do.` },
  ])
  const [claudeReady, setClaudeReady] = useState(false)
  const [slashCommands, setSlashCommands] = useState(FALLBACK_COMMANDS)
  const [sessionInfo, setSessionInfo] = useState(null)
  const [devServerState, setDevServerState] = useState(null)
  const [outputLines, setOutputLines] = useState([])
  // Lines back from the newest line the visible window starts at — 0 means
  // "following the latest output" (the normal/default state). PageUp moves
  // this up into history; PageDown moves it back down toward 0. Needed
  // because the pane only ever showed the last 8 of up to 200 buffered
  // lines with no way to reach the rest — a real, confirmed gap, not just
  // a nice-to-have.
  const [outputScrollOffset, setOutputScrollOffset] = useState(0)
  // True from the moment a user message is sent until the first assistant
  // event for that turn arrives — there is no distinct "thinking" event on
  // the wire (verified: silence on stdout is the only signal), so this is
  // inferred client-side rather than driven by a real protocol event.
  const [isThinking, setIsThinking] = useState(false)

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      // While a turn is in flight, Ctrl+C interrupts it (verified against
      // the real CLI: a control_request/interrupt message ends the current
      // turn immediately without killing the subprocess or session) instead
      // of quitting the whole TUI — quitting mid-turn was the previous
      // behavior and is surprising when the user just wants to stop Claude
      // from continuing, not lose the session. Ctrl+C with nothing running
      // quits as before, matching the expectation that the app is idle.
      if (isThinking) {
        claude?.interrupt()
      } else {
        claude?.destroy()
        devServer?.destroy()
        exit()
      }
      return
    }
    if (key.pageUp) {
      setOutputScrollOffset((offset) =>
        Math.min(offset + OUTPUT_PANE_VISIBLE_LINES, Math.max(0, outputLines.length - OUTPUT_PANE_VISIBLE_LINES)))
    }
    if (key.pageDown) {
      setOutputScrollOffset((offset) => Math.max(0, offset - OUTPUT_PANE_VISIBLE_LINES))
    }
  })

  useEffect(() => {
    if (!claude) return

    const onEvent = (event) => {
      if (event.type === 'system' && event.subtype === 'init') {
        setClaudeReady(true)
        setSlashCommands(event.slash_commands ?? [])
        const info = {
          model: event.model,
          permissionMode: event.permissionMode,
          sessionId: event.session_id,
          cwd: event.cwd,
          version: event.claude_code_version,
          mcpServers: event.mcp_servers,
        }
        setSessionInfo(info)
        // Backfill any /status message rendered before this session's first
        // system:init arrived (e.g. /status was the very first thing sent) —
        // updates it in place rather than leaving a stale "try again" placeholder.
        setMessages((m) => m.map((msg) =>
          msg.kind === 'status' && !msg.info ? { ...msg, info } : msg
        ))
      }

      // The CLI refuses "/status" itself under --print with a synthetic
      // reply ("/status isn't available in this environment", model:
      // "<synthetic>") — that's expected (we send it only to force
      // system:init) and must not show up as a real assistant message.
      const isSyntheticReply = event.type === 'assistant' && event.message?.model === '<synthetic>'

      if (event.type === 'assistant' && !isSyntheticReply) {
        setIsThinking(false)
        const content = event.message?.content ?? []
        for (const block of content) {
          if (block.type === 'text' && block.text) {
            setMessages((m) => [...m, { role: 'assistant', text: block.text }])
          }
          if (block.type === 'tool_use') {
            // Claude may keep "thinking" between this tool call and its
            // result / the next assistant message — flip back on so the
            // spinner reappears rather than the UI looking idle again.
            setIsThinking(true)
            setMessages((m) => [...m, { kind: 'tool', id: block.id, name: block.name, input: block.input, status: 'running' }])
          }
        }
      }

      // Tool results arrive as a 'user' message with tool_result content
      // blocks — match by tool_use_id to flip the corresponding tool line
      // from "running" to done/error instead of leaving it stuck mid-flight.
      if (event.type === 'user') {
        const content = event.message?.content ?? []
        for (const block of content) {
          if (block.type === 'tool_result') {
            setMessages((m) => m.map((msg) =>
              msg.kind === 'tool' && msg.id === block.tool_use_id
                ? { ...msg, status: block.is_error ? 'error' : 'done' }
                : msg
            ))
          }
          // Ctrl+C interrupt injects this exact synthetic text block —
          // surface it so it's clear the interrupt actually took effect,
          // rather than it silently vanishing (this block isn't a
          // tool_result so the branch above never touches it).
          if (block.type === 'text' && block.text === '[Request interrupted by user]') {
            setIsThinking(false)
            setMessages((m) => [...m, { kind: 'interrupted' }])
          }
        }
      }

      if (event.type === 'result') {
        setIsThinking(false)
      }
    }

    claude.on('event', onEvent)
    return () => claude.off('event', onEvent)
  }, [claude])

  useEffect(() => {
    if (!devServer) return

    const onOutput = (line) => setOutputLines((l) => [...l, line].slice(-200))
    const onReady = () => setDevServerState({ ready: true, url: devServer.url })
    const onMismatch = ({ requested, actual }) =>
      setOutputLines((l) => [...l, {
        level: 'error',
        text: `Requested port ${requested} but server started on ${actual} instead`,
      }])

    devServer.on('output', onOutput)
    devServer.on('ready', onReady)
    devServer.on('port-mismatch', onMismatch)
    setDevServerState({ ready: devServer.ready, url: devServer.url })

    return () => {
      devServer.off('output', onOutput)
      devServer.off('ready', onReady)
      devServer.off('port-mismatch', onMismatch)
    }
  }, [devServer])

  function handleSubmit(text) {
    setMessages((m) => [...m, { role: 'user', text }])

    // The CLI refuses "/status" itself under --print (verified directly
    // against the subprocess: synthetic "not available in this environment"
    // reply) — render the local equivalent instead. sessionInfo only exists
    // once system:init has fired, which only happens after a real turn
    // reaches the subprocess. If nothing has been sent yet, still forward
    // "/status" (its synthetic reply is filtered out in the event handler
    // above) purely to trigger that first system:init, and backfill the
    // already-inserted placeholder message once it lands.
    if (text.trim() === '/status') {
      setMessages((m) => [...m, { kind: 'status', info: sessionInfo, devServer: devServerState }])
      if (!sessionInfo) claude.send(text)
      return
    }

    setIsThinking(true)
    claude.send(text)
  }

  return h(Box, { flexDirection: 'column', width: '100%', height: '100%' },
    h(StatusBar, { projectName, devServer: devServerState, claudeReady }),
    h(ConversationPane, { messages, isThinking }),
    h(OutputPane, { lines: outputLines, scrollOffset: outputScrollOffset }),
    h(InputBar, { onSubmit: handleSubmit, commands: slashCommands }),
  )
}
