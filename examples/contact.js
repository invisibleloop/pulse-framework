/**
 * Pulse — Contact form example
 *
 * Demonstrates:
 *   - Server data (fetched before render, passed to view)
 *   - Validation (required, email format, length limits)
 *   - Async action with full lifecycle: onStart → validate → run → onSuccess/onError
 *   - Loading, success, and error states
 *
 * Run: node examples/dev.server.js  →  http://localhost:3001/contact
 */

import { button, alert, heading, input, textarea, card, container, section, stack, grid, iconMail, iconPhone, iconMapPin, iconClock, iconCheckCircle } from '../src/ui/index.js'
import { examplesNav } from './shared.js'

function infoDetail(icon, label, value, href) {
  const valueHtml = href
    ? `<a href="${href}" class="u-text-default">${value}</a>`
    : `<span>${value}</span>`
  return `<div class="u-flex u-items-start u-gap-3">
    <span class="u-text-muted u-shrink-0" aria-hidden="true">${icon}</span>
    <div>
      <p class="u-text-xs u-text-muted u-font-semibold u-mb-1">${label}</p>
      <p class="u-text-sm">${valueHtml}</p>
    </div>
  </div>`
}

export default {
  route:   '/contact',

  meta: {
    title:       'Contact — Pulse',
    description: 'A contact form built with Pulse. Demonstrates server data, validation, and async action lifecycle.',
    styles:      ['/pulse-ui.css'],
  },

  server: {
    info: async () => ({
      email:   'hello@example.com',
      phone:   '+44 20 7946 0958',
      address: '123 Shoreditch High St, London E1 6JE',
      hours:   'Monday – Friday, 9 am – 5 pm GMT',
    }),
  },

  state: {
    status: 'idle',   // idle | loading | success | error
    errors: [],
    fields: { name: '', email: '', subject: '', message: '' },
  },

  validation: {
    'fields.name':    { required: true, minLength: 2, maxLength: 80 },
    'fields.email':   { required: true, format: 'email' },
    'fields.subject': { required: true, minLength: 2, maxLength: 120 },
    'fields.message': { required: true, minLength: 10, maxLength: 2000 },
  },

  mutations: {
    reset: () => ({ status: 'idle', errors: [], fields: { name: '', email: '', subject: '', message: '' } }),
  },

  actions: {
    submit: {
      onStart: (_state, formData) => ({
        status: 'loading',
        errors: [],
        fields: {
          name:    formData.get('name')    || '',
          email:   formData.get('email')   || '',
          subject: formData.get('subject') || '',
          message: formData.get('message') || '',
        },
      }),

      validate: true,

      run: async (_state, _server, formData) => {
        // Simulate sending — replace with a real fetch() to your API
        await new Promise(resolve => setTimeout(resolve, 900))
        // Demo: email addresses containing "fail" trigger the error path
        if ((formData.get('email') || '').includes('fail')) {
          throw new Error('Unable to deliver message. Please try another address.')
        }
      },

      onSuccess: () => ({ status: 'success', errors: [] }),

      onError: (_state, err) => ({
        status: 'error',
        errors: err?.validation
          ? err.validation.map(e => {
              const field = e.path?.split('.').pop() || ''
              const label = { name: 'Name', email: 'Email', subject: 'Subject', message: 'Message' }[field] || field
              const msg = e.rule === 'required'  ? `${label} is required`
                        : e.rule === 'minLength' ? `${label} is too short`
                        : e.rule === 'maxLength' ? `${label} is too long`
                        : e.rule === 'format'    ? `${label} must be a valid email address`
                        : e.message
              return { field, message: msg }
            })
          : [{ message: err?.message || 'Something went wrong. Please try again.' }],
      }),
    },
  },

  view: (state, server) => {
    const { info } = server
    const loading   = state.status === 'loading'
    const isSuccess = state.status === 'success'

    const fieldError = (field) => state.errors.find(e => e.field === field)?.message || ''

    const infoCol = stack({ gap: 'lg', content: `
      ${heading({ level: 2, text: 'Get in touch', size: 'xl' })}
      <p class="u-text-sm u-text-muted">Fill in the form and we&rsquo;ll get back to you within one business day.</p>
      ${stack({ gap: 'md', content: `
        ${infoDetail(iconMail({ size: 18 }),   'Email',   info.email,   'mailto:' + info.email)}
        ${infoDetail(iconPhone({ size: 18 }),  'Phone',   info.phone,   'tel:' + info.phone.replace(/\s/g, ''))}
        ${infoDetail(iconMapPin({ size: 18 }), 'Address', info.address, null)}
        ${infoDetail(iconClock({ size: 18 }),  'Hours',   info.hours,   null)}
      ` })}
    ` })

    const cardContent = isSuccess
      ? stack({ gap: 'md', align: 'center', content:
          iconCheckCircle({ size: 48, bg: 'circle', bgColor: 'success' }) +
          heading({ level: 2, text: 'Message sent!', size: 'xl' }) +
          `<p class="u-text-sm u-text-muted u-text-center">Thanks for reaching out. We&rsquo;ll be in touch within one business day.</p>` +
          button({ label: 'Send another message', variant: 'secondary', attrs: { 'data-event': 'reset' } })
        })
      : `<form data-action="submit" novalidate>
          <fieldset style="border:none;padding:0;margin:0" ${loading ? 'disabled' : ''}>
            <legend class="u-text-lg u-font-semibold u-mb-5">Send a message</legend>
            ${stack({ gap: 'md', content: `
              ${state.status === 'error' && state.errors.length > 0
                ? alert({ variant: 'error', content: state.errors[0]?.message || 'Please check the fields below.' })
                : ''}
              ${grid({ cols: 2, gap: 'sm', content:
                input({ name: 'name',  label: 'Name',          type: 'text',  placeholder: 'Jane Smith',       value: state.fields.name,    required: true, error: fieldError('name')    }) +
                input({ name: 'email', label: 'Email address',  type: 'email', placeholder: 'jane@example.com', value: state.fields.email,   required: true, error: fieldError('email')   })
              })}
              ${input({ name: 'subject', label: 'Subject', placeholder: 'How can we help?', value: state.fields.subject, required: true, error: fieldError('subject') })}
              ${textarea({ name: 'message', label: 'Message', placeholder: "Tell us what's on your mind…", value: state.fields.message, rows: 5, required: true, error: fieldError('message') })}
              ${button({ label: loading ? 'Sending…' : 'Send message', type: 'submit', fullWidth: true, disabled: loading })}
            ` })}
          </fieldset>
        </form>`

    return `
  ${examplesNav('<span>✉ Contact</span>', '/contact')}

  <main id="main-content">
    ${section({ eyebrow: 'Contact', title: 'We\u2019d love to hear from you', level: 1, content:
      container({ size: 'lg', content:
        grid({ cols: 2, gap: 'lg', content: `
          <div>${infoCol}</div>
          <div>${card({ content: cardContent })}</div>
        ` })
      })
    })}
  </main>`
  },
}
