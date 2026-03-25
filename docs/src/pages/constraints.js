import { renderLayout, h1, lead, section, sub, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/constraints')

export default {
  route: '/constraints',
  meta: {
    title: 'Constraints — Pulse Docs',
    description: 'Automatic min/max bounds on state values, enforced after every mutation.',
    styles: ['/docs.css'],
  },
  state: {},
  view: () => renderLayout({
    currentHref: '/constraints',
    prev,
    next,
    content: `
      ${h1('Constraints')}
      ${lead('Constraints are always-on bounds for numeric state values. After every mutation, Pulse clamps constrained values to their declared range before the view re-renders. The value can never go out of range — there is no code path where it can.')}

      ${section('declaring', 'Declaring constraints')}
      <p>The <code>constraints</code> field maps top-level state keys to bounds objects with optional <code>min</code> and <code>max</code> properties:</p>
      ${codeBlock(highlight(`export default {
  route: '/cart',
  state: {
    quantity: 1,
    zoom:     1.0,
    rating:   0,
  },
  constraints: {
    quantity: { min: 1,   max: 99  },
    zoom:     { min: 0.5, max: 3.0 },
    rating:   { min: 0,   max: 5   },
  },
  mutations: {
    increaseQty: (state) => ({ quantity: state.quantity + 1 }),
    decreaseQty: (state) => ({ quantity: state.quantity - 1 }),
    zoomIn:      (state) => ({ zoom: state.zoom + 0.1 }),
    zoomOut:     (state) => ({ zoom: state.zoom - 0.1 }),
  },
}`, 'js'))}
      <p>When <code>decreaseQty</code> runs and <code>quantity</code> is already 1, the constraint clamps it back to 1 before the view renders. The mutation does not need to check bounds — the spec declares them once and Pulse enforces them everywhere.</p>

      ${section('vs-validation', 'Constraints vs Validation')}
      ${table(
        ['', 'Constraints', 'Validation'],
        [
          ['When it runs', 'After <strong>every</strong> mutation, automatically', 'Only when an action has <code>validate: true</code>'],
          ['What it does', 'Clamps numeric values silently', 'Rejects the action and surfaces errors'],
          ['User feedback', 'None — state is silently corrected', 'Explicit error messages shown in the view'],
          ['Best for', 'Numeric ranges that must never be exceeded', 'Form field correctness before submission'],
        ]
      )}

      ${callout('note', 'Constraints and validation serve different purposes. Constraints silently enforce numeric bounds at every mutation — they cannot be bypassed. Validation rejects invalid form data before an action\'s async work begins — it only runs when explicitly declared.')}

      ${section('one-sided', 'One-sided bounds')}
      <p>Either <code>min</code> or <code>max</code> can be declared alone — both are optional:</p>
      ${codeBlock(highlight(`constraints: {
  count:    { min: 0 },          // no upper limit
  discount: { max: 100 },        // no lower limit
  offset:   { min: 0, max: 999 } // both bounds
}`, 'js'))}

      ${section('how-it-works', 'How clamping works')}
      <p>After Pulse applies a mutation's partial state update, it iterates over all declared constraints and applies <code>Math.max(min, Math.min(max, value))</code> to each constrained key. The view is then called with the clamped state.</p>
      ${codeBlock(highlight(`// state.count = 10, constraints.count = { min: 0, max: 10 }
mutations: {
  increment: (state) => ({ count: state.count + 1 }),
  // mutation returns { count: 11 }
  // constraint clamps to 10
  // view receives { count: 10 }
}`, 'js'))}

      ${section('top-level', 'Top-level keys only')}
      <p>Constraints apply to top-level state keys. To constrain nested values, consider flattening your state structure or applying bounds logic in the mutation itself:</p>
      ${codeBlock(highlight(`// Cannot do:
constraints: {
  'player.health': { min: 0, max: 100 }   // ✗ nested paths not supported
}

// Do instead:
state: { playerHealth: 100 },
constraints: { playerHealth: { min: 0, max: 100 } },

// Or handle in the mutation:
mutations: {
  takeDamage: (state, _, amount) => ({
    player: {
      ...state.player,
      health: Math.max(0, state.player.health - amount),
    }
  })
}`, 'js'))}
    `,
  }),
}
