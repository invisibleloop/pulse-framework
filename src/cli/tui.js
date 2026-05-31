/**
 * Pulse CLI — Ink TUI
 *
 * Full-terminal dev dashboard. Replaces the plain logger when stdout is a TTY.
 * Uses React.createElement throughout — no JSX, no build step required.
 *
 * Layout:
 *   ┌─ header: ⚡ Pulse v0.14.0 → url  [● Agent active] ─┐
 *   │  route table (static)                               │
 *   │  ── divider ──────────────────────────────────────  │
 *   │  request log (scrolling, append-only)               │
 *   │  ── divider ──────────────────────────────────────  │
 *   └─ footer: key hints + status message ───────────────┘
 */

import { createElement as h, useState, useEffect, useRef } from 'react'
import { render, Box, Text, Static, useApp, useInput, useStdout } from 'ink'
import { bus } from './events.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATIC_EXT = /\.(js|css|map|ico|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|webp|avif|json)$/i

function isStatic(pathname) {
  return STATIC_EXT.test(pathname) || pathname.startsWith('/dist/') || pathname.startsWith('/fonts/')
}

function fmtTime(date = new Date()) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function fmtMs(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function statusColor(code) {
  if (code >= 500) return 'red'
  if (code >= 400) return 'yellow'
  if (code >= 300) return 'cyan'
  return undefined
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Header({ url, version, agentMode }) {
  return h(Box, { paddingBottom: 1 },
    h(Text, { color: 'magenta', bold: true }, '⚡ '),
    h(Text, { bold: true }, 'Pulse '),
    h(Text, { dimColor: true }, `v${version}  →  `),
    h(Text, { color: 'cyan' }, url),
    agentMode && h(Text, { color: 'cyan' }, '  ● Agent active'),
  )
}

function Divider({ width }) {
  return h(Box, { paddingBottom: 1 },
    h(Text, { dimColor: true }, '─'.repeat(width || 48))
  )
}

function RouteTable({ specs }) {
  if (!specs || specs.length === 0) return null
  const routeW = Math.max(5, ...specs.map(s => (s.route || '?').length))
  return h(Box, { flexDirection: 'column', paddingBottom: 1 },
    // header row
    h(Box, { gap: 2 },
      h(Text, { dimColor: true }, 'Route'.padEnd(routeW)),
      h(Text, { dimColor: true }, 'Method'),
      h(Text, { dimColor: true }, 'JS'),
    ),
    // data rows
    ...specs.map(s =>
      h(Box, { gap: 2, key: s.route },
        h(Text, { color: 'cyan' }, (s.route || '?').padEnd(routeW)),
        h(Text, { dimColor: true }, (s.method?.toUpperCase() || 'GET').padEnd(6)),
        s.hydrate
          ? h(Text, { color: 'green' }, '✓ hydrated')
          : h(Text, { dimColor: true }, '— static'),
      )
    )
  )
}

function RequestLine({ id, method, pathname, status, ms, timestamp }) {
  const asset = isStatic(pathname)
  const color = statusColor(status)

  const icon = status >= 500 ? '✗' : status >= 400 ? '⚠' : status >= 300 ? '›' : '·'
  const iconColor = status >= 500 ? 'red' : status >= 400 ? 'yellow' : status >= 300 ? 'cyan' : undefined

  if (asset) {
    return h(Box, { gap: 1 },
      h(Text, { dimColor: true }, timestamp),
      h(Text, { dimColor: true }, '   '),
      h(Text, { dimColor: true }, method.padEnd(4)),
      h(Text, { dimColor: true }, pathname),
      h(Text, { dimColor: true }, String(status)),
      h(Text, { dimColor: true }, fmtMs(ms)),
    )
  }

  return h(Box, { gap: 1 },
    h(Text, { dimColor: true }, timestamp),
    h(Text, { color: iconColor }, ` ${icon} `),
    h(Text, { color: method === 'POST' || method === 'PUT' || method === 'PATCH' ? 'yellow' : method === 'DELETE' ? 'red' : undefined },
      method.padEnd(4)
    ),
    h(Text, { color: color }, pathname),
    h(Text, { color: color, bold: !!color }, String(status)),
    h(Text, { dimColor: true }, fmtMs(ms)),
  )
}

function EventLine({ id, type, msg }) {
  const icon = type === 'error' ? '✗' : type === 'warn' ? '⚠' : '·'
  const color = type === 'error' ? 'red' : type === 'warn' ? 'yellow' : undefined
  return h(Box, { gap: 1 },
    h(Text, { dimColor: true }, fmtTime()),
    h(Text, { color }, ` ${icon} `),
    h(Text, { color, dimColor: !color }, msg),
  )
}

function Footer({ status, width }) {
  return h(Box, { paddingTop: 1 },
    h(Text, { dimColor: true }, '─'.repeat(width || 48)),
    h(Box, { paddingTop: 1 }, ...[
      h(Text, { dimColor: true }, '[q] quit  '),
      status && h(Text, { dimColor: true }, `  ${status}`),
    ].filter(Boolean))
  )
}

// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------

let _reqCounter = 0

function App({ url, version, specs, agentMode: initialAgentMode }) {
  const { exit }         = useApp()
  const { stdout }       = useStdout()
  const width            = stdout?.columns || 80
  const [agentMode, setAgentMode]   = useState(initialAgentMode)
  const [logItems, setLogItems]     = useState([])
  const [statusMsg, setStatusMsg]   = useState(null)

  useEffect(() => {
    const onRequest = (data) => {
      setLogItems(prev => [...prev, { ...data, _type: 'request', id: `req-${++_reqCounter}` }])
    }
    const onInfo = ({ msg }) => {
      setLogItems(prev => [...prev, { id: `info-${++_reqCounter}`, _type: 'event', type: 'info', msg }])
      setStatusMsg(msg)
    }
    const onWarn = ({ msg }) => {
      setLogItems(prev => [...prev, { id: `warn-${++_reqCounter}`, _type: 'event', type: 'warn', msg }])
    }
    const onError = ({ msg }) => {
      setLogItems(prev => [...prev, { id: `err-${++_reqCounter}`, _type: 'event', type: 'error', msg }])
    }
    const onReload = ({ label }) => {
      setLogItems(prev => [...prev, { id: `reload-${++_reqCounter}`, _type: 'event', type: 'info', msg: label || 'Specs reloaded' }])
      setStatusMsg(null)
    }
    const onAgent = ({ active }) => setAgentMode(active)

    bus.on('request', onRequest)
    bus.on('info',    onInfo)
    bus.on('warn',    onWarn)
    bus.on('error',   onError)
    bus.on('reload',  onReload)
    bus.on('agent',   onAgent)

    return () => {
      bus.off('request', onRequest)
      bus.off('info',    onInfo)
      bus.off('warn',    onWarn)
      bus.off('error',   onError)
      bus.off('reload',  onReload)
      bus.off('agent',   onAgent)
    }
  }, [])

  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit()
      process.exit(0)
    }
  })

  return h(Box, { flexDirection: 'column', padding: 1 },
    h(Header, { url, version, agentMode }),
    h(RouteTable, { specs }),
    h(Divider, { width: width - 4 }),
    // Static renders each item once — no re-render on new items
    h(Static, { items: logItems },
      item => item._type === 'request'
        ? h(RequestLine, { key: item.id, ...item })
        : h(EventLine,   { key: item.id, ...item })
    ),
    h(Footer, { status: statusMsg, width: width - 4 }),
  )
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Start the Ink TUI.
 * @param {{ url: string, version: string, specs: object[], agentMode: boolean }} opts
 */
export function startTUI(opts) {
  render(h(App, opts), { exitOnCtrlC: false })
}
