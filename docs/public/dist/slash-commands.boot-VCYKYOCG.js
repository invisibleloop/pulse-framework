import{a as s}from"./runtime-QFURDKA2.js";import{a as n,b as i,c as d,d as l,e,g as o,h as c,i as u}from"./runtime-OFZXJMSU.js";import{a,b as h}from"./runtime-B73WLANC.js";var{prev:p,next:m}=n("/slash-commands"),r={route:"/slash-commands",meta:{title:"Slash Commands \u2014 Pulse Docs",description:"The built-in slash commands available in the Pulse AI agent session.",styles:["/docs.css"]},state:{},view:()=>i({currentHref:"/slash-commands",prev:p,next:m,content:`
      ${d("Slash Commands")}
      ${l("Slash commands close the development loop inside the agent session. Building, auditing, and verifying performance happen without leaving the conversation \u2014 and every audit is checked against the thresholds you have declared in config.")}

      ${e("commands","Available commands")}
      ${c(["Command","What it does"],[["<code>/pulse-dev</code>","Starts (or restarts) the development server. The server watches for file changes and reloads automatically."],["<code>/pulse-stop</code>","Stops the running development server."],["<code>/pulse-build</code>","Runs a production build. Bundles all specs via esbuild into <code>public/dist/</code> with content-hashed filenames."],["<code>/pulse-start</code>","Starts the production server against the built output. Used to verify production behaviour before deploying."],["<code>/pulse-report</code>","Runs a Lighthouse audit against a production build and opens the performance report dashboard. Captures Performance score, web vitals, bundle sizes, and request counts."]])}

      ${e("usage","Using commands")}
      <p>Commands are typed directly into the agent chat:</p>
      ${o(s(`/pulse-dev
/pulse-report`,"bash"))}
      <p>The agent executes the relevant CLI steps and reports back with results, including whether any Lighthouse score or Core Web Vitals metric failed a configured threshold.</p>

      ${u("note","<code>/pulse-report</code> performs a full production build before auditing. This guarantees accurate scores and correct brotli-compressed bundle sizes \u2014 development builds are unminified and serve no production metrics.")}

      ${e("plain-language","Plain language prompts")}
      <p>Slash commands cover the most common operations. For everything else, describe the goal \u2014 the agent handles the implementation within Pulse's spec structure:</p>
      ${o(s(`"Create a blog index page that fetches posts from an API"
"Add email validation to the contact form"
"Build a checkout flow with a Stripe payment step"
"Add a guard to the dashboard so unauthenticated users are redirected to /login"`,"bash"))}
      <p>The agent produces spec files that conform to Pulse's structure \u2014 the framework enforces correctness, so there is no manual wiring to verify.</p>

      ${e("report-dashboard","Performance report dashboard")}
      <p>The report dashboard is available at <code>/_pulse/report</code> when the dev server is running. It shows a history of Lighthouse audits across all pages \u2014 Performance score, Core Web Vitals, bundle sizes, and request counts. Threshold failures are highlighted. Each audit is saved to <code>.pulse/reports/</code> as JSON.</p>
    `})};var t=document.getElementById("pulse-root");t&&!t.dataset.pulseMounted&&(t.dataset.pulseMounted="1",a(r,t,window.__PULSE_SERVER__||{},{ssr:!0}),h(t,a));var P=r;export{P as default};
