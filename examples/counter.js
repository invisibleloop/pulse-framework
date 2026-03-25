/**
 * Pulse — Counter example
 *
 * Demonstrates:
 *   - State and mutations
 *   - Constraints (min/max enforced after every mutation)
 *   - data-event binding
 *   - Hydration for client interactivity
 *
 * Run: node examples/dev.server.js  →  http://localhost:3001/counter
 */

import { button, badge, card, container, section, stack, cluster, progress, segmented } from '../src/ui/index.js'
import { examplesNav } from './shared.js'

export default {
  route:   '/counter',
  hydrate: '/examples/counter.js',

  meta: {
    title:       'Counter — Pulse',
    description: 'An interactive counter built with Pulse. Demonstrates mutations, constraints, and data-event binding.',
    styles:      ['/pulse-ui.css'],
  },

  state: {
    count: 0,
    step:  1,
  },

  constraints: {
    count: { min: 0, max: 20 },
    step:  { min: 1, max: 5  },
  },

  mutations: {
    increment: (state) => ({ count: state.count + state.step }),
    decrement: (state) => ({ count: state.count - state.step }),
    reset:     ()      => ({ count: 0 }),
    setStep:   (_state, e) => ({ step: parseInt(e.target.value, 10) || 1 }),
  },

  view: (state) => {
    const atMin = state.count <= 0
    const atMax = state.count >= 20


    return `
  ${examplesNav('<span>⚡ Counter</span>', '/counter')}

  <main id="main-content">
    ${section({ eyebrow: 'Mutations & Constraints', title: 'Counter', level: 1, align: 'center',
      subtitle: 'Constraints are enforced after every mutation — the count can never go below 0 or above 20.',
      content:
      container({ size: 'sm', content: `

        ${card({ content: stack({ gap: 'lg', align: 'center', content: `

          <div class="u-flex u-items-end u-justify-center u-gap-3" aria-live="polite" aria-atomic="true">
            <span class="u-text-7xl u-font-bold u-text-accent">${state.count}</span>
            <span class="u-text-3xl u-text-muted u-mb-2">/ 20</span>
          </div>

          ${progress({ value: state.count, max: 20, label: 'Counter progress' })}

          ${cluster({ justify: 'center', gap: 'sm', content:
            button({ label: '−', variant: 'secondary', disabled: atMin, attrs: { 'data-event': 'decrement', 'aria-label': 'Decrement' } }) +
            button({ label: 'Reset', variant: 'ghost', attrs: { 'data-event': 'reset' } }) +
            button({ label: '+', variant: 'primary', disabled: atMax, attrs: { 'data-event': 'increment', 'aria-label': 'Increment' } })
          })}

          ${stack({ gap: 'xs', align: 'center', content: `
            <p class="u-text-xs u-text-muted" id="step-label">Step size</p>
            ${segmented({
              name:    'step',
              value:   String(state.step),
              event:   'change:setStep',
              options: [1, 2, 5].map(n => ({ value: n, label: String(n) })),
              size:    'md',
            })}
          ` })}

          ${cluster({ justify: 'center', gap: 'xs', content:
            badge({ label: atMin ? 'At minimum' : 'Min: 0', variant: atMin ? 'warning' : 'default' }) +
            badge({ label: atMax ? 'At maximum' : 'Max: 20', variant: atMax ? 'warning' : 'default' })
          })}

        ` }) })}

      `})
    })}
  </main>`
  },
}
