import { renderLayout, h1, lead, section, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/deploy')

export default {
  route: '/deploy',
  meta: {
    title: 'Deployment — Pulse Docs',
    description: 'Deploy a Pulse app to a VPS, Docker, Fly.io, Railway, or Render.',
    styles: ['/docs.css'],
  },
  state: {},
  view: () => renderLayout({
    currentHref: '/deploy',
    prev,
    next,
    content: `
      ${h1('Deployment')}
      ${lead('Pulse deploys as a single Node.js process. No adapters, no serverless wrapping, no separate static file server required. Build once, run anywhere Node 22+ runs. All guarantees — security headers, brotli compression, immutable asset caching — are active in production automatically.')}

      ${section('build', 'Build')}
      <p>Run the production build before deploying:</p>
      ${codeBlock(highlight(`npm run build`, 'bash'))}
      <p>This generates content-hashed bundles in <code>public/dist/</code> and writes <code>public/dist/manifest.json</code>. The server reads the manifest at startup to resolve hydration script paths.</p>
      ${callout('warning', 'Without a manifest, the server falls back to serving source files directly — no compression, no content-hashed filenames, and no <code>immutable</code> cache headers. Always run <code>npm run build</code> before deploying to production.')}

      ${section('files', 'What to deploy')}
      ${table(
        ['Include', 'Reason'],
        [
          ['<code>src/</code>',                            'Page specs — imported by the server at runtime'],
          ['<code>public/</code>',                         'Static assets and built bundles (<code>public/dist/</code>)'],
          ['<code>server.js</code>',                       'Entry point'],
          ['<code>pulse.config.js</code>',                 'Server config'],
          ['<code>package.json</code> + <code>node_modules/</code>', 'Runtime dependencies'],
        ]
      )}
      ${table(
        ['Exclude', 'Reason'],
        [
          ['<code>.claude/</code>',  'AI agent config — not needed at runtime'],
          ['<code>.pulse/</code>',   'Local report data — not needed at runtime'],
        ]
      )}

      ${section('env-vars', 'Environment variables')}
      ${table(
        ['Variable', 'Default', 'Description'],
        [
          ['<code>NODE_ENV</code>', '<code>development</code>', 'Set to <code>production</code> to enable HSTS headers and production cache behaviour.'],
          ['<code>PORT</code>',     'Value in <code>pulse.config.js</code> (default <code>3000</code>)', 'Override the listening port. Most PaaS platforms set this automatically.'],
        ]
      )}
      ${codeBlock(highlight(`NODE_ENV=production pulse start`, 'bash'))}

      ${section('pm2', 'VPS with PM2')}
      <p>PM2 keeps the process alive, restarts it on crash, and manages logs.</p>
      ${codeBlock(highlight(`# Install PM2 globally
npm install -g pm2

# Start the app
NODE_ENV=production pm2 start server.js --name myapp

# Persist across reboots
pm2 save
pm2 startup

# Zero-downtime reload after a deploy
pm2 reload myapp`, 'bash'))}
      <p>For repeatable deployments, check an <code>ecosystem.config.cjs</code> into version control:</p>
      ${codeBlock(highlight(`// ecosystem.config.cjs
module.exports = {
  apps: [{
    name:   'myapp',
    script: 'server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT:     3000,
    },
  }],
}`, 'js'))}
      ${codeBlock(highlight(`pm2 start ecosystem.config.cjs --env production`, 'bash'))}

      ${section('docker', 'Docker')}
      <p>A two-stage build keeps the image small — build tools stay in the first stage.</p>
      ${codeBlock(highlight(`# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx pulse build

# ---- runtime stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/src         ./src
COPY --from=build /app/public      ./public
COPY --from=build /app/server.js   ./server.js
COPY pulse.config.js ./
EXPOSE 3000
CMD ["node", "server.js"]`, 'bash'))}
      ${codeBlock(highlight(`docker build -t myapp .
docker run -p 3000:3000 --env NODE_ENV=production myapp`, 'bash'))}

      ${section('fly', 'Fly.io')}
      ${codeBlock(highlight(`# fly.toml
app            = 'myapp'
primary_region = 'lhr'

[env]
  NODE_ENV = 'production'

[build]
  [build.args]
    NODE_VERSION = '22'

[deploy]
  release_command = 'npx pulse build'

[http_service]
  internal_port       = 3000
  force_https         = true
  auto_stop_machines  = 'stop'
  auto_start_machines = true

[[vm]]
  memory   = '256mb'
  cpu_kind = 'shared'
  cpus     = 1`, 'bash'))}
      ${codeBlock(highlight(`# First deploy
fly launch

# Subsequent deploys
fly deploy`, 'bash'))}

      ${section('railway', 'Railway')}
      <p>Railway auto-detects Node apps. Add a <code>railway.json</code> to set the build and start commands:</p>
      ${codeBlock(highlight(`{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "NODE_ENV=production node server.js",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE"
  }
}`, 'js'))}

      ${section('render', 'Render')}
      ${table(
        ['Setting', 'Value'],
        [
          ['Environment',   'Node'],
          ['Build command', '<code>npm install &amp;&amp; npm run build</code>'],
          ['Start command', '<code>NODE_ENV=production node server.js</code>'],
          ['Node version',  '<code>22.x</code>'],
        ]
      )}
      <p>Set <code>NODE_ENV=production</code> in the Render environment variables dashboard.</p>

      ${section('serverless', 'Vercel, Cloudflare, and edge platforms')}
      <p>These platforms each have multiple products with very different runtimes — the compatibility story varies significantly between them.</p>

      ${section('vercel', 'Vercel')}
      <p>Vercel has two distinct runtimes:</p>
      ${table(
        ['Product', 'Runtime', 'Pulse compatible?'],
        [
          ['<strong>Functions</strong> (Node.js)', 'Full Node.js — same built-ins as a VPS', 'Partially — see below'],
          ['<strong>Edge Functions</strong>', 'V8 isolates (no Node built-ins)', 'No'],
        ]
      )}
      <p><strong>Vercel Functions (Node.js)</strong> can run Pulse with some differences in behaviour:</p>
      ${table(
        ['Feature', 'Behaviour on Vercel Functions'],
        [
          ['<code>serverTtl</code> cache', 'Works within a warm instance, but cold starts reset it. Not reliable for expensive queries.'],
          ['Streaming SSR', 'Vercel Functions support streaming responses, but require explicit configuration via <code>supportsResponseStreaming</code>.'],
          ['Static files', 'Vercel serves <code>public/</code> automatically via its CDN — Pulse\'s static file serving is bypassed.'],
          ['Security headers', 'Work as normal — Pulse adds them to every response.'],
        ]
      )}
      ${callout('warning', 'Vercel Functions are not a tested or officially supported deployment target for Pulse. The adapter pattern (exporting a request handler rather than starting a server) is not yet documented. Railway, Render, or Fly.io are simpler choices with no adaptation required.')}

      ${section('cloudflare', 'Cloudflare')}
      ${table(
        ['Product', 'Runtime', 'Pulse compatible?'],
        [
          ['<strong>Workers</strong>', 'V8 isolates — no <code>node:http</code>, <code>node:fs</code>, <code>node:zlib</code>', 'No'],
          ['<strong>Pages Functions</strong>', 'Same V8 isolate runtime as Workers', 'No'],
          ['<strong>CDN / proxy</strong>', 'Sits in front of your origin server', 'Yes — works great with Fly.io or a VPS behind it'],
        ]
      )}
      ${callout('tip', 'The recommended pattern for edge performance: deploy Pulse to <strong>Fly.io</strong> (which runs real VMs in many regions) and put <strong>Cloudflare as a CDN/proxy</strong> in front of it. Static assets and cached HTML are served from Cloudflare\'s edge; dynamic requests are proxied to the nearest Fly VM.')}

      ${section('https', 'HTTPS and reverse proxy')}
      <p>Pulse detects TLS automatically. When a request arrives with an <code>x-forwarded-proto: https</code> header or over a direct TLS socket, <code>Strict-Transport-Security: max-age=31536000; includeSubDomains</code> is added to the response. All four platforms above forward this header — no Pulse config is needed.</p>
      <p>If running behind nginx for TLS termination:</p>
      ${codeBlock(highlight(`# nginx — TLS termination, proxy to Pulse
server {
  listen 443 ssl;
  server_name myapp.com;

  ssl_certificate     /etc/letsencrypt/live/myapp.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/myapp.com/privkey.pem;

  location / {
    proxy_pass         http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
  }
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name myapp.com;
  return 301 https://$host$request_uri;
}`, 'bash'))}
      ${callout('tip', 'Use <a href="https://certbot.eff.org">Certbot</a> to obtain and auto-renew a free Let\'s Encrypt certificate: <code>certbot --nginx -d myapp.com</code>.')}
    `,
  }),
}
