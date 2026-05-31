/**
 * Pulse — Conversational creation wizard
 *
 * Runs an Ink-based question flow to gather what the user wants to build,
 * then returns the collected answers for the agent to act on.
 */

import { render, Text, Box, useInput } from 'ink'
import React, { useState }            from 'react'

const h = React.createElement

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const VIBES = [
  'warm', 'minimal', 'bold', 'editorial',
  'playful', 'brutalist', 'retro', 'neon', 'paper',
]

const QUESTIONS = [
  {
    key:      'intent',
    label:    'What would you like to build?',
    type:     'text',
    required: true,
  },
  {
    key:      'name',
    label:    'What\'s the name of the product or site?',
    type:     'text',
    required: true,
  },
  {
    key:      'audience',
    label:    'Who is it for?',
    type:     'text',
    hint:     'e.g. small businesses, developers, parents',
    required: false,
  },
  {
    key:      'features',
    label:    'What are the key features or selling points?',
    type:     'text',
    hint:     'comma-separated, e.g. fast checkout, dark mode, analytics',
    required: true,
  },
  {
    key:      'vibe',
    label:    'Pick a visual vibe',
    type:     'choice',
    options:  VIBES,
    required: false,
  },
]

// ---------------------------------------------------------------------------
// TextInput
// ---------------------------------------------------------------------------

function TextInput({ value, onChange, onSubmit, onSkip, required }) {
  useInput((char, key) => {
    if (key.return) {
      if (value.trim()) {
        onSubmit(value.trim())
      } else if (!required) {
        onSkip()
      }
      return
    }
    if (key.escape) {
      if (!required) onSkip()
      return
    }
    if (key.backspace || key.delete) {
      onChange(value.slice(0, -1))
      return
    }
    if (!key.ctrl && !key.meta && char) {
      onChange(value + char)
    }
  })

  return h(Box, { marginTop: 0 },
    h(Text, { color: 'cyan' }, '  › '),
    h(Text, { color: 'white' }, value),
    h(Text, { color: 'cyan', dimColor: true }, '▌'),
  )
}

// ---------------------------------------------------------------------------
// ChoiceInput
// ---------------------------------------------------------------------------

function ChoiceInput({ options, selectedIndex, onChange, onSubmit, onSkip }) {
  useInput((char, key) => {
    if (key.upArrow)   { onChange(Math.max(0, selectedIndex - 1)); return }
    if (key.downArrow) { onChange(Math.min(options.length - 1, selectedIndex + 1)); return }
    if (key.return)    { onSubmit(options[selectedIndex]); return }
    if (key.escape)    { onSkip(); return }
  })

  return h(Box, { flexDirection: 'column', marginTop: 0 },
    ...options.map((opt, i) =>
      h(Text, { key: opt, color: i === selectedIndex ? 'cyan' : 'gray', dimColor: i !== selectedIndex },
        `  ${i === selectedIndex ? '›' : ' '} ${opt}`
      )
    ),
    h(Text, { color: 'gray', dimColor: true }, '\n  ↑↓ navigate  ↵ select  esc skip'),
  )
}

// ---------------------------------------------------------------------------
// Main wizard app
// ---------------------------------------------------------------------------

function WizardApp({ version, onComplete }) {
  const [step, setStep]         = useState(0)
  const [answers, setAnswers]   = useState({})
  const [inputVal, setInputVal] = useState('')
  const [vibeIdx, setVibeIdx]   = useState(0)

  const question = QUESTIONS[step]

  function advance(key, value) {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    setInputVal('')
    if (step + 1 >= QUESTIONS.length) {
      onComplete(next)
    } else {
      setStep(step + 1)
    }
  }

  function skip() {
    const defaultValue = question.type === 'choice' ? null : null
    advance(question.key, defaultValue)
  }

  return h(Box, { flexDirection: 'column', paddingLeft: 1, paddingRight: 1 },

    // Header
    h(Box, { marginBottom: 1 },
      h(Text, { bold: true, color: 'cyan' }, '⚡ Pulse '),
      h(Text, { color: 'gray', dimColor: true }, `v${version}  —  new build`),
    ),

    // Completed answers
    ...QUESTIONS.slice(0, step).map(q =>
      h(Box, { key: q.key },
        h(Text, { color: 'gray', dimColor: true }, `  ${q.label}  `),
        h(Text, { color: 'white' }, answers[q.key] || h(Text, { color: 'gray', dimColor: true }, '—')),
      )
    ),

    // Current question
    step < QUESTIONS.length && h(Box, { flexDirection: 'column', marginTop: step > 0 ? 1 : 0 },
      h(Box, {},
        h(Text, { bold: true, color: 'white' }, `  ${question.label}`),
        !question.required && h(Text, { color: 'gray', dimColor: true }, '  (optional)'),
      ),
      question.hint && h(Text, { color: 'gray', dimColor: true }, `  ${question.hint}`),

      question.type === 'text'
        ? h(TextInput, {
            value:    inputVal,
            onChange: setInputVal,
            onSubmit: v  => advance(question.key, v),
            onSkip:   ()  => skip(),
            required: question.required,
          })
        : h(ChoiceInput, {
            options:       question.options,
            selectedIndex: vibeIdx,
            onChange:      setVibeIdx,
            onSubmit:      v  => advance(question.key, v),
            onSkip:        ()  => skip(),
          }),
    ),
  )
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function runWizard({ version }) {
  return new Promise(resolve => {
    let done = false
    const { unmount } = render(
      h(WizardApp, {
        version,
        onComplete: answers => {
          if (done) return
          done = true
          setTimeout(() => {
            unmount()
            resolve(answers)
          }, 80) // brief pause so user sees completed state
        },
      })
    )
  })
}
