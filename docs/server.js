import { createServer }   from '../src/server/index.js'
import { metrics }        from './src/lib/stats.js'
import { metricsStore }   from './src/lib/metrics-store.js'
metricsStore.current = metrics
import home               from './src/pages/home.js'
import howItWorks        from './src/pages/how-it-works.js'
import faq               from './src/pages/faq.js'
import config             from './src/pages/config.js'
import gettingStarted     from './src/pages/getting-started.js'
import slashCommands      from './src/pages/slash-commands.js'
import promptExamples     from './src/pages/prompt-examples.js'
import components         from './src/pages/components.js'
import projectStructure   from './src/pages/project-structure.js'
import spec               from './src/pages/spec.js'
import state              from './src/pages/state.js'
import mutations          from './src/pages/mutations.js'
import actions            from './src/pages/actions.js'
import validation         from './src/pages/validation.js'
import constraints        from './src/pages/constraints.js'
import persist            from './src/pages/persist.js'
import serverData         from './src/pages/server-data.js'
import routing            from './src/pages/routing.js'
import streaming          from './src/pages/streaming.js'
import caching            from './src/pages/caching.js'
import guard              from './src/pages/guard.js'
import rawResponses       from './src/pages/raw-responses.js'
import serverApi          from './src/pages/server-api.js'
import hydration          from './src/pages/hydration.js'
import navigation         from './src/pages/navigation.js'
import images             from './src/pages/images.js'
import extending          from './src/pages/extending.js'
import deploy             from './src/pages/deploy.js'
import supabase           from './src/pages/supabase.js'
import auth               from './src/pages/auth.js'
import stripe             from './src/pages/stripe.js'
import meta               from './src/pages/meta.js'
import performance        from './src/pages/performance.js'
import accessibility      from './src/pages/accessibility.js'
import testing           from './src/pages/testing.js'

// Component pages
import compButton      from './src/pages/components/button.js'
import compBadge       from './src/pages/components/badge.js'
import compCard        from './src/pages/components/card.js'
import compInput       from './src/pages/components/input.js'
import compSelect      from './src/pages/components/select.js'
import compTextarea    from './src/pages/components/textarea.js'
import compAlert       from './src/pages/components/alert.js'
import compStat        from './src/pages/components/stat.js'
import compAvatar      from './src/pages/components/avatar.js'
import compEmpty       from './src/pages/components/empty.js'
import compTable       from './src/pages/components/table.js'
import compNav         from './src/pages/components/nav.js'
import compHero        from './src/pages/components/hero.js'
import compAppBadge    from './src/pages/components/app-badge.js'
import compFeature     from './src/pages/components/feature.js'
import compTestimonial from './src/pages/components/testimonial.js'
import compPricing     from './src/pages/components/pricing.js'
import compAccordion   from './src/pages/components/accordion.js'
import compContainer   from './src/pages/components/container.js'
import compSection     from './src/pages/components/section.js'
import compGrid        from './src/pages/components/grid.js'
import compStack       from './src/pages/components/stack.js'
import compCluster     from './src/pages/components/cluster.js'
import compDivider     from './src/pages/components/divider.js'
import compBanner      from './src/pages/components/banner.js'
import compMedia       from './src/pages/components/media.js'
import compTooltip     from './src/pages/components/tooltip.js'
import compModal       from './src/pages/components/modal.js'
import compCarousel    from './src/pages/components/carousel.js'
import compCta         from './src/pages/components/cta.js'
import compFooter      from './src/pages/components/footer.js'
import compCodeWindow  from './src/pages/components/code-window.js'
import compFieldset    from './src/pages/components/fieldset.js'
import compToggle      from './src/pages/components/toggle.js'
import compCheckbox    from './src/pages/components/checkbox.js'
import compFileUpload  from './src/pages/components/fileupload.js'
import compSlider      from './src/pages/components/slider.js'
import compSegmented   from './src/pages/components/segmented.js'
import compRadio       from './src/pages/components/radio.js'
import compRating      from './src/pages/components/rating.js'
import compSearch      from './src/pages/components/search.js'
import compSpinner     from './src/pages/components/spinner.js'
import compProgress    from './src/pages/components/progress.js'
import compBreadcrumbs from './src/pages/components/breadcrumbs.js'
import compStepper     from './src/pages/components/stepper.js'
import compImage       from './src/pages/components/image.js'
import compPullquote   from './src/pages/components/pullquote.js'
import compProse       from './src/pages/components/prose.js'
import compHeading     from './src/pages/components/heading.js'
import compList        from './src/pages/components/list.js'
import compTimeline    from './src/pages/components/timeline.js'
import compCharts      from './src/pages/components/charts.js'
import compIcons       from './src/pages/components/icons.js'

createServer(
  [
    home,
    howItWorks,
    faq,
    config,
    gettingStarted,
    slashCommands,
    promptExamples,
    components,
    projectStructure,
    spec,
    state,
    mutations,
    actions,
    validation,
    constraints,
    persist,
    serverData,
    routing,
    streaming,
    caching,
    guard,
    rawResponses,
    serverApi,
    hydration,
    navigation,
    images,
    extending,
    deploy,
    supabase,
    auth,
    stripe,
    meta,
    performance,
    accessibility,
    testing,
    // Component pages
    compButton,
    compBadge,
    compCard,
    compInput,
    compSelect,
    compTextarea,
    compAlert,
    compStat,
    compAvatar,
    compEmpty,
    compTable,
    compNav,
    compHero,
    compAppBadge,
    compFeature,
    compTestimonial,
    compPricing,
    compAccordion,
    compContainer,
    compSection,
    compGrid,
    compStack,
    compCluster,
    compDivider,
    compBanner,
    compMedia,
    compTooltip,
    compModal,
    compCarousel,
    compCta,
    compFooter,
    compCodeWindow,
    compFieldset,
    compToggle,
    compCheckbox,
    compFileUpload,
    compSlider,
    compSegmented,
    compRadio,
    compRating,
    compSearch,
    compSpinner,
    compProgress,
    compBreadcrumbs,
    compStepper,
    compImage,
    compPullquote,
    compProse,
    compHeading,
    compList,
    compTimeline,
    compCharts,
    compIcons,
  ],
  {
    port:         process.env.PORT ? Number(process.env.PORT) : 4000,
    staticDir:    new URL('./public', import.meta.url).pathname,
    defaultCache: true,
  }
)
