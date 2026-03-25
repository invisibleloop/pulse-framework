import{a as t}from"./runtime-QFURDKA2.js";import{a as d,b as c,c as p,d as l,e,g as o,h as r,i as s}from"./runtime-OFZXJMSU.js";import{a as n,b as u}from"./runtime-B73WLANC.js";var{prev:m,next:h}=d("/deploy"),i={route:"/deploy",meta:{title:"Deployment \u2014 Pulse Docs",description:"Deploy a Pulse app to a VPS, Docker, Fly.io, Railway, or Render.",styles:["/docs.css"]},state:{},view:()=>c({currentHref:"/deploy",prev:m,next:h,content:`
      ${p("Deployment")}
      ${l("Pulse deploys as a single Node.js process. No adapters, no serverless wrapping, no separate static file server required. Build once, run anywhere Node 22+ runs. All guarantees \u2014 security headers, brotli compression, immutable asset caching \u2014 are active in production automatically.")}

      ${e("build","Build")}
      <p>Run the production build before deploying:</p>
      ${o(t("npm run build","bash"))}
      <p>This generates content-hashed bundles in <code>public/dist/</code> and writes <code>public/dist/manifest.json</code>. The server reads the manifest at startup to resolve hydration script paths.</p>
      ${s("warning","Without a manifest, the server falls back to serving source files directly \u2014 no compression, no content-hashed filenames, and no <code>immutable</code> cache headers. Always run <code>npm run build</code> before deploying to production.")}

      ${e("files","What to deploy")}
      ${r(["Include","Reason"],[["<code>src/</code>","Page specs \u2014 imported by the server at runtime"],["<code>public/</code>","Static assets and built bundles (<code>public/dist/</code>)"],["<code>server.js</code>","Entry point"],["<code>pulse.config.js</code>","Server config"],["<code>package.json</code> + <code>node_modules/</code>","Runtime dependencies"]])}
      ${r(["Exclude","Reason"],[["<code>.claude/</code>","AI agent config \u2014 not needed at runtime"],["<code>.pulse/</code>","Local report data \u2014 not needed at runtime"]])}

      ${e("env-vars","Environment variables")}
      ${r(["Variable","Default","Description"],[["<code>NODE_ENV</code>","<code>development</code>","Set to <code>production</code> to enable HSTS headers and production cache behaviour."],["<code>PORT</code>","Value in <code>pulse.config.js</code> (default <code>3000</code>)","Override the listening port. Most PaaS platforms set this automatically."]])}
      ${o(t("NODE_ENV=production pulse start","bash"))}

      ${e("pm2","VPS with PM2")}
      <p>PM2 keeps the process alive, restarts it on crash, and manages logs.</p>
      ${o(t(`# Install PM2 globally
npm install -g pm2

# Start the app
NODE_ENV=production pm2 start server.js --name myapp

# Persist across reboots
pm2 save
pm2 startup

# Zero-downtime reload after a deploy
pm2 reload myapp`,"bash"))}
      <p>For repeatable deployments, check an <code>ecosystem.config.cjs</code> into version control:</p>
      ${o(t(`// ecosystem.config.cjs
module.exports = {
  apps: [{
    name:   'myapp',
    script: 'server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT:     3000,
    },
  }],
}`,"js"))}
      ${o(t("pm2 start ecosystem.config.cjs --env production","bash"))}

      ${e("docker","Docker")}
      <p>A two-stage build keeps the image small \u2014 build tools stay in the first stage.</p>
      ${o(t(`# ---- build stage ----
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
CMD ["node", "server.js"]`,"bash"))}
      ${o(t(`docker build -t myapp .
docker run -p 3000:3000 --env NODE_ENV=production myapp`,"bash"))}

      ${e("fly","Fly.io")}
      ${o(t(`# fly.toml
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
  cpus     = 1`,"bash"))}
      ${o(t(`# First deploy
fly launch

# Subsequent deploys
fly deploy`,"bash"))}

      ${e("railway","Railway")}
      <p>Railway auto-detects Node apps. Add a <code>railway.json</code> to set the build and start commands:</p>
      ${o(t(`{
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
}`,"js"))}

      ${e("render","Render")}
      ${r(["Setting","Value"],[["Environment","Node"],["Build command","<code>npm install &amp;&amp; npm run build</code>"],["Start command","<code>NODE_ENV=production node server.js</code>"],["Node version","<code>22.x</code>"]])}
      <p>Set <code>NODE_ENV=production</code> in the Render environment variables dashboard.</p>

      ${e("serverless","Vercel, Cloudflare, and edge platforms")}
      <p>These platforms each have multiple products with very different runtimes \u2014 the compatibility story varies significantly between them.</p>

      ${e("vercel","Vercel")}
      <p>Vercel has two distinct runtimes:</p>
      ${r(["Product","Runtime","Pulse compatible?"],[["<strong>Functions</strong> (Node.js)","Full Node.js \u2014 same built-ins as a VPS","Partially \u2014 see below"],["<strong>Edge Functions</strong>","V8 isolates (no Node built-ins)","No"]])}
      <p><strong>Vercel Functions (Node.js)</strong> can run Pulse with some differences in behaviour:</p>
      ${r(["Feature","Behaviour on Vercel Functions"],[["<code>serverTtl</code> cache","Works within a warm instance, but cold starts reset it. Not reliable for expensive queries."],["Streaming SSR","Vercel Functions support streaming responses, but require explicit configuration via <code>supportsResponseStreaming</code>."],["Static files","Vercel serves <code>public/</code> automatically via its CDN \u2014 Pulse's static file serving is bypassed."],["Security headers","Work as normal \u2014 Pulse adds them to every response."]])}
      ${s("warning","Vercel Functions are not a tested or officially supported deployment target for Pulse. The adapter pattern (exporting a request handler rather than starting a server) is not yet documented. Railway, Render, or Fly.io are simpler choices with no adaptation required.")}

      ${e("cloudflare","Cloudflare")}
      ${r(["Product","Runtime","Pulse compatible?"],[["<strong>Workers</strong>","V8 isolates \u2014 no <code>node:http</code>, <code>node:fs</code>, <code>node:zlib</code>","No"],["<strong>Pages Functions</strong>","Same V8 isolate runtime as Workers","No"],["<strong>CDN / proxy</strong>","Sits in front of your origin server","Yes \u2014 works great with Fly.io or a VPS behind it"]])}
      ${s("tip","The recommended pattern for edge performance: deploy Pulse to <strong>Fly.io</strong> (which runs real VMs in many regions) and put <strong>Cloudflare as a CDN/proxy</strong> in front of it. Static assets and cached HTML are served from Cloudflare's edge; dynamic requests are proxied to the nearest Fly VM.")}

      ${e("https","HTTPS and reverse proxy")}
      <p>Pulse detects TLS automatically. When a request arrives with an <code>x-forwarded-proto: https</code> header or over a direct TLS socket, <code>Strict-Transport-Security: max-age=31536000; includeSubDomains</code> is added to the response. All four platforms above forward this header \u2014 no Pulse config is needed.</p>
      <p>If running behind nginx for TLS termination:</p>
      ${o(t(`# nginx \u2014 TLS termination, proxy to Pulse
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
}`,"bash"))}
      ${s("tip",`Use <a href="https://certbot.eff.org">Certbot</a> to obtain and auto-renew a free Let's Encrypt certificate: <code>certbot --nginx -d myapp.com</code>.`)}
    `})};var a=document.getElementById("pulse-root");a&&!a.dataset.pulseMounted&&(a.dataset.pulseMounted="1",n(i,a,window.__PULSE_SERVER__||{},{ssr:!0}),u(a,n));var P=i;export{P as default};
