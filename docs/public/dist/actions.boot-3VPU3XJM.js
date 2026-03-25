import{a as o}from"./runtime-QFURDKA2.js";import{a as i,b as d,c,d as l,e,g as t,h as u,i as a}from"./runtime-OFZXJMSU.js";import{a as s,b as m}from"./runtime-B73WLANC.js";var{prev:p,next:f}=i("/actions"),n={route:"/actions",meta:{title:"Actions \u2014 Pulse Docs",description:"Async operations in Pulse \u2014 lifecycle, FormData, error handling.",styles:["/docs.css"]},state:{},view:()=>d({currentHref:"/actions",prev:p,next:f,content:`
      ${c("Actions")}
      ${l("Actions handle async operations with an enforced lifecycle. The order of steps \u2014 capture inputs, validate, run, succeed or fail \u2014 is fixed. Skipping validation or running async work before showing a loading state is not possible within the action structure.")}

      ${e("lifecycle","The action lifecycle")}
      <p>When a form with <code>data-action</code> is submitted, Pulse runs the action through a fixed sequence of steps:</p>
      ${t(o(`onStart(state, formData)
  \u2193  (optional) validate \u2014 checks spec.validation rules
run(state, serverState, formData)
  \u2193  success           \u2193  error
onSuccess(state, payload)   onError(state, err)`,"bash"))}
      <p>Each step triggers a view re-render, so the UI always reflects the current state \u2014 loading, validated, succeeded, or failed. The sequence cannot be reordered.</p>

      ${e("defining","Defining an action")}
      ${t(o(`export default {
  route: '/contact',
  state: {
    status: 'idle',   // 'idle' | 'loading' | 'success' | 'error'
    errors: [],
  },
  validation: {
    'fields.name':  { required: true, minLength: 2 },
    'fields.email': { required: true, format: 'email' },
    'fields.message': { required: true, minLength: 10 },
  },
  actions: {
    submit: {
      // 1. Immediately update state \u2014 show loading indicator
      onStart: (state, formData) => ({
        status: 'loading',
        errors: [],
        // Capture form values into state before validation runs
        fields: {
          name:    formData.get('name'),
          email:   formData.get('email'),
          message: formData.get('message'),
        },
      }),

      // 2. Run spec.validation before proceeding to run()
      validate: true,

      // 3. Perform the async work
      run: async (state, serverState, formData) => {
        const res = await fetch('/api/contact', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(Object.fromEntries(formData)),
        })
        if (!res.ok) throw new Error('Request failed')
        return res.json()
      },

      // 4a. Success
      onSuccess: (state, payload) => ({
        status: 'success',
        errors: [],
      }),

      // 4b. Error \u2014 payload may have validation errors
      onError: (state, err) => ({
        status: 'error',
        errors: err?.validation ?? [{ message: err.message }],
      }),
    },
  },
}`,"js"))}

      ${e("binding","Binding actions to forms")}
      <p>A <code>data-action</code> attribute on a <code>&lt;form&gt;</code> element binds it to an action. When the form is submitted, Pulse creates a <code>FormData</code> object from the form's inputs and passes it through the action lifecycle:</p>
      ${t(o(`<form data-action="submit">
  <input name="name"    type="text"  placeholder="Your name">
  <input name="email"   type="email" placeholder="Email">
  <textarea name="message" placeholder="Message"></textarea>
  <button type="submit">Send</button>
</form>`,"html"))}
      ${a("note","Pulse intercepts and prevents the default form submission. The action lifecycle is fully in control of what happens with the data \u2014 no manual <code>event.preventDefault()</code> needed.")}

      ${e("on-start","onStart")}
      <p><code>onStart(state, formData)</code> runs synchronously as soon as the form is submitted, before any async work begins. It sets a loading state, captures form values into state so validation can check them, and clears previous errors.</p>
      ${a("warning","<code>onStart</code> runs <strong>before</strong> validation. <code>FormData</code> values are captured into state first, because the HTML re-renders (destroying the form inputs) once validation runs. All form values are captured here so validation can read them from state via dot-paths.")}

      ${e("validate","validate")}
      <p>Set <code>validate: true</code> to run the spec's <a href="/validation">validation rules</a> after <code>onStart</code>. If validation fails, <code>onError</code> is called immediately \u2014 <code>run</code> is never reached. Async work cannot execute against invalid input.</p>
      ${t(o(`// Validation error structure
{
  message:    'Validation failed',
  validation: [
    { field: 'fields.email', rule: 'format', message: 'Must be a valid email' },
    { field: 'fields.name',  rule: 'required', message: 'Required' },
  ]
}`,"js"))}
      <p>Access the errors in <code>onError</code>:</p>
      ${t(o(`onError: (state, err) => ({
  status: 'error',
  errors: err?.validation ?? [{ message: err.message }],
})`,"js"))}

      ${e("run","run")}
      <p><code>run(state, serverState, formData)</code> is where the async work happens. Throw or reject to trigger <code>onError</code>. The return value is passed to <code>onSuccess</code> as <code>payload</code>.</p>
      ${t(o(`run: async (state, serverState, formData) => {
  const res = await fetch('/api/submit', {
    method: 'POST',
    body:   formData,
  })
  if (!res.ok) {
    const err = await res.json()
    throw Object.assign(new Error('Server error'), err)
  }
  return res.json()   // \u2192 onSuccess payload
},`,"js"))}

      ${e("on-success","onSuccess")}
      <p><code>onSuccess(state, payload)</code> receives the current state and whatever <code>run</code> returned. Return a partial state update:</p>
      ${t(o(`onSuccess: (state, payload) => ({
  status: 'success',
  userId: payload.id,
})`,"js"))}

      ${e("on-error","onError")}
      <p><code>onError(state, err)</code> receives the current state and the thrown error. Return a partial state update to surface the error in the view:</p>
      ${t(o(`onError: (state, err) => ({
  status: 'error',
  errors: err?.validation ?? [{ message: err.message }],
})`,"js"))}

      ${e("toast","Toast notifications")}
      <p>Return <code>_toast</code> from any action hook to show a notification. It is stripped from spec state automatically \u2014 it never appears in <code>getState()</code> or the view.</p>
      ${t(o(`onSuccess: (state, payload) => ({
  status:  'success',
  _toast:  { message: 'Saved successfully', variant: 'success' },
}),

onError: (state, err) => ({
  status:  'error',
  errors:  err?.validation ?? [{ message: err.message }],
  _toast:  { message: 'Something went wrong', variant: 'error' },
}),`,"js"))}
      <p><code>_toast</code> works in <code>onStart</code>, <code>onSuccess</code>, and <code>onError</code>, and also in mutations. The toast container is injected into <code>document.body</code> once and survives client-side navigations.</p>
      ${u(["Option","Type","Default",""],[["<code>message</code>","string","\u2014","Required. The notification text."],["<code>variant</code>","<code>success | error | warning | info</code>","<code>info</code>",""],["<code>duration</code>","number (ms)","<code>4000</code>","Auto-dismiss delay. <code>0</code> = sticky until dismissed."]])}

      ${e("store-update","Pushing to the global store")}
      <p>Return <code>_storeUpdate</code> from <code>onSuccess</code> to push a partial update into the <a href="/store">global store</a>. Every mounted page that subscribes to the updated keys re-renders immediately \u2014 no navigation, no polling.</p>
      ${t(o(`onSuccess: (state, theme) => ({
  saved:        true,
  _storeUpdate: { settings: { theme } },   // \u2190 merged into global store state
}),`,"js"))}
      <p><code>_storeUpdate</code> is stripped from the page's own state \u2014 only the rest of the return object is merged into local state as usual. See <a href="/store">Global Store</a> for the full store API.</p>

      ${e("rendering-errors","Rendering errors in the view")}
      ${t(o(`view: (state) => \`
  <form data-action="submit">
    \${state.errors.map(e => \`
      <p class="error">
        \${e.field ? \`<strong>\${e.field}:</strong> \` : ''}\${e.message}
      </p>
    \`).join('')}
    <!-- ... form fields ... -->
    <button \${state.status === 'loading' ? 'disabled' : ''}>
      \${state.status === 'loading' ? 'Sending\u2026' : 'Send'}
    </button>
  </form>
\``,"js"))}
    `})};var r=document.getElementById("pulse-root");r&&!r.dataset.pulseMounted&&(r.dataset.pulseMounted="1",s(n,r,window.__PULSE_SERVER__||{},{ssr:!0}),m(r,s));var $=n;export{$ as default};
