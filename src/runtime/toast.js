/**
 * Pulse — Toast / notification system
 *
 * Triggered by returning `_toast` from any action lifecycle hook or mutation.
 * The container is injected into document.body once and survives page navigations.
 *
 * Usage:
 *   onSuccess: (state, result) => ({
 *     saved: true,
 *     _toast: { message: 'Saved!', variant: 'success' }
 *   })
 *
 * _toast options:
 *   message  {string}                              — required
 *   variant  {'success'|'error'|'warning'|'info'}  — default 'info'
 *   duration {number}                              — ms before auto-dismiss, default 4000. 0 = no auto-dismiss.
 */

const CONTAINER_ID = 'pulse-toasts'
const MAX_TOASTS   = 5
const VARIANTS     = new Set(['success', 'error', 'warning', 'info'])

// ---------------------------------------------------------------------------
// CSS — injected once, overridable via .pulse-toast classes in app CSS
// ---------------------------------------------------------------------------

const TOAST_CSS = `
#pulse-toasts {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: .5rem;
  pointer-events: none;
  max-width: min(24rem, calc(100vw - 2rem));
}
.pulse-toast {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  padding: .75rem 1rem;
  border-radius: .5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,.2);
  font-size: .875rem;
  line-height: 1.4;
  pointer-events: all;
  opacity: 0;
  transform: translateX(calc(100% + 1.5rem));
  transition: opacity .2s ease, transform .2s ease;
  background: #1e293b;
  color: #f8fafc;
}
.pulse-toast--visible {
  opacity: 1;
  transform: translateX(0);
}
.pulse-toast--success { background: #166534; }
.pulse-toast--error   { background: #991b1b; }
.pulse-toast--warning { background: #92400e; }
.pulse-toast-message  { flex: 1; }
.pulse-toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0 0 0 .25rem;
  font-size: 1.125rem;
  line-height: 1;
  opacity: .7;
  flex-shrink: 0;
}
.pulse-toast-close:hover { opacity: 1; }
`

let _stylesInjected = false

function injectStyles() {
  if (_stylesInjected) return
  _stylesInjected = true
  const style = document.createElement('style')
  // Apply the page nonce so the style tag passes the style-src CSP directive.
  const nonce = typeof window !== 'undefined' && window.__PULSE_NONCE__
  if (nonce) style.setAttribute('nonce', nonce)
  style.textContent = TOAST_CSS
  document.head.appendChild(style)
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

function getContainer() {
  let container = document.getElementById(CONTAINER_ID)
  if (!container) {
    injectStyles()
    container = document.createElement('div')
    container.id = CONTAINER_ID
    container.setAttribute('aria-live', 'polite')
    container.setAttribute('aria-atomic', 'false')
    document.body.appendChild(container)
  }
  return container
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Show a toast notification.
 *
 * @param {Object|string} options
 * @param {string}  options.message
 * @param {'success'|'error'|'warning'|'info'} [options.variant='info']
 * @param {number}  [options.duration=4000]  ms before auto-dismiss; 0 = sticky
 */
export function showToast(options) {
  if (typeof document === 'undefined') return  // no-op in SSR/test environments

  const { message, variant = 'info', duration = 4000 } =
    typeof options === 'string' ? { message: options } : options

  if (!message) return

  const safeVariant = VARIANTS.has(variant) ? variant : 'info'
  const container   = getContainer()

  // Evict oldest toast if at the limit
  while (container.children.length >= MAX_TOASTS) {
    container.firstElementChild?.remove()
  }

  // Build toast element
  const toast   = document.createElement('div')
  toast.className = `pulse-toast pulse-toast--${safeVariant}`
  toast.setAttribute('role', 'status')

  const msg = document.createElement('span')
  msg.className   = 'pulse-toast-message'
  msg.textContent = message  // safe — textContent, no innerHTML

  const close = document.createElement('button')
  close.className  = 'pulse-toast-close'
  close.setAttribute('aria-label', 'Dismiss notification')
  close.textContent = '×'
  close.addEventListener('click', () => dismiss(toast))

  toast.appendChild(msg)
  toast.appendChild(close)
  container.appendChild(toast)

  // Animate in on next frame
  requestAnimationFrame(() => toast.classList.add('pulse-toast--visible'))

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => dismiss(toast), duration)
  }
}

function dismiss(toast) {
  toast.classList.remove('pulse-toast--visible')
  toast.addEventListener('transitionend', () => toast.remove(), { once: true })
}
