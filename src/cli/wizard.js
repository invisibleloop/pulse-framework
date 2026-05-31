/**
 * Pulse — Conversational intake wizard
 *
 * Two modes:
 *   chat  — readline + claude -p per turn. User talks to the actual Claude
 *           model. Natural conversation, Claude asks follow-ups, shares
 *           opinions. When it has enough, it emits PULSE_BUILD:{...} and
 *           we kick off the build phase.
 *
 *   form  — Ink-based structured questions. Used for Copilot (gh copilot
 *           has no scriptable chat mode).
 */

// ---------------------------------------------------------------------------
// CHAT MODE  (claude agent)
// ---------------------------------------------------------------------------

import readline from 'readline'
import { spawn } from 'child_process'
import process   from 'process'

// ANSI helpers
const C = {
  reset:  '\x1b[0m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  white:  '\x1b[97m',
  green:  '\x1b[32m',
}
const pr = s => process.stdout.write(s)
const pl = (s = '') => process.stdout.write(s + '\n')

// System prompt — tells Claude to have a conversation, then emit the build signal
const SYSTEM_NEW = `\
You are Pulse — a friendly, direct AI assistant that helps developers build web pages with the Pulse framework.

Your job right now: have a natural conversation to understand what the user wants to build. Ask follow-up questions. Give opinions when asked. Suggest ideas. Be brief — this is a terminal, not a document. 2-4 short back-and-forth messages is plenty.

Once you feel you have enough to start (you don't need to be exhaustive — a clear intent and rough direction is sufficient), output the PULSE_BUILD signal on its own line immediately followed by a short confirmation message:

PULSE_BUILD:{"intent":"...","name":"...","audience":"...","features":"...","vibe":"..."}

Rules for the JSON:
- intent: one sentence describing what to build
- name: product/site name, or null if unknown
- audience: who it's for, or null if not mentioned
- features: comma-separated selling points, or null
- vibe: one of warm, minimal, bold, editorial, playful, brutalist, retro, neon, paper — pick what fits, don't ask unless the user has a strong preference
- All values must be valid JSON strings or null (no undefined)

Do not output the PULSE_BUILD line until you're ready to build.`

const SYSTEM_EDIT = `\
You are Pulse — a friendly AI assistant helping a developer modify an existing web project built with the Pulse framework.

Have a brief, natural conversation to understand what the user wants to change or add. If their first message is clear enough, you can go straight to building.

Once you understand the request, output:
PULSE_BUILD:{"intent":"...","name":null,"audience":null,"features":null,"vibe":null}

intent should capture exactly what they want done. Then say something brief like "On it."`

// Extract PULSE_BUILD:{...} from Claude's response
function extractBuildSignal(text) {
  const idx = text.indexOf('PULSE_BUILD:')
  if (idx === -1) return null
  const jsonStart = text.indexOf('{', idx)
  if (jsonStart === -1) return null
  let depth = 0, jsonEnd = -1
  for (let i = jsonStart; i < text.length; i++) {
    if (text[i] === '{') depth++
    if (text[i] === '}') { depth--; if (depth === 0) { jsonEnd = i; break } }
  }
  if (jsonEnd === -1) return null
  try { return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) }
  catch { return null }
}

// Remove the build signal line from displayed text
function cleanResponse(text) {
  return text
    .replace(/PULSE_BUILD:\{[^]*?\}/m, '')
    .replace(/^\s*\n/, '')
    .trimEnd()
}

// Show a simple animated "thinking…" indicator
function startSpinner() {
  const frames = ['·', '··', '···', '····']
  let i = 0
  const id = setInterval(() => {
    pr(`\r  ${C.dim}${frames[i++ % frames.length]}${C.reset}  `)
  }, 200)
  return () => {
    clearInterval(id)
    pr('\r\x1b[K')  // clear line
  }
}

// Call claude -p with the full conversation history
function askClaude(messages, systemPrompt) {
  const history = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Pulse'}: ${m.content}`)
    .join('\n\n')
  const prompt = `${systemPrompt}\n\n---\n\n${history}\n\nPulse:`

  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    // Prompt must come after -- (same pattern as agent-runner.js)
    const proc = spawn('claude', ['-p', '--output-format', 'text', '--', prompt], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    proc.stdout.on('data', d => { stdout += d.toString() })
    proc.stderr.on('data', d => { stderr += d.toString() })
    proc.on('close', code => {
      if (code !== 0) {
        const detail = stderr.trim() || `exit code ${code}`
        reject(new Error(detail))
      } else {
        resolve(stdout.trim())
      }
    })
  })
}

// Print Claude's response, word-wrapping at ~80 cols with 2-space indent
function printResponse(text) {
  const clean = cleanResponse(text)
  if (!clean) return
  pl()
  pr(`  ${C.bold}${C.cyan}Pulse${C.reset}  `)
  // Wrap to ~78 chars (80 - 2 indent)
  const words = clean.replace(/\n/g, ' \n ').split(' ')
  let col = 8  // "Pulse  " is 7 chars
  for (const word of words) {
    if (word === '\n') { pl(); pr('         '); col = 9; continue }
    if (col + word.length + 1 > 80 && col > 9) {
      pl(); pr('         '); col = 9
    }
    pr(word + ' '); col += word.length + 1
  }
  pl()
}

async function runChatWizard({ version, existingPages }) {
  const isExisting = existingPages.length > 0
  const systemPrompt = isExisting ? SYSTEM_EDIT : SYSTEM_NEW

  // Banner
  pl()
  pr(`  ${C.bold}${C.cyan}⚡ Pulse${C.reset}  `)
  pl(`${C.dim}v${version}  —  ${isExisting
    ? `${existingPages.length} page${existingPages.length !== 1 ? 's' : ''}`
    : 'new build'}${C.reset}`)
  pl()

  if (isExisting) {
    existingPages.slice(0, 5).forEach(p => pl(`  ${C.gray}${p}${C.reset}`))
    if (existingPages.length > 5) pl(`  ${C.gray}+ ${existingPages.length - 5} more${C.reset}`)
    pl()
  }

  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
  })

  const messages = []

  function askUser(promptStr) {
    return new Promise(resolve => {
      rl.question(promptStr, answer => resolve(answer.trim()))
    })
  }

  // Handle Ctrl+C gracefully
  rl.on('SIGINT', () => {
    pl()
    pl(`  ${C.dim}Cancelled.${C.reset}`)
    pl()
    process.exit(0)
  })

  try {
    while (true) {
      const userInput = await askUser(`  ${C.cyan}›${C.reset} `)
      if (!userInput) continue

      messages.push({ role: 'user', content: userInput })

      const stopSpinner = startSpinner()
      let response
      try {
        response = await askClaude(messages, systemPrompt)
      } catch (err) {
        stopSpinner()
        pl()
        pl(`  ${C.dim}Error: ${err.message}${C.reset}`)
        pl()
        continue
      }
      stopSpinner()

      messages.push({ role: 'assistant', content: response })

      const signal = extractBuildSignal(response)
      printResponse(response)

      if (signal) {
        rl.close()
        return { ...signal, _isEdit: isExisting }
      }
    }
  } finally {
    rl.close()
  }
}

// ---------------------------------------------------------------------------
// FORM MODE  (copilot agent — Ink-based structured questions)
// ---------------------------------------------------------------------------

const VIBES = [
  'warm', 'minimal', 'bold', 'editorial',
  'playful', 'brutalist', 'retro', 'neon', 'paper',
]

const NEW_BUILD_QUESTIONS = [
  { key: 'intent',   label: 'What would you like to build?',             type: 'text',   required: true  },
  { key: 'name',     label: 'What\'s the name of the product or site?',  type: 'text',   required: true  },
  { key: 'audience', label: 'Who is it for?',                            type: 'text',   required: false,
    hint: 'e.g. small businesses, developers, parents' },
  { key: 'features', label: 'What are the key features or selling points?', type: 'text', required: true,
    hint: 'comma-separated' },
  { key: 'vibe',     label: 'Pick a visual vibe',                        type: 'choice', required: false, options: VIBES },
]

const EDIT_QUESTIONS = [
  { key: 'intent', label: 'What would you like to build or change?', type: 'text', required: true,
    hint: 'e.g. add a pricing page, make the hero darker, fix mobile layout' },
]

async function runFormWizard({ version, existingPages }) {
  const { render, Text, Box, useInput } = await import('ink')
  const { default: React, useState }    = await import('react')
  const h = React.createElement

  const isExisting = existingPages.length > 0
  const questions  = isExisting ? EDIT_QUESTIONS : NEW_BUILD_QUESTIONS

  function TextInput({ value, onChange, onSubmit, onSkip, required }) {
    useInput((char, key) => {
      if (key.return)              { value.trim() ? onSubmit(value.trim()) : (!required && onSkip()); return }
      if (key.escape)              { !required && onSkip(); return }
      if (key.backspace || key.delete) { onChange(value.slice(0, -1)); return }
      if (!key.ctrl && !key.meta && char) onChange(value + char)
    })
    return h(Box, null,
      h(Text, { color: 'cyan' }, '  › '),
      h(Text, { color: 'white' }, value),
      h(Text, { color: 'cyan', dimColor: true }, '▌'),
    )
  }

  function ChoiceInput({ options, selectedIndex, onChange, onSubmit, onSkip }) {
    useInput((_, key) => {
      if (key.upArrow)   { onChange(Math.max(0, selectedIndex - 1)); return }
      if (key.downArrow) { onChange(Math.min(options.length - 1, selectedIndex + 1)); return }
      if (key.return)    { onSubmit(options[selectedIndex]); return }
      if (key.escape)    { onSkip(); return }
    })
    return h(Box, { flexDirection: 'column' },
      ...options.map((opt, i) =>
        h(Text, { key: opt, color: i === selectedIndex ? 'cyan' : 'gray', dimColor: i !== selectedIndex },
          `  ${i === selectedIndex ? '›' : ' '} ${opt}`
        )
      ),
      h(Text, { color: 'gray', dimColor: true }, '\n  ↑↓ navigate  ↵ select  esc skip'),
    )
  }

  function WizardApp({ onComplete }) {
    const [step, setStep]       = useState(0)
    const [answers, setAnswers] = useState({})
    const [inputVal, setInput]  = useState('')
    const [vibeIdx, setVibeIdx] = useState(0)
    const question = questions[step]

    function advance(key, value) {
      const next = { ...answers, [key]: value }
      setAnswers(next); setInput('')
      step + 1 >= questions.length ? onComplete(next) : setStep(step + 1)
    }

    return h(Box, { flexDirection: 'column', paddingLeft: 1 },
      h(Box, { marginBottom: 1 },
        h(Text, { bold: true, color: 'cyan' }, '⚡ Pulse '),
        h(Text, { color: 'gray', dimColor: true },
          isExisting
            ? `v${version}  —  ${existingPages.length} page${existingPages.length !== 1 ? 's' : ''}`
            : `v${version}  —  new build`
        ),
      ),
      isExisting && h(Box, { flexDirection: 'column', marginBottom: 1 },
        ...existingPages.slice(0, 5).map(p => h(Text, { key: p, color: 'gray', dimColor: true }, `  ${p}`)),
        existingPages.length > 5 && h(Text, { color: 'gray', dimColor: true }, `  + ${existingPages.length - 5} more`),
      ),
      ...questions.slice(0, step).map(q =>
        h(Box, { key: q.key },
          h(Text, { color: 'gray', dimColor: true }, `  ${q.label}  `),
          h(Text, { color: 'white' }, answers[q.key] || '—'),
        )
      ),
      step < questions.length && h(Box, { flexDirection: 'column', marginTop: step > 0 ? 1 : 0 },
        h(Box, null,
          h(Text, { bold: true, color: 'white' }, `  ${question.label}`),
          !question.required && h(Text, { color: 'gray', dimColor: true }, '  (optional)'),
        ),
        question.hint && h(Text, { color: 'gray', dimColor: true }, `  ${question.hint}`),
        question.type === 'text'
          ? h(TextInput, { value: inputVal, onChange: setInput,
              onSubmit: v => advance(question.key, v),
              onSkip:   () => advance(question.key, null),
              required: question.required })
          : h(ChoiceInput, { options: question.options, selectedIndex: vibeIdx,
              onChange: setVibeIdx,
              onSubmit: v => advance(question.key, v),
              onSkip:   () => advance(question.key, null) }),
      ),
    )
  }

  return new Promise(resolve => {
    let done = false
    const { unmount } = render(h(WizardApp, {
      onComplete: answers => {
        if (done) return; done = true
        setTimeout(() => { unmount(); resolve({ ...answers, _isEdit: isExisting }) }, 80)
      },
    }))
  })
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function runWizard({ version, root, agent = 'claude' }) {
  let existingPages = []
  try {
    const { loadPages } = await import('./discover.js')
    const pages = await loadPages(root)
    existingPages = pages.map(p => p.spec?.route || p.route).filter(Boolean)
  } catch { /* treat as new project */ }

  // Copilot has no scriptable chat mode — use the Ink form
  if (agent === 'copilot') {
    return runFormWizard({ version, existingPages })
  }

  return runChatWizard({ version, existingPages })
}
