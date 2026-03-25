## Example page — contact form

```js
import { nav, section, input, textarea, button, alert, container } from '@invisibleloop/pulse/ui'
import { layout } from '../components/layout.js'

export default {
  meta: {
    title:  'Contact',
    styles: ['/app.css', '/pulse-ui.css'],
  },
  state: {
    status: 'idle',
    errors: [],
  },
  actions: {
    send: {
      onStart: (state, formData) => ({
        status:  'loading',
        name:    formData.get('name'),
        email:   formData.get('email'),
        message: formData.get('message'),
      }),
      run: async (state, serverState, formData) => {
        const res = await fetch('/api/contact', { method: 'POST', body: formData })
        if (!res.ok) throw new Error(await res.text())
        return await res.json()
      },
      onSuccess: (state, result) => ({ status: 'success' }),
      onError:   (state, err)    => ({
        status: 'error',
        errors: err?.validation ?? [{ message: err.message }],
      }),
    },
  },
  view: (state) => layout(`
    ${container({ content: `
      ${section({ title: 'Contact Us', subtitle: 'We will get back to you within 24 hours.' })}
      ${state.status === 'success'
        ? alert({ type: 'success', message: 'Message sent!' })
        : `<form data-action="send" class="u-flex u-flex-col u-gap-4">
            ${grid({ cols: 2, gap: 'md', content: `
              ${input({ name: 'name',  label: 'Name',  placeholder: 'Your name',       required: true })}
              ${input({ name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true })}
            ` })}
            ${textarea({ name: 'message', label: 'Message', rows: 5, required: true })}
            ${state.errors.length ? alert({ type: 'error', message: state.errors[0].message }) : ''}
            ${button({ label: state.status === 'loading' ? 'Sending…' : 'Send', type: 'submit', variant: 'primary', fullWidth: true })}
          </form>`
      }
    ` })}
  `),
}
```
