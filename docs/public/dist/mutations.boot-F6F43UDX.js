import{a}from"./runtime-QFURDKA2.js";import{a as i,b as c,c as u,d,e,g as t,h as l,i as o}from"./runtime-L2HNXIHW.js";import{a as s,b as m}from"./runtime-B73WLANC.js";var{prev:p,next:h}=i("/mutations"),r={route:"/mutations",meta:{title:"Mutations \u2014 Pulse Docs",description:"Synchronous state changes in Pulse \u2014 how to declare and trigger mutations.",styles:["/docs.css"]},state:{},view:()=>c({currentHref:"/mutations",prev:p,next:h,content:`
      ${u("Mutations")}
      ${d("Mutations are the only permitted way to change client state. They are synchronous pure functions \u2014 network requests, DOM manipulation, and timers are structurally excluded. After every mutation, Pulse automatically applies constraints and re-renders the view.")}

      ${e("what","What is a mutation?")}
      <p>A mutation is a function with the signature <code>(state, event) =&gt; partialState</code>. It receives the current state and the DOM event that triggered it, and returns a plain object to merge into state.</p>
      ${t(a(`mutations: {
  increment: (state) => ({ count: state.count + 1 }),
  decrement: (state) => ({ count: state.count - 1 }),
  reset:     ()      => ({ count: 0 }),
}`,"js"))}
      <p>The returned partial is shallow-merged. Only the returned keys are changed \u2014 everything else in state is preserved.</p>

      ${e("binding","Binding mutations to DOM events")}
      <p>Mutations are bound to DOM events using the <code>data-event</code> attribute in the view HTML:</p>
      ${t(a(`<button data-event="increment">+</button>         <!-- click \u2192 increment -->
<button data-event="click:decrement">-</button>   <!-- explicit click -->
<input  data-event="change:setName">              <!-- change event -->
<input  data-event="input:setQuery">              <!-- input event (every keystroke) -->`,"html"))}

      ${l(["Event type","Shorthand","Typical use"],[["<code>click</code>",'<code>data-event="mutName"</code>',"Buttons, links"],["<code>change</code>",'<code>data-event="change:mutName"</code>',"Select dropdowns, checkboxes"],["<code>input</code>",'<code>data-event="input:mutName"</code>','Search/filter fields \u2014 add <code>data-debounce="300"</code> to rate-limit']])}

      ${e("debounce","Debounce and throttle")}
      <p>Add <code>data-debounce="300"</code> alongside <code>data-event</code> to delay the mutation until typing stops. The mutation fires once, 300ms after the last keystroke \u2014 not on every character. Use this for live search and filter inputs.</p>
      ${t(a(`<input data-event="input:search" data-debounce="300">
<input data-event="input:filter" data-throttle="100">`,"html"))}
      <p><code>data-throttle="100"</code> fires at most once per 100ms \u2014 useful when you want frequent updates but need to limit the rate. Both attributes accept a value in milliseconds and apply to <code>input</code> and <code>change</code> events. No per-spec timer code needed.</p>

      ${e("event-arg","The event argument")}
      <p>The second argument to a mutation is the native DOM <code>Event</code> object, giving access to the element and its value:</p>
      ${t(a(`mutations: {
  setName:    (state, e) => ({ name: e.target.value }),
  setCountry: (state, e) => ({ country: e.target.value }),
  toggle:     (state, e) => ({ checked: e.target.checked }),
}`,"js"))}

      ${e("partial-merge","Partial state merge")}
      <p>Only the keys that need to change are returned. The runtime merges the returned object into the existing state at the top level:</p>
      ${t(a(`// state = { step: 2, name: 'Alice', email: 'a@b.com' }

mutations: {
  nextStep: (state) => ({ step: state.step + 1 }),
  // After: { step: 3, name: 'Alice', email: 'a@b.com' }
  // name and email are untouched
}`,"js"))}
      ${o("warning","The merge is <strong>shallow</strong>. When state has nested objects, returning a new version of a nested key replaces the entire sub-object \u2014 not a deep merge. Use the spread operator to preserve nested fields:")}
      ${t(a(`mutations: {
  setEmail: (state, e) => ({
    // Spread the nested object to preserve sibling keys
    user: { ...state.user, email: e.target.value }
  }),
}`,"js"))}

      ${e("no-side-effects","No side effects")}
      <p>Mutations are pure functions. Network requests, DOM manipulation, and timers belong in <a href="/actions">actions</a> \u2014 not here. The structural separation is what lets Pulse re-render predictably, apply constraints safely, and make state changes auditable.</p>

      ${e("constraints","Mutations and constraints")}
      <p>After every mutation, Pulse automatically applies any <a href="/constraints">constraints</a> declared in the spec. State bounds are never checked inside mutations \u2014 they are declared once and enforced by the framework regardless of what a mutation returns:</p>
      ${t(a(`{
  state: { count: 0 },
  constraints: { count: { min: 0, max: 10 } },
  mutations: {
    increment: (state) => ({ count: state.count + 1 }),
    // count is automatically clamped to 10 \u2014 no need to check here
  }
}`,"js"))}

      ${e("forms","Mutations and forms")}
      <p>Mirroring every keystroke into state via <code>data-event="input:..."</code> causes <code>innerHTML</code> replacement on each keypress, which destroys input focus. Pulse prevents this by keeping form inputs uncontrolled \u2014 values are captured via <code>FormData</code> in an action's <code>onStart</code>, before the view re-renders:</p>
      ${t(a(`<!-- mirroring every keystroke causes focus loss -->
<input data-event="input:setEmail">

<!-- uncontrolled: values captured at submit via FormData -->
<form data-action="submit">
  <input name="email" type="email">
  <button>Submit</button>
</form>`,"html"))}
      ${o("tip","Mutations are the right tool for binary UI state (toggles, step counters, tab selections) and controls where a re-render on each change is acceptable \u2014 such as live character counters or filtered lists. For form submission, use actions.")}
    `})};var n=document.getElementById("pulse-root");n&&!n.dataset.pulseMounted&&(n.dataset.pulseMounted="1",s(r,n,window.__PULSE_SERVER__||{},{ssr:!0}),m(n,s));var $=r;export{$ as default};
