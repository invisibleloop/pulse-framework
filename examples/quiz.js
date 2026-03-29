/**
 * Pulse — Quiz example
 *
 * Demonstrates:
 *   - Multi-step state machine (intro → question → results)
 *   - Pure mutation logic with no server data
 *   - Computed view output from state
 *   - Restart flow
 *
 * Run: node examples/dev.server.js  →  http://localhost:3001/quiz
 */

import { button, badge, card, container, section, stack, cluster, progress, iconCheck, iconX } from '../src/ui/index.js'
import { examplesNav } from './shared.js'

export const QUESTIONS = [
  {
    id:      1,
    text:    'What does SSR stand for in web development?',
    options: ['Static Site Rendering', 'Server-Side Rendering', 'Stylesheet Rendering', 'Synchronous Script Runtime'],
    answer:  1,
  },
  {
    id:      2,
    text:    'Which HTTP method is typically used to submit a form?',
    options: ['GET', 'PUT', 'POST', 'PATCH'],
    answer:  2,
  },
  {
    id:      3,
    text:    'What does CLS measure in Core Web Vitals?',
    options: ['Cumulative Layout Shift', 'Content Loading Speed', 'CSS Load Score', 'Cached Layout State'],
    answer:  0,
  },
  {
    id:      4,
    text:    'Which of these is NOT a valid HTTP status code?',
    options: ['200 OK', '304 Not Modified', '418 I\'m a teapot', '512 Server Timeout'],
    answer:  3,
  },
  {
    id:      5,
    text:    'What does the "hydrate" property in a Pulse spec enable?',
    options: [
      'Server-side data fetching',
      'Client-side interactivity by importing the spec in the browser',
      'Automatic CSS injection',
      'Database connection pooling',
    ],
    answer:  1,
  },
]

export function scoreLabel(score, total) {
  const pct = score / total
  if (pct === 1)    return { label: 'Perfect score!',     variant: 'success' }
  if (pct >= 0.8)   return { label: 'Excellent!',          variant: 'success' }
  if (pct >= 0.6)   return { label: 'Good effort!',        variant: 'info'    }
  if (pct >= 0.4)   return { label: 'Keep practising!',   variant: 'warning' }
  return              { label: 'Better luck next time.',   variant: 'error'   }
}

export default {
  route:   '/quiz',

  meta: {
    title:       'Quiz — Pulse',
    description: 'A multiple-choice quiz built with Pulse. Demonstrates multi-step state machine and computed views.',
    styles:      ['/pulse-ui.css'],
  },

  state: {
    phase:     'intro',   // intro | question | results
    current:   0,         // index into QUESTIONS
    answers:   [],        // [number] — chosen option index per question
    score:     0,
  },

  mutations: {
    start: () => ({
      phase:   'question',
      current: 0,
      answers: [],
      score:   0,
    }),

    answer: (state, e) => {
      const chosen = parseInt(e.target.closest('[data-option]')?.dataset.option, 10)
      if (isNaN(chosen)) return state

      const q       = QUESTIONS[state.current]
      const correct = chosen === q.answer
      const answers = [...state.answers, chosen]
      const score   = state.score + (correct ? 1 : 0)
      const last    = state.current === QUESTIONS.length - 1

      return {
        answers,
        score,
        current: last ? state.current : state.current + 1,
        phase:   last ? 'results' : 'question',
      }
    },

    restart: () => ({
      phase:   'intro',
      current: 0,
      answers: [],
      score:   0,
    }),
  },

  view: (state) => {
    const nav = examplesNav('<span>🧠 Quiz</span>', '/quiz')

    if (state.phase === 'intro') {
      return `
  ${nav}
  <main id="main-content">
    ${section({ eyebrow: `${QUESTIONS.length} questions · multiple choice`, title: 'Web Dev Quiz', level: 1, subtitle: 'Test your knowledge of web development fundamentals — HTTP, performance, and Pulse.', align: 'center', content:
      container({ size: 'sm', content:
        cluster({ justify: 'center', content:
          button({ label: 'Start quiz', size: 'lg', attrs: { 'data-event': 'start' } })
        })
      })
    })}
  </main>`
    }

    if (state.phase === 'question') {
      const q   = QUESTIONS[state.current]
      const num = state.current + 1
      const pct = Math.round((num / QUESTIONS.length) * 100)

      return `
  ${nav}
  <main id="main-content">
    ${section({ content:
      container({ size: 'sm', content:
        card({ content: stack({ gap: 'lg', content: `

          ${cluster({ justify: 'between', content:
            `<span class="u-text-sm u-text-muted">Question ${num} of ${QUESTIONS.length}</span>` +
            badge({ label: `${state.score} correct`, variant: 'success' })
          })}

          ${progress({ value: pct, max: 100, label: `Question ${num} of ${QUESTIONS.length}` })}

          ${stack({ gap: 'md', content: `
            <p class="u-text-lg u-font-semibold" id="question-text">${q.text}</p>
            <ul role="list" aria-labelledby="question-text">
              ${q.options.map((opt, i) => `<li>${
                button({
                  label:     `${String.fromCharCode(65 + i)}. ${opt}`,
                  variant:   'secondary',
                  fullWidth:  true,
                  attrs:     { 'data-event': 'answer', 'data-option': String(i) },
                })
              }</li>`).join('')}
            </ul>
          ` })}

        ` }) })
      })
    })}
  </main>`
    }

    // Results
    const { label, variant } = scoreLabel(state.score, QUESTIONS.length)

    const resultRows = QUESTIONS.map((q, i) => {
      const chosen  = state.answers[i]
      const correct = chosen === q.answer
      return `<div class="u-flex u-items-start u-gap-3 u-p-3 u-border-b">
        <span class="${correct ? 'u-text-green' : 'u-text-red'}">${correct ? iconCheck({ size: 16 }) : iconX({ size: 16 })}</span>
        <div>
          <p class="u-text-sm">${q.text}</p>
          ${!correct ? `<p class="u-text-sm u-text-green u-mt-1">Correct: <strong>${q.options[q.answer]}</strong></p>` : ''}
        </div>
      </div>`
    }).join('')

    return `
  ${nav}
  <main id="main-content">
    ${section({ content:
      container({ size: 'sm', content:
        card({ content: stack({ gap: 'lg', align: 'center', content: `

          <div class="u-flex u-items-end u-justify-center u-gap-1" aria-label="Your score">
            <span class="u-text-4xl u-font-bold u-text-accent">${state.score}</span>
            <span class="u-text-xl u-text-muted">/ ${QUESTIONS.length}</span>
          </div>

          ${badge({ label, variant })}

          <div class="u-w-full u-border u-rounded-md u-overflow-hidden">${resultRows}</div>

          ${button({ label: 'Try again', variant: 'secondary', attrs: { 'data-event': 'restart' } })}

        ` }) })
      })
    })}
  </main>`
  },
}
