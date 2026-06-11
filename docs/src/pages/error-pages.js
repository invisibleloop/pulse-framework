import { renderLayout, h1, lead, section, codeBlock, callout, table } from '../lib/layout.js'
import { prevNext } from '../lib/nav.js'
import { highlight } from '../lib/highlight.js'

const { prev, next } = prevNext('/error-pages')

export default {
  route: '/error-pages',
  meta: {
    title: 'Error Pages — Pulse Docs',
    description: 'Custom 404 pages in Pulse. A spec with route "*" renders through the normal pipeline with status 404 whenever no route matches.',
    styles: ['/docs.css'],
  },
  view: () => renderLayout({
    currentHref: '/error-pages',
    prev,
    next,
    content: `
      ${h1('Error Pages')}
      ${lead('A spec with <code>route: \'*\'</code> is your site\'s custom 404 page. It renders through the normal pipeline — layout, styles, components, hydration — with status <strong>404</strong> whenever no route matches. Without one, visitors to a bad URL get the framework\'s unbranded default.')}

      ${section('not-found', 'The custom 404 page')}
      <p>Create a spec like any other page, with <code>'*'</code> as the route. Use the shared <code>layout()</code> so the page carries the site's nav and footer:</p>
      ${codeBlock(highlight(`import { layout } from '../components/layout.js'

export default {
  route: '*',
  meta: {
    title:  'Page not found',
    styles: ['/pulse-ui.css', '/theme.css', '/app.css'],
  },
  view: () => layout({
    content: \`
      <h1>Page not found</h1>
      <p>That page doesn't exist. <a href="/">Back home</a></p>
    \`,
  }),
}`, 'js', ), 'src/pages/not-found.js')}
      <p>The filename doesn't matter — <code>not-found.js</code> is just a readable convention. The <code>route: '*'</code> property is what registers it as the fallback.</p>

      ${callout('tip', 'Every site should have one. The framework\'s default 404 is a bare unstyled page with no navigation — a dead end for visitors and a missed signal for search engines crawling old URLs.')}

      ${section('behaviour', 'How it behaves')}
      ${table(
        ['Aspect', 'Behaviour'],
        [
          ['Status code', 'Always <strong>404</strong> — correct for SEO; crawlers de-index dead URLs'],
          ['Pipeline', 'Full normal render: <code>meta</code>, styles, components, hydration if it has mutations/actions'],
          ['Validation', 'Validated at startup like every spec — a broken 404 page fails fast'],
          ['Matching', 'Only when no other route matches. It is a fallback, not a route — it never shadows real pages'],
          ['Client-side navigation', 'A bad link falls back to a full page load, which renders the custom 404'],
          ['Caching', '404 responses are never stored in the in-process page cache'],
        ]
      )}

      ${section('useful-404', 'Making the 404 useful')}
      <p>The best 404 pages help the visitor recover. Since the page is a normal spec, it can use any component — search, popular links, even server data:</p>
      ${codeBlock(highlight(`export default {
  route: '*',
  meta:  { title: 'Page not found', styles: ['/pulse-ui.css', '/theme.css', '/app.css'] },
  server: {
    popular: async () => getPopularPages(),   // suggest somewhere to go
  },
  view: (state, server) => layout({
    content: \`
      <h1>Page not found</h1>
      <p>Try one of these instead:</p>
      \${list({ items: (server.popular ?? []).map(p => \`<a href="\${p.href}">\${p.title}</a>\`) })}
    \`,
  }),
}`, 'js'))}

      ${section('server-errors', '500s and other errors')}
      <p>Server errors are handled by <code>createServer</code>'s <code>onError</code> option, not a spec — when a render throws, the spec pipeline itself may be the thing that is broken, so the handler works at the HTTP level:</p>
      ${codeBlock(highlight(`await createServer(pages, {
  onError: (err, req, res) => {
    console.error(err)
    if (res.headersSent) return
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>Something went wrong</h1><p><a href="/">Back home</a></p>')
  },
})`, 'js'))}
      <p>For errors thrown inside a <em>view</em> specifically, prefer <code>onViewError</code> on the spec — it returns a 200 with fallback HTML instead of a 500, keeping the page alive when one piece of data is malformed.</p>

      ${callout('note', 'Three layers, three jobs: <code>route: \'*\'</code> for URLs that don\'t exist, <code>onViewError</code> for views that throw on bad data, <code>onError</code> for everything else that goes wrong server-side.')}

      ${section('reference', 'Reference')}
      ${table(
        ['Property', 'Where', 'Notes'],
        [
          ['<code>route: \'*\'</code>', 'spec', 'Custom not-found page — rendered with status 404 when no route matches'],
          ['<code>onViewError</code>', 'spec', 'Fallback HTML when the view throws — returns 200'],
          ['<code>onError</code>', '<code>createServer</code> option', 'HTTP-level handler for unhandled server errors (500s)'],
        ]
      )}
    `,
  }),
}
