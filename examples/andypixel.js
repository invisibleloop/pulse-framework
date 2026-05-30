/**
 * Pulse — Andy Pixel example
 *
 * Demonstrates:
 *   - Blog article layout — editorial light-theme, prose-width reading column
 *   - Composing nav, badge, avatar, prose, input, button, footer
 *   - Custom code block component (dark pre with labelled header)
 *   - Blockquote / pullquote styling
 *   - Async newsletter subscribe action with success/error state
 *   - Author bio strip below article content
 *   - iconCode, iconCheck from icons.js
 *   - Orange accent palette with WCAG contrast fixes for badge + inline code
 *
 * Run: node examples/dev.server.js  →  http://localhost:3001/andypixel
 */

import {
  nav,
  footer,
  badge,
  button,
  avatar,
  prose,
  input,
} from '../src/ui/index.js'

import { iconCode, iconCheck } from '../src/ui/icons.js'

// ---------------------------------------------------------------------------
// Code block helper
// ---------------------------------------------------------------------------

function codeBlock({ filename, code }) {
  return `
    <div class="ap-code-block" role="figure" aria-label="Code example: ${filename}">
      <div class="ap-code-block__header">
        ${iconCode({ size: 14 })}
        <span>${filename}</span>
      </div>
      <pre class="ap-code-block__pre"><code class="ap-code-block__code">${code}</code></pre>
    </div>
  `
}

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

export default {
  route: '/andypixel',

  meta: {
    title:       'JavaScript Proxies: The Hidden Superpower \u2014 Andy Pixel',
    description: 'Discover how JavaScript Proxies let you intercept and redefine fundamental operations on objects.',
    styles:      ['/pulse-ui.css', '/examples/andypixel.css'],
    theme:       'light',
  },

  state: {
    status: 'idle',
  },

  view: (state) => `
    <main id="main-content">

      ${nav({
        logo:  'Andy Pixel',
        links: [
          { label: 'Blog',     href: '#blog'     },
          { label: 'Projects', href: '#projects' },
          { label: 'About',    href: '#about'    },
        ],
      })}

      <article>

        <header class="ap-article-header">
          <div class="ap-reading-col">

            <div class="ap-article-meta">
              ${badge({ label: 'JavaScript' })}
              ${badge({ label: 'Advanced' })}
              <span class="u-text-muted u-text-sm">\u00b7 May 28, 2026 \u00b7 8 min read</span>
            </div>

            <h1 class="ap-article-title">
              JavaScript Proxies: The Hidden Superpower You\u2019re Not Using
            </h1>

            <p class="ap-article-subtitle">
              Intercept, transform, and observe objects at a fundamental level \u2014
              without touching the source.
            </p>

            <div class="ap-article-author-strip">
              ${avatar({ name: 'Andy Pixel', size: 'sm' })}
              <div>
                <p class="u-text-sm u-font-bold">Andy Pixel</p>
                <p class="u-text-sm u-text-muted">Frontend Engineer</p>
              </div>
            </div>

          </div>
        </header>

        <div class="ap-article-body ap-reading-col">

          ${prose({ content: `
            <p class="ap-article-lead">If you\u2019ve ever wanted to validate object properties automatically,
            track changes reactively, or build a mock API client that feels real \u2014 the
            <code>Proxy</code> object is your tool. Yet somehow it flies under the radar
            for most developers.</p>

            <p>Introduced in ES2015, <code>Proxy</code> wraps an object and lets you intercept
            fundamental operations \u2014 property reads, writes, deletions, and more \u2014 via
            \u201ctraps\u201d defined on a handler object.</p>

            <h2>The anatomy of a Proxy</h2>

            <p>A Proxy takes two arguments: the <strong>target</strong> (the object being wrapped)
            and the <strong>handler</strong> (an object defining which operations to intercept).
            Every interceptable operation has a corresponding trap method on the handler.</p>
          ` })}

          ${codeBlock({
            filename: 'proxy-basics.js',
            code: `const handler = {
  get(target, key) {
    return key in target
      ? target[key]
      : \`Property "\${key}" doesn\u2019t exist\`
  },
  set(target, key, value) {
    if (typeof value !== 'number') {
      throw new TypeError('Only numbers allowed')
    }
    target[key] = value
    return true
  }
}

const proxy = new Proxy({}, handler)
proxy.score = 42        // \u2713 works
proxy.score = 'oops'   // \u2717 TypeError`,
          })}

          ${prose({ content: `
            <p>The <code>get</code> trap runs on every property access. The <code>set</code> trap
            intercepts every assignment. Return <code>true</code> from <code>set</code> to signal
            success \u2014 otherwise you\u2019ll get a <code>TypeError</code> in strict mode.</p>

            <h2>Real-world use cases</h2>

            <p>The real power isn\u2019t abstract. Proxy unlocks patterns that are otherwise
            painful or impossible.</p>
          ` })}

          <blockquote class="ap-pullquote">
            <p>\u201cA Proxy doesn\u2019t change what your object <em>is</em> \u2014 it changes what your
            object <em>does</em> when the runtime touches it.\u201d</p>
          </blockquote>

          ${prose({ content: `
            <h3>Reactive state</h3>
            <p>Vue 3\u2019s reactivity system is built entirely on Proxy. When you access a reactive
            property, Vue\u2019s <code>get</code> trap tracks the dependency. When you mutate it,
            the <code>set</code> trap schedules re-renders. No syntax overhead. Just assignment.</p>

            <h3>Input validation</h3>
            <p>Instead of scattering guard clauses through your codebase, centralise validation
            in a Proxy handler. The contract lives in one place. Every consumer benefits
            automatically.</p>

            <h3>API mocking</h3>
            <p>Wrap a plain object in a Proxy that intercepts property access and returns async
            functions. You get a fully-typed mock client that mirrors your real API surface \u2014
            without any code generation.</p>

            <h2>Performance considerations</h2>

            <p>Proxies are not free. Every trap fires a function call. In tight loops over large
            collections, this adds up. Benchmark before you commit. For most use cases \u2014 form
            state, reactive stores, config validation \u2014 the overhead is completely negligible.</p>

            <p>The V8 team has steadily optimised Proxy performance since ES2015. Don\u2019t avoid
            Proxy out of dated fear \u2014 measure it first.</p>
          ` })}

        </div>

      </article>

      <div class="ap-author-bio-wrap">
        <div class="ap-reading-col">
          <div class="ap-author-bio">
            ${avatar({ name: 'Andy Pixel', size: 'lg' })}
            <div class="ap-author-bio__text">
              <p class="ap-author-bio__name">Andy Pixel</p>
              <p class="u-text-muted u-text-sm">
                Frontend engineer obsessed with the web platform. Writing about JavaScript,
                CSS, and creative code. Building things at the edge of what browsers can do.
              </p>
            </div>
          </div>
        </div>
      </div>

      ${ state.status === 'success'
        ? `<div class="ap-newsletter-success">
            <p class="u-font-bold u-text-lg">${iconCheck({ size: 20, class: 'u-inline' })} You\u2019re in!</p>
            <p class="u-text-muted u-mt-2">Next article lands in your inbox.</p>
          </div>`
        : `<div class="ap-newsletter-section">
            <p class="ap-newsletter-eyebrow">Stay in the loop</p>
            <h2 class="ap-newsletter-title">More like this, in your inbox.</h2>
            <p class="u-text-muted">
              Deep-dives on JavaScript, the web platform, and frontend engineering \u2014
              whenever I publish. No noise.
            </p>
            ${ state.status === 'error'
              ? `<p class="ap-newsletter-error u-mt-3">Something went wrong. Please try again.</p>`
              : '' }
            <form class="ap-newsletter-form" data-action="subscribe">
              ${input({ type: 'email', name: 'email', placeholder: 'you@example.com', label: 'Email address', attrs: { autocomplete: 'email' } })}
              ${button({ label: 'Subscribe', variant: 'primary', attrs: { type: 'submit' } })}
            </form>
          </div>`
      }

      ${footer({
        logo:  'Andy Pixel',
        links: [
          { label: 'Blog',     href: '#blog'     },
          { label: 'Projects', href: '#projects' },
          { label: 'About',    href: '#about'    },
          { label: 'RSS',      href: '#feed'     },
        ],
      })}

    </main>
  `,

  actions: {
    subscribe: {
      onStart: (state, formData) => ({
        status: 'loading',
      }),
      run: async (state, serverState, formData) => {
        // Newsletter subscription would call an API here
      },
      onSuccess: (state) => ({ status: 'success' }),
      onError:   (state, err) => ({
        status: 'error',
        errors: err?.validation ?? [{ message: err.message }],
      }),
    },
  },
}
