/**
 * Pulse Docs — Mobile sidebar menu + demo theme toggles
 * Loaded as an external script so it passes the CSP (no unsafe-inline needed).
 */
(function () {
  // ── Scroll active nav item into view ─────────────────────────────────────

  function centerNavLink(sidebar, link) {
    if (!sidebar || !link) return
    var navRect  = sidebar.getBoundingClientRect()
    var linkRect = link.getBoundingClientRect()
    sidebar.scrollTop = sidebar.scrollTop + (linkRect.top - navRect.top) - sidebar.clientHeight / 2 + link.clientHeight / 2
  }

  // ── Bind sidebar, mobile menu, and centre the active link ─────────────────
  // Called on first load and after every client-side navigation, because
  // #pulse-root is replaced on navigate — all element references go stale.

  function init() {
    var sidebar = document.querySelector('.docs-sidebar')
    var btn     = document.querySelector('.mobile-menu-btn')
    var overlay = document.querySelector('.sidebar-overlay')

    // Mobile open/close
    if (btn && sidebar) {
      function open() {
        sidebar.classList.add('open')
        overlay && overlay.classList.add('visible')
        document.body.style.overflow = 'hidden'
      }

      function close() {
        sidebar.classList.remove('open')
        overlay && overlay.classList.remove('visible')
        document.body.style.overflow = ''
      }

      btn.addEventListener('click', function () {
        sidebar.classList.contains('open') ? close() : open()
      })

      overlay && overlay.addEventListener('click', close)

      sidebar.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', close)
      })
    }

    // Centre the active link
    var activeLink = sidebar && sidebar.querySelector('.nav-link.active')
    if (activeLink) centerNavLink(sidebar, activeLink)
  }

  // On initial load — wait for layout paint before scrolling
  if (document.readyState === 'complete') {
    setTimeout(init, 50)
  } else {
    window.addEventListener('load', init)
  }

  // After client-side navigation — re-bind everything against the fresh DOM
  document.addEventListener('pulse:navigate', init)

  // ── Slider fill ──────────────────────────────────────────────────────────
  function updateSliderFill(input) {
    var pct = ((input.value - input.min) / (input.max - input.min) * 100) + '%'
    input.style.setProperty('--slider-fill', pct)
  }

  function bindDemoControls() {
    document.querySelectorAll('.ui-slider').forEach(function (input) {
      input.addEventListener('input', function () { updateSliderFill(this) })
    })

    // ── Demo theme toggles ──────────────────────────────────────────────────
    document.querySelectorAll('.demo-theme-toggle').forEach(function (toggle) {
      var preview = toggle.closest('.demo-preview')
      if (!preview) return
      toggle.addEventListener('click', function () {
        var isLight = preview.classList.toggle('is-light')
        var inner   = preview.querySelector('.demo-preview-inner')
        if (inner) {
          inner.classList.toggle('ui-theme-light', isLight)
        }
      })
    })
  }

  document.addEventListener('pulse:navigate', bindDemoControls)

  if (document.readyState === 'complete') {
    setTimeout(bindDemoControls, 50)
  } else {
    window.addEventListener('load', bindDemoControls)
  }
})()
