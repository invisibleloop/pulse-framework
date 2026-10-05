/**
 * pulse-ui.js — Vanilla JS for interactive Pulse UI components
 *
 * Handles:
 *   - Slider     (.ui-slider — live fill + value output)
 *   - File Upload (.ui-upload — drag-and-drop, click-to-open)
 *   - Modal      (data-modal-open, <dialog>, backdrop close)
 *   - Nav        (.ui-nav — mobile burger menu)
 *   - Carousel   (.ui-carousel — prev/next/dots)
 *
 * No dependencies. No build step required.
 * CSP-safe: no inline handlers — all behaviour via event delegation.
 * Include once per page: <script src="/pulse-ui.js"></script>
 */

// ─── Slider ──────────────────────────────────────────────────────────────────
// Update --slider-fill on .ui-field wrapper + optional live value output.

document.addEventListener('input', (e) => {
  const el = e.target
  if (!el.classList.contains('ui-slider')) return
  const field = el.closest('.ui-field')
  if (!field) return
  const pct = ((el.value - el.min) / (el.max - el.min) * 100).toFixed(2) + '%'
  field.style.setProperty('--slider-fill', pct)
  const out = field.querySelector('.ui-slider-output')
  if (out) out.textContent = el.value
})

// ─── File Upload ─────────────────────────────────────────────────────────────
// Prevent browser navigating to dropped file anywhere on the page.
// Handle drag visual feedback + file assignment on drop.
// Handle click-to-open and keyboard activation.

document.addEventListener('dragover', (e) => {
  e.preventDefault()
  if (!(e.target instanceof Element)) return
  const zone = e.target.closest('.ui-upload:not(.ui-upload--disabled)')
  if (zone) zone.classList.add('ui-upload--active')
})

document.addEventListener('dragleave', (e) => {
  if (!(e.target instanceof Element)) return
  const zone = e.target.closest('.ui-upload')
  if (zone && !zone.contains(e.relatedTarget)) {
    zone.classList.remove('ui-upload--active')
  }
})

document.addEventListener('drop', (e) => {
  e.preventDefault()
  if (!(e.target instanceof Element)) return
  const zone = e.target.closest('.ui-upload:not(.ui-upload--disabled)')
  if (!zone) return
  zone.classList.remove('ui-upload--active')
  const input = zone.querySelector('.ui-upload-input')
  if (!input || !e.dataTransfer.files.length) return
  const dt = new DataTransfer()
  Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f))
  input.files = dt.files
  input.dispatchEvent(new Event('change', { bubbles: true }))
})

// File Upload: show selected filename in zone after file chosen
document.addEventListener('change', (e) => {
  const input = e.target
  if (!input.classList.contains('ui-upload-input')) return
  const zone = input.closest('.ui-upload')
  if (!zone) return
  const textEl = zone.querySelector('.ui-upload-text')
  if (!textEl) return
  if (input.files && input.files.length > 0) {
    const names = Array.from(input.files).map(f => f.name).join(', ')
    textEl.textContent = names
    zone.classList.add('ui-upload--selected')
  } else {
    textEl.innerHTML = 'Drag &amp; drop or <span class="ui-upload-browse">browse</span>'
    zone.classList.remove('ui-upload--selected')
  }
})

// ─── Modal ──────────────────────────────────────────────────────────────────

document.addEventListener('click', (e) => {
  // File upload: click zone → open file picker
  // Skip synthetic clicks emitted by input.click() itself to avoid loops
  if (!e.target.classList.contains('ui-upload-input')) {
    const zone = e.target.closest('.ui-upload')
    if (zone) {
      const input = zone.querySelector('.ui-upload-input')
      if (input && !input.disabled) { input.click(); return }
    }
  }

  // Dialog open: data-dialog-open="dialogId" (first-class) or data-modal-open="dialogId" (compat)
  const trigger = e.target.closest('[data-dialog-open],[data-modal-open]')
  if (trigger) {
    const id     = trigger.dataset.dialogOpen ?? trigger.dataset.modalOpen
    const dialog = document.getElementById(id)
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal()
    }
    return
  }

  // Dialog close: data-dialog-close (closes nearest ancestor <dialog>)
  const closeTarget = e.target.closest('[data-dialog-close]')
  if (closeTarget) {
    const dialog = closeTarget.closest('dialog')
    if (dialog) dialog.close()
    return
  }

  // Backdrop close — click lands on <dialog> element itself
  if (e.target.tagName === 'DIALOG') {
    e.target.close()
  }
})

// File upload: Enter / Space on focused zone → open picker
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  const zone = e.target.closest('.ui-upload')
  if (!zone) return
  const input = zone.querySelector('.ui-upload-input')
  if (input && !input.disabled) { e.preventDefault(); input.click() }
})

// ─── Nav (mobile burger) ────────────────────────────────────────────────────

function initNav(el) {
  if (el.dataset.pulseNavInit) return
  el.dataset.pulseNavInit = '1'

  const burger = el.querySelector('.ui-nav-burger')
  const mobile = el.querySelector('.ui-nav-mobile')

  // Mobile burger
  if (burger && mobile) {
    const open   = () => { el.classList.add('ui-nav--open');    burger.setAttribute('aria-expanded', 'true') }
    const close  = () => { el.classList.remove('ui-nav--open'); burger.setAttribute('aria-expanded', 'false') }
    const toggle = () => el.classList.contains('ui-nav--open') ? close() : open()

    burger.addEventListener('click', toggle)
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
    document.addEventListener('click',   (e) => { if (!el.contains(e.target)) close() })
    mobile.querySelectorAll('.ui-nav-link').forEach(a => a.addEventListener('click', close))
  }

  // Mega nav dropdowns
  el.querySelectorAll('.ui-nav-mega-wrap').forEach(wrap => {
    const trigger = wrap.querySelector('.ui-nav-mega-trigger')
    const panel   = wrap.querySelector('.ui-nav-mega-panel')
    if (!trigger || !panel) return

    const openMega  = () => { panel.hidden = false; wrap.classList.add('ui-nav-mega-wrap--open');    trigger.setAttribute('aria-expanded', 'true') }
    const closeMega = () => { panel.hidden = true;  wrap.classList.remove('ui-nav-mega-wrap--open'); trigger.setAttribute('aria-expanded', 'false') }
    const toggleMega = () => panel.hidden ? openMega() : closeMega()

    trigger.addEventListener('click', (e) => { e.stopPropagation(); toggleMega() })
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMega() })
    document.addEventListener('click',   (e) => { if (!wrap.contains(e.target)) closeMega() })
    panel.querySelectorAll('.ui-nav-mega-item').forEach(a => a.addEventListener('click', closeMega))
  })
}

function runNavs() { document.querySelectorAll('.ui-nav').forEach(initNav) }
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', runNavs)
  : runNavs()
document.addEventListener('pulse:navigate', runNavs)

// ─── Carousel ───────────────────────────────────────────────────────────────

function initCarousel(el) {
  if (el.dataset.pulseCarouselInit) return
  el.dataset.pulseCarouselInit = '1'

  const track  = el.querySelector('.ui-carousel-track')
  const prev   = el.querySelector('.ui-carousel-prev')
  const next   = el.querySelector('.ui-carousel-next')
  const dots   = Array.from(el.querySelectorAll('.ui-carousel-dot'))
  const slides = Array.from(el.querySelectorAll('.ui-carousel-slide'))

  if (!track || slides.length === 0) return

  let current = 0

  const updateArrows = () => {
    if (prev) prev.hidden = current === 0
    if (next) next.hidden = current === slides.length - 1
  }

  const goTo = (i) => {
    current = Math.max(0, Math.min(i, slides.length - 1))
    track.scrollTo({ left: slides[current].offsetLeft, behavior: 'smooth' })
    dots.forEach((d, j) => {
      const active = j === current
      d.classList.toggle('active', active)
      d.setAttribute('aria-selected', String(active))
      d.setAttribute('tabindex', active ? '0' : '-1')
    })
    updateArrows()
  }

  prev?.addEventListener('click', () => goTo(current - 1))
  next?.addEventListener('click', () => goTo(current + 1))
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)))

  // Keyboard navigation — roving tabindex for tablist
  el.addEventListener('keydown', (e) => {
    if (!e.target.classList.contains('ui-carousel-dot')) return
    let next = null
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      next = current > 0 ? current - 1 : slides.length - 1
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      next = current < slides.length - 1 ? current + 1 : 0
    } else if (e.key === 'Home') {
      e.preventDefault()
      next = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      next = slides.length - 1
    }
    if (next !== null) {
      goTo(next)
      dots[next]?.focus()
    }
  })

  // Sync dot state and arrows when user swipes / scrolls
  track.addEventListener('scroll', () => {
    const trackLeft = track.getBoundingClientRect().left
    const idx = slides.findIndex((s) => Math.abs(s.getBoundingClientRect().left - trackLeft) < 10)
    if (idx !== -1 && idx !== current) {
      current = idx
      dots.forEach((d, j) => {
        const active = j === current
        d.classList.toggle('active', active)
        d.setAttribute('aria-selected', String(active))
        d.setAttribute('tabindex', active ? '0' : '-1')
      })
      updateArrows()
    }
  }, { passive: true })
}

// Initialise all carousels on the page
const run = () => document.querySelectorAll('.ui-carousel').forEach(initCarousel)
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', run)
  : run()

// Re-initialise after Pulse client-side navigation swaps the DOM
document.addEventListener('pulse:navigate', run)
