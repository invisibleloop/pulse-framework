/**
 * Pulse Docs — Mobile sidebar menu, search, and demo theme toggles
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

  // ── Sidebar nav filter ────────────────────────────────────────────────────

  function initSidebarSearch(sidebar) {
    var input    = sidebar && sidebar.querySelector('#sidebar-search')
    var nav      = sidebar && sidebar.querySelector('#sidebar-nav')
    var noResult = sidebar && sidebar.querySelector('.sidebar-no-results')
    if (!input || !nav || input._searchBound) return
    input._searchBound = true

    function filter(q) {
      var query = q.trim().toLowerCase()
      var sections = nav.querySelectorAll('.nav-section')
      var anyVisible = false

      if (!query) {
        sections.forEach(function (s) {
          s.hidden = false
          s.querySelectorAll('.nav-link').forEach(function (l) { l.hidden = false })
        })
        if (noResult) noResult.hidden = true
        return
      }

      sections.forEach(function (section) {
        var sectionLinks = section.querySelectorAll('.nav-link')
        var sectionHasMatch = false
        sectionLinks.forEach(function (link) {
          var matches = link.textContent.toLowerCase().includes(query)
          link.hidden = !matches
          if (matches) { sectionHasMatch = true; anyVisible = true }
        })
        section.hidden = !sectionHasMatch
      })

      if (noResult) noResult.hidden = anyVisible
    }

    input.addEventListener('input', function () { filter(this.value) })

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        input.value = ''
        filter('')
        input.blur()
      }
    })
  }

  // ── Full-text search overlay ──────────────────────────────────────────────

  var _searchIndex = null

  function loadSearchIndex(cb) {
    if (_searchIndex) { cb(_searchIndex); return }
    fetch('/search-index.json')
      .then(function (r) { return r.json() })
      .then(function (data) { _searchIndex = data; cb(data) })
      .catch(function () { cb([]) })
  }

  function searchIndex(query, index) {
    var q = query.trim().toLowerCase()
    if (!q) return []
    return index.filter(function (item) {
      return item.title.toLowerCase().includes(q) ||
             item.section.toLowerCase().includes(q) ||
             (item.body && item.body.toLowerCase().includes(q))
    }).slice(0, 12)
  }

  function highlight(text, query) {
    if (!query) return text
    var re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi')
    return text.replace(re, '<mark>$1</mark>')
  }

  function snippet(body, query) {
    if (!body || !query) return ''
    var idx = body.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return ''
    var start = Math.max(0, idx - 40)
    var end   = Math.min(body.length, idx + query.length + 80)
    var s = (start > 0 ? '…' : '') + body.slice(start, end) + (end < body.length ? '…' : '')
    return highlight(s, query)
  }

  function renderResults(results, query, container, selectedIdx) {
    while (container.firstChild) container.removeChild(container.firstChild)

    if (!results.length) {
      var empty = document.createElement('p')
      empty.className = 'search-overlay-empty'
      empty.textContent = 'No results for '
      var strong = document.createElement('strong')
      strong.textContent = query
      empty.appendChild(strong)
      container.appendChild(empty)
      return
    }

    results.forEach(function (item, i) {
      var a = document.createElement('a')
      a.href = item.href
      a.className = 'search-result' + (i === selectedIdx ? ' search-result--selected' : '')
      a.setAttribute('role', 'option')
      if (i === selectedIdx) a.setAttribute('aria-selected', 'true')

      var meta = document.createElement('div')
      meta.className = 'search-result-meta'
      var section = document.createElement('span')
      section.className = 'search-result-section'
      section.textContent = item.section
      meta.appendChild(section)
      a.appendChild(meta)

      var title = document.createElement('div')
      title.className = 'search-result-title'
      setHighlighted(title, item.title, query)
      a.appendChild(title)

      var snip = snippet(item.body, query)
      if (snip) {
        var snipEl = document.createElement('div')
        snipEl.className = 'search-result-snip'
        setHighlighted(snipEl, snip, null) // snip already has highlight markers stripped
        a.appendChild(snipEl)
      }

      container.appendChild(a)
    })
  }

  function setHighlighted(el, text, query) {
    if (!query) { el.textContent = text; return }
    var lower = text.toLowerCase()
    var q = query.toLowerCase()
    var idx = lower.indexOf(q)
    if (idx === -1) { el.textContent = text; return }
    var before = document.createTextNode(text.slice(0, idx))
    var mark = document.createElement('mark')
    mark.textContent = text.slice(idx, idx + query.length)
    var after = document.createTextNode(text.slice(idx + query.length))
    el.appendChild(before)
    el.appendChild(mark)
    el.appendChild(after)
  }

  function initSearchOverlay() {
    var overlay   = document.getElementById('search-overlay')
    var input     = document.getElementById('search-overlay-input')
    var results   = document.getElementById('search-overlay-results')
    var fullBtns  = document.querySelectorAll('.sidebar-search-full')
    if (!overlay || !input || !results) return

    var selectedIdx = -1
    var currentResults = []
    var currentQuery = ''

    function open() {
      overlay.hidden = false
      document.body.style.overflow = 'hidden'
      setTimeout(function () { input.focus() }, 50)
      selectedIdx = -1
    }

    function close() {
      overlay.hidden = true
      document.body.style.overflow = ''
      input.value = ''
      results.innerHTML = ''
      currentResults = []
      currentQuery = ''
      selectedIdx = -1
    }

    function navigate(dir) {
      selectedIdx = Math.max(-1, Math.min(currentResults.length - 1, selectedIdx + dir))
      renderResults(currentResults, currentQuery, results, selectedIdx)
      var sel = results.querySelector('.search-result--selected')
      if (sel) sel.scrollIntoView({ block: 'nearest' })
    }

    fullBtns.forEach(function (btn) { btn.addEventListener('click', open) })

    overlay.querySelector('.search-overlay-backdrop').addEventListener('click', close)
    overlay.querySelector('.search-overlay-close').addEventListener('click', close)

    input.addEventListener('input', function () {
      var q = this.value.trim()
      currentQuery = q
      selectedIdx = -1
      if (!q) { results.innerHTML = ''; currentResults = []; return }
      loadSearchIndex(function (index) {
        currentResults = searchIndex(q, index)
        renderResults(currentResults, q, results, selectedIdx)
      })
    })

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); navigate(1); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); navigate(-1); return }
      if (e.key === 'Enter') {
        if (selectedIdx >= 0 && currentResults[selectedIdx]) {
          window.location.href = currentResults[selectedIdx].href
          close()
        }
      }
    })

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        overlay.hidden ? open() : close()
      }
      if (e.key === 'Escape' && !overlay.hidden) close()
    })
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

    // Sidebar filter
    initSidebarSearch(sidebar)

    // Full-text search overlay (only bind once — overlay persists across navigations)
    if (!document.getElementById('search-overlay')?._searchBound) {
      initSearchOverlay()
      var o = document.getElementById('search-overlay')
      if (o) o._searchBound = true
    }
  }

  // On initial load — defer slightly to ensure layout paint before scrolling.
  // Use both paths: if load already fired (common with defer scripts), run now;
  // otherwise wait for it.
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 50)
  } else {
    window.addEventListener('load', function () { setTimeout(init, 50) })
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

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(bindDemoControls, 50)
  } else {
    window.addEventListener('load', function () { setTimeout(bindDemoControls, 50) })
  }
})()
