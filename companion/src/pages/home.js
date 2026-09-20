import { section, card, alert, stat, table, empty, badge } from '../../../packages/pulse/src/ui/index.js'

function timeAgo(iso) {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const s  = Math.floor(ms / 1000)
  if (s < 5)    return 'just now'
  if (s < 60)   return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60)   return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)   return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function errorsPanel(errors) {
  const unresolved = errors.filter(e => !e.resolved)
  if (errors.length === 0) {
    return empty({
      title:       'No errors recorded',
      description: 'Nothing has thrown in this project’s dev server yet.',
    })
  }
  return table({
    headers: ['When', 'Route', 'Phase', 'Message', 'Status'],
    rows: errors.slice().reverse().slice(0, 20).map(e => [
      timeAgo(e.ts),
      e.route || '—',
      e.phase || '—',
      e.message || '',
      e.resolved ? badge({ label: 'resolved', variant: 'default' }) : badge({ label: 'open', variant: 'danger' }),
    ]),
  }) + (unresolved.length > 0
    ? alert({ variant: 'warning', content: `${unresolved.length} unresolved error${unresolved.length === 1 ? '' : 's'}` })
    : '')
}

function lighthousePanel(lighthouse) {
  const slugs = Object.keys(lighthouse)
  if (slugs.length === 0) {
    return empty({
      title:       'No Lighthouse reports yet',
      description: 'Run /verify or a Lighthouse audit in your project to see scores here.',
    })
  }
  return slugs.map(slug => {
    const reports = lighthouse[slug]
    const latest  = reports[reports.length - 1]
    return card({
      title: slug,
      content: `
        <div class="lh-stats">
          ${stat({ label: 'Accessibility', value: String(latest.scores?.accessibility ?? '—'), size: 'sm' })}
          ${stat({ label: 'Best Practices', value: String(latest.scores?.bestPractices ?? '—'), size: 'sm' })}
          ${stat({ label: 'SEO', value: String(latest.scores?.seo ?? '—'), size: 'sm' })}
          ${stat({ label: 'Performance', value: String(latest.scores?.performance ?? '—'), size: 'sm' })}
        </div>
        <p class="lh-meta">Last run ${timeAgo(latest.timestamp)} · ${reports.length} report${reports.length === 1 ? '' : 's'} in the last 30 days</p>
      `,
    })
  }).join('')
}

function loadTestPanel(loadTests) {
  const slugs = Object.keys(loadTests)
  if (slugs.length === 0) {
    return empty({
      title:       'No load test reports yet',
      description: 'Run a load test in your project to see throughput and latency here.',
    })
  }
  return slugs.map(slug => {
    const reports = loadTests[slug]
    const latest  = reports[reports.length - 1]
    return card({
      title: slug,
      content: `
        <div class="lh-stats">
          ${stat({ label: 'Requests/sec', value: String(Math.round(latest.rps ?? 0)), size: 'sm' })}
          ${stat({ label: 'p50 latency', value: `${latest.latency?.p50 ?? '—'}ms`, size: 'sm' })}
          ${stat({ label: 'p99 latency', value: `${latest.latency?.p99 ?? '—'}ms`, size: 'sm' })}
          ${stat({ label: 'Errors', value: String(latest.requests?.errors ?? 0), size: 'sm' })}
        </div>
        <p class="lh-meta">Last run ${timeAgo(latest.timestamp)} · ${reports.length} report${reports.length === 1 ? '' : 's'} in the last 30 days</p>
      `,
    })
  }).join('')
}

export default {
  route: '/',
  meta: {
    title:       'Pulse Companion',
    description: 'Live dashboard for a local Pulse project — dev errors, Lighthouse scores, and load test history.',
    theme:       'dark',
    styles:      ['/pulse-ui.css', '/app.css'],
  },
  store: ['projectRoot', 'errors', 'lighthouse', 'loadTests', 'lastUpdated'],
  state: {},
  view: (state, server) => `
    <main id="main-content">
      <header class="companion-header">
        <h1>Pulse Companion</h1>
        <p class="companion-sub">${server.projectRoot || 'no project'} · updated ${timeAgo(server.lastUpdated)}</p>
      </header>

      ${section({
        eyebrow: 'DEV ERRORS',
        title:   'Error journal',
        content: errorsPanel(server.errors || []),
      })}

      ${section({
        eyebrow: 'PERFORMANCE',
        title:   'Lighthouse',
        content: lighthousePanel(server.lighthouse || {}),
      })}

      ${section({
        eyebrow: 'LOAD TESTING',
        title:   'Throughput & latency',
        content: loadTestPanel(server.loadTests || {}),
      })}
    </main>
  `,
}
