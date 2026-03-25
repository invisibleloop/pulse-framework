import { renderLayout, h1, lead, section, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/extending')

export default {
  route: '/extending',
  meta: {
    title: 'Extending Pulse — Pulse Docs',
    description: 'Escape hatches for features outside the Pulse spec — onRequest middleware, raw server access, WebSockets, SSE, and custom error handling.',
    styles: ['/docs.css'],
  },
  state: {},
  view: () => renderLayout({
    currentHref: '/extending',
    prev,
    next,
    content: `
      ${h1('Extending Pulse')}
      ${lead('Pulse handles the standard request-response lifecycle through specs. For requirements outside that model — middleware, WebSockets, SSE, custom error pages — Pulse exposes deliberate integration points directly on the underlying Node.js server. There is no abstraction layer to fight through.')}

      ${section('onrequest', 'Request interception with onRequest')}
      <p><code>onRequest</code> is a hook on <code>createServer</code> that fires on every incoming request before Pulse handles it. Return <code>false</code> to short-circuit Pulse entirely and handle the response yourself.</p>
      ${codeBlock(highlight(`// server.js
import { createServer } from '@invisibleloop/pulse'
import home from './src/pages/home.js'

createServer([home], {
  port: 3000,
  onRequest(req, res) {
    // Logging
    console.log(req.method, req.url)

    // Block a path entirely
    if (req.url === '/internal') {
      res.writeHead(403)
      res.end('Forbidden')
      return false  // stops Pulse processing this request
    }

    // Custom header on every response
    res.setHeader('X-App-Version', '1.0.0')
    // returning nothing (or undefined) lets Pulse continue normally
  },
})`, 'js'))}
      ${callout('note', '<code>onRequest</code> runs before routing, guard, and all server fetchers. Returning <code>false</code> gives full control of the response — Pulse steps aside entirely for that request.')}
      <p>Common uses:</p>
      ${table(
        ['Use case', 'Approach'],
        [
          ['Request logging',         'Log <code>req.method</code>, <code>req.url</code>, timing'],
          ['IP allowlisting',         'Check <code>req.socket.remoteAddress</code>, return <code>false</code> with 403 if blocked'],
          ['Rate limiting',           'Track request counts in a <code>Map</code>, return <code>false</code> with 429 when exceeded'],
          ['Custom response headers', 'Call <code>res.setHeader()</code> before returning'],
          ['Health check endpoint',   'Match <code>/healthz</code>, write <code>200 ok</code>, return <code>false</code>'],
        ]
      )}

      ${section('raw-server', 'Accessing the raw server')}
      <p><code>createServer</code> returns a <code>{ server }</code> object where <code>server</code> is a plain Node.js <code>http.Server</code>. You can attach any listener to it directly.</p>
      ${codeBlock(highlight(`const { server } = createServer([home], { port: 3000 })

// The server instance is available immediately after createServer() returns.
// It starts listening automatically — no need to call server.listen().
server.on('listening', () => {
  console.log('ready')
})`, 'js'))}

      ${section('websockets', 'WebSockets')}
      <p>Use the <code>upgrade</code> event on the server instance. The <code>ws</code> package handles the WebSocket handshake and framing.</p>
      ${codeBlock(highlight(`npm install ws`, 'bash'))}
      ${codeBlock(highlight(`// server.js
import { WebSocketServer } from 'ws'
import { createServer } from '@invisibleloop/pulse'
import home from './src/pages/home.js'

const { server } = createServer([home], { port: 3000 })

const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  } else {
    socket.destroy()
  }
})

wss.on('connection', (ws) => {
  ws.send('connected')
  ws.on('message', (msg) => ws.send(\`echo: \${msg}\`))
})`, 'js'))}
      <p>The Pulse-rendered page can connect to the WebSocket using an inline script. Pass <code>ctx.nonce</code> through a server fetcher so the script is allowed by the CSP:</p>
      ${codeBlock(highlight(`server: {
  meta: async (ctx) => ({ nonce: ctx.nonce }),
},

view: (_state, server) => \`
  <main id="main-content">
    <p id="status">Connecting…</p>
    <script nonce="\${server.meta.nonce}">
      const ws = new WebSocket('ws://' + location.host + '/ws')
      ws.onmessage = (e) => {
        document.getElementById('status').textContent = e.data
      }
    </script>
  </main>
\`,`, 'js'))}

      ${section('sse', 'Server-Sent Events')}
      <p>SSE keeps an HTTP connection open and streams events to the browser. Use <code>onRequest</code> to intercept the SSE path and write to the response directly.</p>
      ${codeBlock(highlight(`onRequest(req, res) {
  if (req.url !== '/events') return  // let Pulse handle everything else

  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
  })

  // Send a keepalive comment every 15 seconds
  const keepalive = setInterval(() => res.write(': keepalive\\n\\n'), 15000)

  // Send an event
  function send(event, data) {
    res.write(\`event: \${event}\\ndata: \${JSON.stringify(data)}\\n\\n\`)
  }

  send('connected', { time: Date.now() })

  req.on('close', () => clearInterval(keepalive))

  return false
},`, 'js'))}

      ${section('error', 'Custom error handling')}
      <p><code>onError</code> in <code>createServer</code> receives unhandled errors from server fetchers and guard functions. Use it to log errors to an external service or render a custom error page.</p>
      ${codeBlock(highlight(`createServer([home], {
  port: 3000,

  onError(err, req, res) {
    // Log to your error tracking service
    console.error(err)

    // Respond with a custom error page
    res.writeHead(500, { 'Content-Type': 'text/html' })
    res.end(\`
      <!doctype html>
      <html lang="en">
        <head><title>Error</title></head>
        <body>
          <main id="main-content">
            <h1>Something went wrong</h1>
            <p>We've been notified and are looking into it.</p>
          </main>
        </body>
      </html>
    \`)
  },
})`, 'js'))}

      ${section('client-js', 'Custom client-side JavaScript')}
      <p>Pulse has no client-side JS of its own beyond the hydration runtime. For behaviour that genuinely needs to run in the browser — third-party widgets, analytics, canvas — use an inline script in the view with the request nonce. The nonce is unique per request and is required for the script to pass the CSP.</p>
      ${codeBlock(highlight(`server: {
  meta: async (ctx) => ({ nonce: ctx.nonce }),
},

view: (_state, server) => \`
  <main id="main-content">
    <canvas id="chart" width="600" height="300"></canvas>
    <script nonce="\${server.meta.nonce}">
      const ctx = document.getElementById('chart').getContext('2d')
      // draw directly with Canvas API — no library needed for simple charts
      ctx.fillStyle = '#9b8dff'
      ctx.fillRect(10, 10, 100, 80)
    </script>
  </main>
\`,`, 'js'))}
      ${callout('note', 'External scripts loaded via <code>src</code> also need the nonce attribute, or their domain must be added to the <code>script-src</code> directive in the CSP. The nonce approach is simpler and does not require config changes.')}

      ${section('when', 'Choosing the right approach')}
      ${table(
        ['What you need', 'Reach for'],
        [
          ['Middleware — logging, rate limiting, custom headers', '<code>onRequest</code>'],
          ['Non-HTML responses — JSON APIs, webhooks, RSS, sitemaps', 'Raw response spec (<code>contentType</code> + <code>render</code>)'],
          ['Real-time bidirectional communication', 'WebSockets via <code>server.on(\'upgrade\')</code>'],
          ['Server-pushed updates (read-only stream)', 'SSE via <code>onRequest</code>'],
          ['Custom error pages', '<code>onError</code>'],
          ['Browser-only behaviour', 'Inline <code>&lt;script nonce&gt;</code> in the view'],
        ]
      )}
    `,
  }),
}
