## WebMCP — forms an AI agent can call

Read this only when the user asks for WebMCP, for forms an AI agent can use, or for a site that agents can act on.

WebMCP lets a page offer a tool to an AI agent that runs in the browser. Pulse supports the **declarative** form of it. You add attributes to a form that you already render on the server. This adds no JavaScript to the page.

### Status

- WebMCP is an origin trial in Chrome (from version 149). Other browsers do not support it yet. The spec is a draft and can change.
- To try it locally, enable `chrome://flags/#enable-webmcp-testing` and restart Chrome.
- For visitors, register the site's origin for the trial and put the token in `pulse.config.js`. Pulse sends it as the `Origin-Trial` header on HTML pages:

```js
// pulse.config.js
export default { originTrial: process.env.WEBMCP_TRIAL_TOKEN }   // a string, or an array for several trials
```

### A tool form

Put the attributes on a `<form>`. The fields become the tool's parameters.

```js
view: (state, server) => `
  <main id="main-content">
    <form method="POST"
          toolname="join_newsletter"
          tooldescription="Subscribe an email address to the weekly newsletter.">
      ${server.csrf}
      ${input({ label: 'Email', name: 'email', type: 'email', required: true })}
      ${button({ label: 'Subscribe', type: 'submit' })}
    </form>
  </main>`,
```

| Attribute | On | Meaning |
|---|---|---|
| `toolname` | form | The tool's name. Required, with `tooldescription`. |
| `tooldescription` | form | What the form does. The agent picks a tool from this text. |
| `toolparamdescription` | field | Describes one parameter. Without it the browser uses the field's `<label>`, then `aria-description`. |
| `toolautosubmit` | form | Submit as soon as the agent fills the form. Without it, the user clicks Submit. |

Removing `toolname` or `tooldescription` unregisters the tool.

### Rules

`pulse_review` checks these on the rendered HTML:

- Give every tool both `toolname` and a non-empty `tooldescription`.
- A name is 1 to 128 ASCII letters, digits, `_`, `-` or `.`. It must be unique on the page.
- Describe every field with a `<label>` or `toolparamdescription`. The agent reads it to fill the field.
- Use `toolautosubmit` only on a form that is safe to run unattended, such as a search with `method="GET"`. Leave it off any form that changes data, so the user confirms.

### Safety

- A value from an agent is untrusted input. Check it in your `submit` function as you do for any form. The CSRF token stays in the form.
- Never put secrets or personal data in `tooldescription`. Anyone who views the page source can read it.
- Text on the page that came from users can try to steer an agent. Escape it, as you do everywhere.

### Not supported

Pulse has no spec key for the JavaScript form of the API (`document.modelContext.registerTool`). That form needs client JavaScript and its API is still changing.
