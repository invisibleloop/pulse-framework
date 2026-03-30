import fs                      from 'fs'
import { createServer }        from '../src/server/index.js'
import { initLayoutManifest }  from './src/lib/layout.js'
import { metrics }             from './src/lib/stats.js'
import { metricsStore }        from './src/lib/metrics-store.js'
metricsStore.current = metrics

// Populate hashed asset paths in layout.js before any page renders
try {
  const raw = fs.readFileSync(new URL('./public/dist/manifest.json', import.meta.url), 'utf8')
  initLayoutManifest(JSON.parse(raw))
} catch { /* dev: no manifest yet, layout falls back to unhashed paths */ }

await createServer(
  [
    // Framework
    new URL('./src/pages/home.js',              import.meta.url),
    new URL('./src/pages/how-it-works.js',      import.meta.url),
    new URL('./src/pages/faq.js',               import.meta.url),
    new URL('./src/pages/config.js',            import.meta.url),
    new URL('./src/pages/getting-started.js',   import.meta.url),
    new URL('./src/pages/slash-commands.js',    import.meta.url),
    new URL('./src/pages/prompt-examples.js',   import.meta.url),
    new URL('./src/pages/components.js',        import.meta.url),
    new URL('./src/pages/project-structure.js', import.meta.url),
    new URL('./src/pages/spec.js',              import.meta.url),
    // State & Behaviour
    new URL('./src/pages/state.js',             import.meta.url),
    new URL('./src/pages/mutations.js',         import.meta.url),
    new URL('./src/pages/actions.js',           import.meta.url),
    new URL('./src/pages/validation.js',        import.meta.url),
    new URL('./src/pages/constraints.js',       import.meta.url),
    new URL('./src/pages/persist.js',           import.meta.url),
    // Server
    new URL('./src/pages/server-data.js',       import.meta.url),
    new URL('./src/pages/markdown.js',          import.meta.url),
    new URL('./src/pages/store.js',             import.meta.url),
    new URL('./src/pages/routing.js',           import.meta.url),
    new URL('./src/pages/streaming.js',         import.meta.url),
    new URL('./src/pages/caching.js',           import.meta.url),
    new URL('./src/pages/guard.js',             import.meta.url),
    new URL('./src/pages/raw-responses.js',     import.meta.url),
    new URL('./src/pages/server-api.js',        import.meta.url),
    new URL('./src/pages/extending.js',         import.meta.url),
    // Client
    new URL('./src/pages/hydration.js',         import.meta.url),
    new URL('./src/pages/navigation.js',        import.meta.url),
    new URL('./src/pages/images.js',            import.meta.url),
    // Deployment
    new URL('./src/pages/deploy.js',            import.meta.url),
    // Reference
    new URL('./src/pages/meta.js',              import.meta.url),
    new URL('./src/pages/performance.js',       import.meta.url),
    new URL('./src/pages/accessibility.js',     import.meta.url),
    new URL('./src/pages/testing.js',           import.meta.url),
    // Integrations
    new URL('./src/pages/supabase.js',          import.meta.url),
    new URL('./src/pages/auth.js',              import.meta.url),
    new URL('./src/pages/stripe.js',            import.meta.url),
    // UI Components
    new URL('./src/pages/components/alert.js',       import.meta.url),
    new URL('./src/pages/components/avatar.js',      import.meta.url),
    new URL('./src/pages/components/badge.js',       import.meta.url),
    new URL('./src/pages/components/breadcrumbs.js', import.meta.url),
    new URL('./src/pages/components/button.js',      import.meta.url),
    new URL('./src/pages/components/card.js',        import.meta.url),
    new URL('./src/pages/components/checkbox.js',    import.meta.url),
    new URL('./src/pages/components/carousel.js',    import.meta.url),
    new URL('./src/pages/components/charts.js',      import.meta.url),
    new URL('./src/pages/components/empty.js',       import.meta.url),
    new URL('./src/pages/components/fieldset.js',    import.meta.url),
    new URL('./src/pages/components/fileupload.js',  import.meta.url),
    new URL('./src/pages/components/heading.js',     import.meta.url),
    new URL('./src/pages/components/icons.js',       import.meta.url),
    new URL('./src/pages/components/image.js',       import.meta.url),
    new URL('./src/pages/components/input.js',       import.meta.url),
    new URL('./src/pages/components/list.js',        import.meta.url),
    new URL('./src/pages/components/modal.js',       import.meta.url),
    new URL('./src/pages/components/progress.js',    import.meta.url),
    new URL('./src/pages/components/prose.js',       import.meta.url),
    new URL('./src/pages/components/pullquote.js',   import.meta.url),
    new URL('./src/pages/components/radio.js',       import.meta.url),
    new URL('./src/pages/components/rating.js',      import.meta.url),
    new URL('./src/pages/components/search.js',      import.meta.url),
    new URL('./src/pages/components/segmented.js',   import.meta.url),
    new URL('./src/pages/components/select.js',      import.meta.url),
    new URL('./src/pages/components/slider.js',      import.meta.url),
    new URL('./src/pages/components/spinner.js',     import.meta.url),
    new URL('./src/pages/components/stat.js',        import.meta.url),
    new URL('./src/pages/components/stepper.js',     import.meta.url),
    new URL('./src/pages/components/table.js',       import.meta.url),
    new URL('./src/pages/components/textarea.js',    import.meta.url),
    new URL('./src/pages/components/timeline.js',    import.meta.url),
    new URL('./src/pages/components/toggle.js',      import.meta.url),
    new URL('./src/pages/components/tooltip.js',     import.meta.url),
    // Landing Components
    new URL('./src/pages/components/accordion.js',   import.meta.url),
    new URL('./src/pages/components/app-badge.js',   import.meta.url),
    new URL('./src/pages/components/cta.js',         import.meta.url),
    new URL('./src/pages/components/feature.js',     import.meta.url),
    new URL('./src/pages/components/hero.js',        import.meta.url),
    new URL('./src/pages/components/nav.js',         import.meta.url),
    new URL('./src/pages/components/pricing.js',     import.meta.url),
    new URL('./src/pages/components/testimonial.js', import.meta.url),
    // Layout Components
    new URL('./src/pages/components/banner.js',      import.meta.url),
    new URL('./src/pages/components/cluster.js',     import.meta.url),
    new URL('./src/pages/components/code-window.js', import.meta.url),
    new URL('./src/pages/components/container.js',   import.meta.url),
    new URL('./src/pages/components/divider.js',     import.meta.url),
    new URL('./src/pages/components/footer.js',      import.meta.url),
    new URL('./src/pages/components/grid.js',        import.meta.url),
    new URL('./src/pages/components/media.js',       import.meta.url),
    new URL('./src/pages/components/section.js',     import.meta.url),
    new URL('./src/pages/components/stack.js',       import.meta.url),
  ],
  {
    port:         process.env.PORT ? Number(process.env.PORT) : 4000,
    staticDir:    new URL('./public', import.meta.url).pathname,
    root:         new URL('.', import.meta.url),
    defaultCache: true,
    csp: {
      'img-src': ['https://picsum.photos', 'https://images.unsplash.com'],
    },
  }
)
