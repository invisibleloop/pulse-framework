import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/state')

export default {
  route: '/state',
  meta: {
    title: 'State — Pulse Docs',
    description: 'How client state is declared, initialised, and used in Pulse.',
    styles: ['/docs.css'],
  },
  state: {},
  view: () => renderLayout({
    currentHref: '/state',
    prev,
    next,
    content: `
      ${h1('State')}
      ${lead('Pulse enforces a strict one-way data flow. State is declared once in the spec, deep-cloned on mount, and changed only through mutations. Direct mutation is not possible — the framework prevents it by design.')}

      ${section('declaring', 'Declaring state')}
      <p>The <code>state</code> field of a spec is the initial value. Always a plain object — nested objects and arrays are supported:</p>
      ${codeBlock(highlight(`export default {
  route: '/checkout',
  state: {
    step: 1,
    customer: {
      name:  '',
      email: '',
    },
    items:    [],
    promoCode: null,
  },
  // ...
}`, 'js'))}
      ${callout('note', '<code>state: {}</code> is always included, even on pages with no interactivity. The spec schema requires it.')}

      ${section('view-receives', 'The view receives state')}
      <p>The <code>view</code> function is called with the current state as its first argument. On first render this is the initial state (or state restored from <code>localStorage</code> if <code>persist</code> is set). After mutations it is the updated state:</p>
      ${codeBlock(highlight(`view: (state) => \`
  <div>
    <p>Step \${state.step} of 3</p>
    <p>Hello, \${state.customer.name || 'guest'}</p>
    <ul>
      \${state.items.map(item => \`<li>\${item.name}</li>\`).join('')}
    </ul>
  </div>
\``, 'js'))}

      ${section('immutability', 'Immutability')}
      <p>State is never mutated directly. Mutations are pure functions that return a <em>partial</em> object to merge — the framework rejects any other pattern:</p>
      ${codeBlock(highlight(`// CORRECT — return a partial update
mutations: {
  nextStep: (state) => ({ step: state.step + 1 }),
}

// WRONG — never mutate state directly
mutations: {
  nextStep: (state) => { state.step++ },   // ✗ do not do this
}`, 'js'))}
      <p>The runtime performs a shallow merge of the returned partial into the current state. This means top-level keys are replaced, not deep-merged:</p>
      ${codeBlock(highlight(`// state = { step: 1, customer: { name: 'Alice', email: 'a@b.com' } }

mutations: {
  // Only updates step — customer is untouched
  nextStep: (state) => ({ step: state.step + 1 }),

  // Replaces the entire customer object — spread to preserve email
  setName: (state, e) => ({
    customer: { ...state.customer, name: e.target.value }
  }),
}`, 'js'))}

      ${section('deep-clone', 'Deep clone on mount')}
      <p>When the page mounts, Pulse deep-clones <code>spec.state</code>. This guarantees:</p>
      <ul>
        <li>The live state and the spec's initial state are completely independent — mutations cannot corrupt the spec.</li>
        <li>Navigating away and back resets state to the spec's initial values (unless <a href="/persist">persisted</a>).</li>
        <li>Multiple instances of the same spec on the same page each get independent state.</li>
      </ul>

      ${section('server-state', 'State vs server state')}
      <p>Pulse draws a hard boundary between <em>client state</em> (the <code>state</code> field) and <em>server state</em> (from <code>server.data()</code>). Client state lives in the browser and changes in response to mutations. Server state is resolved before render and passed to the view as its second argument — it is never exposed to the client after hydration:</p>
      ${codeBlock(highlight(`view: (state, server) => \`
  <div>
    <h1>\${server.product.name}</h1>      <!-- server state -->
    <p>Qty: \${state.quantity}</p>         <!-- client state -->
  </div>
\``, 'js'))}
      ${callout('note', 'Server state is read-only and not available on the client after hydration. Anything that needs client interactivity belongs in <code>state</code>.')}

      ${section('ssr-state', 'State during SSR')}
      <p>On the server, the view is rendered with the spec's initial state. After hydration, <code>mount()</code> is called with <code>{ ssr: true }</code>, which skips the first client-side re-render and preserves the SSR-painted HTML exactly as the server sent it. This is what enables fast LCP — the initial HTML arrives from the server and the JS binds events without touching the DOM.</p>

      ${section('persist-link', 'Persisting state')}
      <p>State keys listed in the <a href="/persist"><code>persist</code></a> field are saved to <code>localStorage</code> and restored before the view renders on the next visit.</p>
    `,
  }),
}
