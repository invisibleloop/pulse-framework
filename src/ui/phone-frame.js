/**
 * Pulse UI — Phone Frame
 *
 * A realistic CSS mobile phone frame. Pass screen content in the `content` slot.
 * Renders the phone body, dynamic island, side buttons, and home indicator.
 * No images — pure CSS/HTML.
 *
 * @param {object}  opts
 * @param {string}  opts.content  - HTML to render inside the screen area
 * @param {boolean} opts.animate  - enable gentle 3-D tilt on mouse hover (default: false)
 * @param {string}  opts.class
 */

export function phoneFrame({ content = '', animate = false, class: cls = '' } = {}) {
  const classes = ['ui-phone', animate && 'ui-phone--tilt', cls].filter(Boolean).join(' ')

  return `<div class="${classes}" role="img" aria-label="Phone screen preview">
  <!-- Left buttons: volume up, volume down, mute -->
  <div class="ui-phone-btn ui-phone-btn--vol-up"   aria-hidden="true"></div>
  <div class="ui-phone-btn ui-phone-btn--vol-down"  aria-hidden="true"></div>
  <div class="ui-phone-btn ui-phone-btn--mute"      aria-hidden="true"></div>
  <!-- Right button: power -->
  <div class="ui-phone-btn ui-phone-btn--power"     aria-hidden="true"></div>

  <div class="ui-phone-inner">
    <!-- Dynamic island -->
    <div class="ui-phone-island" aria-hidden="true">
      <span class="ui-phone-camera"></span>
    </div>

    <!-- Screen -->
    <div class="ui-phone-screen">
      ${content}
    </div>

    <!-- Home indicator -->
    <div class="ui-phone-home" aria-hidden="true"></div>
  </div>
</div>`
}
