/**
 * Pulse Docs — Mobile sidebar menu + demo theme toggles
 * Loaded as an external script so it passes the CSP (no unsafe-inline needed).
 */
(function () {
  // ── Sidebar ──────────────────────────────────────────────────────────────
  var btn     = document.querySelector('.mobile-menu-btn')
  var sidebar = document.querySelector('.docs-sidebar')
  var overlay = document.querySelector('.sidebar-overlay')

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

  // ── Scroll active nav item into view ─────────────────────────────────────
  var navSidebar = document.querySelector('.docs-sidebar')

  function centerNavLink(link) {
    if (!navSidebar || !link) return
    var navRect  = navSidebar.getBoundingClientRect()
    var linkRect = link.getBoundingClientRect()
    navSidebar.scrollTop = navSidebar.scrollTop + (linkRect.top - navRect.top) - navSidebar.clientHeight / 2 + link.clientHeight / 2
  }

  // On initial load — scroll to the currently active link
  var activeLink = navSidebar && navSidebar.querySelector('.nav-link.active')
  if (activeLink) {
    if (document.readyState === 'complete') {
      setTimeout(function () { centerNavLink(activeLink) }, 50)
    } else {
      window.addEventListener('load', function () { centerNavLink(activeLink) })
    }
  }

  // After client-side navigation — #pulse-root is replaced, so the original
  // navSidebar reference is detached. Re-query for the fresh sidebar element.
  document.addEventListener('pulse:navigate', function () {
    navSidebar = document.querySelector('.docs-sidebar')
    var newActive = navSidebar && navSidebar.querySelector('.nav-link.active')
    centerNavLink(newActive)
  })

  // ── Slider fill ──────────────────────────────────────────────────────────
  function updateSliderFill(input) {
    var pct = ((input.value - input.min) / (input.max - input.min) * 100) + '%'
    input.style.setProperty('--slider-fill', pct)
  }

  document.querySelectorAll('.ui-slider').forEach(function (input) {
    input.addEventListener('input', function () { updateSliderFill(this) })
  })

  // ── Demo theme toggles ────────────────────────────────────────────────────
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
})()
