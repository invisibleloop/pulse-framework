import fs                      from 'fs'
import { glob }                from 'glob'
import { createServer }        from '../packages/pulse/src/server/index.js'
import { initLayoutManifest }  from './src/lib/layout.js'
import { metrics }             from './src/lib/stats.js'
import { metricsStore }        from './src/lib/metrics-store.js'
import { NAV }                 from './src/lib/nav.js'
metricsStore.current = metrics

// Build search index once at startup from nav structure
const searchIndex = JSON.stringify(
  NAV.flatMap(({ section, items }) =>
    items.map(item => ({ title: item.label, href: item.href, section, body: '' }))
  )
)
const searchIndexEtag = `"${Buffer.from(searchIndex).length}-search"`

// Populate hashed asset paths in layout.js before any page renders
try {
  const raw = fs.readFileSync(new URL('./public/dist/manifest.json', import.meta.url), 'utf8')
  initLayoutManifest(JSON.parse(raw))
} catch { /* dev: no manifest yet, layout falls back to unhashed paths */ }

// Auto-discover all spec files in src/pages/
const pageDir = new URL('./src/pages/', import.meta.url).pathname
const pageFiles = await glob('**/*.js', {
  cwd: pageDir,
  ignore: ['lib/**', '*.test.js']
})

const specs = pageFiles.map(file =>
  new URL(`./src/pages/${file}`, import.meta.url)
)

await createServer(
  specs,
  {
    port:         process.env.PORT ? Number(process.env.PORT) : 4000,
    staticDir:    new URL('./public', import.meta.url).pathname,
    root:         new URL('.', import.meta.url),
    defaultCache: true,
    csp: {
      'img-src':    ['https://picsum.photos', 'https://fastly.picsum.photos', 'https://images.unsplash.com'],
      'script-src': ['https://quietlytics.app'],
      'style-src':  ['https://fonts.googleapis.com', 'https://unpkg.com'],
      'font-src':   ['https://fonts.gstatic.com'],
      'connect-src': ['https://quietlytics.app'],
    },
    onRequest(req, res) {
      if (req.url !== '/search-index.json') return
      if (req.headers['if-none-match'] === searchIndexEtag) {
        res.writeHead(304)
        res.end()
        return false
      }
      res.writeHead(200, {
        'Content-Type':  'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'ETag':          searchIndexEtag,
      })
      res.end(searchIndex)
      return false
    },
  }
)
