import{a as r}from"./runtime-QFURDKA2.js";import{a,b as i,c as l,d as u,e,g as o,h as t,i as d}from"./runtime-L2HNXIHW.js";import{a as s,b as h}from"./runtime-B73WLANC.js";var{prev:p,next:m}=a("/config"),n={route:"/config",meta:{title:"Configuration \u2014 Pulse Docs",description:"Full reference for pulse.config.js \u2014 port, Lighthouse thresholds, load test config, environments, and per-route overrides.",styles:["/docs.css"]},state:{},view:()=>i({currentHref:"/config",prev:p,next:m,content:`
      ${l("Configuration")}
      ${u(`<code>pulse.config.js</code> sets the performance and load thresholds that Pulse enforces across your application. All fields are optional \u2014 the defaults match Google's Core Web Vitals "good" band. Configuration here is not about enabling features; it is about deciding where, if anywhere, you need to lower a guaranteed baseline.`)}

      ${e("schema","Full schema")}
      ${o(r(`// pulse.config.js
export default {
  port: 3000,

  lighthouse: {
    // Category scores \u2014 0 to 100. Default: 100 for all four.
    performance:   100,
    accessibility: 100,
    bestPractices: 100,
    seo:           100,

    // Core Web Vitals and timing metrics.
    // Defaults are the Google "good" thresholds.
    lcp: 2500,   // Largest Contentful Paint (ms)
    cls: 0.1,    // Cumulative Layout Shift
    tbt: 200,    // Total Blocking Time (ms)
    fcp: 1800,   // First Contentful Paint (ms)
    si:  3400,   // Speed Index (ms)
    inp: 200,    // Interaction to Next Paint (ms)
  },

  load: {
    duration:    10,
    connections: 10,
    thresholds: {
      rps:    undefined,  // minimum req/s (optional)
      p99:    undefined,  // maximum p99 latency ms (optional)
      errors: 0,
    },
  },

  environments: {
    // Environment names are bespoke \u2014 choose whatever suits your project.
    local:   { url: 'http://localhost:3000', default: true },
    staging: {
      url:     'https://staging.myapp.com',
      headers: { Authorization: \`Bearer \${process.env.STAGING_TOKEN}\` },
      load:       { duration: 30, connections: 50 },
      lighthouse: { performance: 90 },
    },
    production: { url: 'https://myapp.com' },
  },

  routes: {
    // Per-route overrides \u2014 merged on top of global lighthouse/load config.
    // Only specify what differs from the global defaults.
    '/dashboard': {
      lighthouse: {
        performance: 85,
        lcp:         4000,
      },
    },
    '/embed': {
      lighthouse: {
        bestPractices: 85,
      },
    },
  },
}`,"js"))}

      ${e("port","port")}
      ${t(["Field","Type","Default","Description"],[["<code>port</code>","<code>number</code>","<code>3000</code>","Port the dev and production servers listen on."]])}

      ${e("lighthouse","lighthouse")}
      <p>Global Lighthouse thresholds that every page must meet. <code>/pulse-report</code> enforces these after every audit \u2014 any page that falls below a threshold is reported as a failure, not a warning.</p>
      ${t(["Field","Type","Default","Description"],[["<code>performance</code>","<code>number</code>","<code>100</code>","Lighthouse Performance category score (0\u2013100)."],["<code>accessibility</code>","<code>number</code>","<code>100</code>","Lighthouse Accessibility category score (0\u2013100)."],["<code>bestPractices</code>","<code>number</code>","<code>100</code>","Lighthouse Best Practices category score (0\u2013100)."],["<code>seo</code>","<code>number</code>","<code>100</code>","Lighthouse SEO category score (0\u2013100)."],["<code>lcp</code>","<code>number</code>","<code>2500</code>","Largest Contentful Paint budget (ms)."],["<code>cls</code>","<code>number</code>","<code>0.1</code>","Cumulative Layout Shift budget."],["<code>tbt</code>","<code>number</code>","<code>200</code>","Total Blocking Time budget (ms)."],["<code>fcp</code>","<code>number</code>","<code>1800</code>","First Contentful Paint budget (ms)."],["<code>si</code>","<code>number</code>","<code>3400</code>","Speed Index budget (ms)."],["<code>inp</code>","<code>number</code>","<code>200</code>","Interaction to Next Paint budget (ms)."]])}
      ${d("note","Unset fields default to the values above. Setting a field to <code>null</code> removes that check for the project \u2014 use sparingly. Raising a threshold is always preferable to disabling it.")}

      ${e("routes","routes")}
      <p>Route-specific overrides let you lower a threshold for a specific page without relaxing the global guarantee. Only specify the fields that differ \u2014 everything else inherits from the global config.</p>
      ${o(r(`routes: {
  // This route uses a third-party chart library \u2014 relax performance only.
  '/dashboard': {
    lighthouse: {
      performance: 85,
      lcp:         4000,
    },
  },
}`,"js"))}
      ${d("note","Route keys must exactly match the spec <code>route</code> field, including any leading slash. Dynamic segments are not supported \u2014 create a specific override for each route pattern.")}

      ${e("load","load")}
      <p>Load test thresholds enforced by <code>/pulse-load</code>. All fields are optional \u2014 omitting a threshold means that check is not enforced.</p>
      ${t(["Field","Type","Default","Description"],[["<code>duration</code>","<code>number</code>","<code>10</code>","Test duration in seconds."],["<code>connections</code>","<code>number</code>","<code>10</code>","Number of concurrent request chains."],["<code>thresholds.rps</code>","<code>number</code>","<code>undefined</code>","Minimum acceptable requests per second. Unset = no check."],["<code>thresholds.p99</code>","<code>number</code>","<code>undefined</code>","Maximum acceptable p99 latency (ms). Unset = no check."],["<code>thresholds.errors</code>","<code>number</code>","<code>0</code>","Maximum acceptable error count."]])}
      ${o(r(`load: {
  duration:    30,
  connections: 20,
  thresholds: {
    rps:    100,   // fail if below 100 req/s
    p99:    500,   // fail if p99 exceeds 500ms
    errors: 0,
  },
},`,"js"))}
      <p>Per-route overrides follow the same pattern as <code>lighthouse</code>:</p>
      ${o(r(`routes: {
  '/feed': {
    load: { connections: 5, thresholds: { rps: 20 } },
  },
}`,"js"))}
      <p>Results are saved to <code>.pulse/load-reports/</code> and displayed in the Load Tests tab of the report dashboard, alongside the Lighthouse Performance tab for the same route.</p>

      ${e("environments","environments")}
      <p>Named environments let you enforce thresholds against different targets \u2014 local, staging, production \u2014 from the same config. Thresholds are applied per-environment, so staging and production can have different performance floors.</p>
      ${t(["Field","Type","Description"],[["<code>url</code>","<code>string</code>","Base URL to test against. If it contains <code>localhost</code> or <code>127.0.0.1</code>, a local production build is spun up automatically. Remote URLs are tested directly."],["<code>default</code>","<code>boolean</code>","The environment used when none is explicitly specified by <code>pulse report</code> and <code>pulse load-test</code>."],["<code>headers</code>","<code>object</code>","HTTP headers sent with every request to this environment. Useful for authorization tokens on protected staging deployments \u2014 read values from <code>process.env</code> rather than hardcoding them."],["<code>load</code>","<code>object</code>","Load test config overrides for this environment. Same fields as the global <code>load</code> block. Merged on top of global config."],["<code>lighthouse</code>","<code>object</code>","Lighthouse threshold overrides for this environment. Same fields as the global <code>lighthouse</code> block. Merged on top of global config."]])}
      ${d("note","Environment names are fully bespoke \u2014 <code>local</code>, <code>staging</code>, <code>production</code>, <code>preview</code>, <code>eu</code> \u2014 whatever maps to your project's infrastructure. There are no reserved names.")}
      <p>Threshold merge order: <strong>global config \u2192 environment override \u2192 per-route override</strong>.</p>
      ${o(r(`environments: {
  local:   { url: 'http://localhost:3000', default: true },
  staging: {
    url:     'https://staging.myapp.com',
    headers: { Authorization: \`Bearer \${process.env.STAGING_TOKEN}\` },
    load:       { duration: 30, connections: 50, thresholds: { rps: 500 } },
    lighthouse: { performance: 90 },
  },
  production: { url: 'https://myapp.com' },
}`,"js"))}

      ${e("defaults","CWV default thresholds")}
      <p>The default metric thresholds match the Google "good" band from the Core Web Vitals specification:</p>
      ${t(["Metric","Default",'Google "good" threshold'],[["LCP","<code>2500 ms</code>","\u2264 2500 ms"],["CLS","<code>0.1</code>","\u2264 0.1"],["TBT","<code>200 ms</code>","\u2264 200 ms"],["FCP","<code>1800 ms</code>","\u2264 1800 ms"],["SI","<code>3400 ms</code>","\u2264 3400 ms"],["INP","<code>200 ms</code>","\u2264 200 ms"]])}
    `})};var c=document.getElementById("pulse-root");c&&!c.dataset.pulseMounted&&(c.dataset.pulseMounted="1",s(n,c,window.__PULSE_SERVER__||{},{ssr:!0}),h(c,s));var P=n;export{P as default};
