/**
 * Pulse — Todo list example
 *
 * Demonstrates:
 *   - Client-side CRUD mutations
 *   - persist (survives page reload)
 *   - Constraints (max 20 items)
 *   - Filter state (all / active / done)
 *   - Empty state handling
 *
 * Run: node examples/dev.server.js  →  http://localhost:3001/todos
 */

import { button, card, checkbox, empty, input, section, container, stack, cluster } from '../src/ui/index.js'
import { examplesNav } from './shared.js'

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function filterTodos(todos, filter) {
  if (filter === 'active') return todos.filter(t => !t.done)
  if (filter === 'done')   return todos.filter(t => t.done)
  return todos
}

export function countByStatus(todos) {
  const active = todos.filter(t => !t.done).length
  return { active, done: todos.length - active, total: todos.length }
}

export default {
  route:   '/todos',

  meta: {
    title:       'Todos — Pulse',
    description: 'A todo list built with Pulse. Demonstrates client mutations, persist, constraints, and filter state.',
    styles:      ['/pulse-ui.css'],
  },

  state: {
    todos:  [],      // [{ id, text, done }]
    filter: 'all',   // all | active | done
    nextId: 1,
  },

  persist: ['todos', 'nextId'],

  constraints: {
    nextId: { min: 1 },
  },

  mutations: {
    add: (state, formData) => {
      const text = formData.get('text')?.trim()
      if (!text || state.todos.length >= 20) return state
      return {
        todos:  [...state.todos, { id: state.nextId, text, done: false }],
        nextId: state.nextId + 1,
      }
    },

    toggle: (state, e) => {
      const id = parseInt(e.target.closest('[data-id]')?.dataset.id, 10)
      return {
        todos: state.todos.map(t => t.id === id ? { ...t, done: !t.done } : t),
      }
    },

    remove: (state, e) => {
      const id = parseInt(e.target.closest('[data-id]')?.dataset.id, 10)
      return { todos: state.todos.filter(t => t.id !== id) }
    },

    clearDone: (state) => ({
      todos: state.todos.filter(t => !t.done),
    }),

    setFilter: (_state, e) => ({
      filter: e.target.closest('[data-filter]')?.dataset.filter || 'all',
    }),
  },

  view: (state) => {
    const counts  = countByStatus(state.todos)
    const visible = filterTodos(state.todos, state.filter)
    const atLimit = state.todos.length >= 20

    const filterBtn = (value, label, count) => button({
      label:   `${label} (${count})`,
      variant: state.filter === value ? 'primary' : 'ghost',
      size:    'sm',
      attrs:   { 'data-event': 'setFilter', 'data-filter': value, 'aria-pressed': String(state.filter === value) },
    })

    const todoItem = (todo, last = false) => `
      <li class="u-flex u-items-center u-gap-3 u-p-3${last ? '' : ' u-border-b'}" data-id="${todo.id}">
        ${checkbox({
          id:        `todo-${todo.id}`,
          event:     'change:toggle',
          checked:   todo.done,
          class:     'u-flex-1',
          labelHtml: `<span class="${todo.done ? 'u-text-muted' : ''}">${esc(todo.text)}</span>`,
        })}
        ${button({
          label:   '',
          variant: 'ghost',
          size:    'sm',
          attrs:   { 'data-event': 'remove', 'aria-label': `Remove "${esc(todo.text)}"` },
          icon:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        })}
      </li>`

    const listContent = visible.length === 0
      ? `<div class="u-p-6">${empty({
          title:       state.filter === 'done'   ? 'No completed todos yet'
                     : state.filter === 'active' ? 'Nothing left to do!'
                     : 'No todos yet',
          description: state.filter === 'all' ? 'Add something above to get started.' : '',
        })}</div>`
      : `<ul aria-label="Todo items">${visible.map((t, i) => todoItem(t, i === visible.length - 1)).join('')}</ul>`

    return `
  ${examplesNav('<span>✓ Todos</span>', '/todos')}

  <main id="main-content">
    ${section({ eyebrow: 'Client State & Persistence', title: 'My Todos', level: 1, align: 'center',
      subtitle: 'Todos persist across reloads. Mutations are pure — add, toggle, remove, and filter without a server round-trip.',
      content:
      container({ size: 'md', content: stack({ gap: 'md', content: `

        <form data-action="add" data-reset aria-label="Add a todo">
          ${stack({ gap: 'xs', content: `
            <div class="u-flex u-gap-2 u-items-end">
              ${input({ name: 'text', placeholder: 'What needs doing?', disabled: atLimit, class: 'u-flex-1', attrs: { maxlength: '120', 'aria-label': 'New todo text' } })}
              ${button({ label: 'Add', type: 'submit', disabled: atLimit })}
            </div>
            ${atLimit ? `<p class="u-text-sm u-text-yellow" role="alert">Maximum of 20 todos reached.</p>` : ''}
          ` })}
        </form>

        ${cluster({ justify: 'between', content: `
          <div role="group" aria-label="Filter todos" class="u-flex u-gap-1">
            ${filterBtn('all',    'All',    counts.total)}
            ${filterBtn('active', 'Active', counts.active)}
            ${filterBtn('done',   'Done',   counts.done)}
          </div>
          ${counts.done > 0 && state.filter !== 'active'
            ? button({ label: 'Clear done', variant: 'ghost', size: 'sm', attrs: { 'data-event': 'clearDone' } })
            : ''}
        ` })}

        ${card({ flush: true, content: listContent })}

      ` }) })
    })}
  </main>`
  },
}
