/**
 * Pulse — Image helper types
 * @invisibleloop/pulse/image
 */

export interface ImgOptions {
  /** Image URL */
  src:       string
  /** Alt text (required for accessibility) */
  alt:       string
  /** Intrinsic width in px — include to prevent CLS */
  width?:    number
  /** Intrinsic height in px — include to prevent CLS */
  height?:   number
  /**
   * Set true for the LCP image (above-the-fold hero).
   * Adds loading="eager" and fetchpriority="high".
   */
  priority?: boolean
  /** CSS class applied to <img> */
  class?:    string
}

export interface PictureSource {
  /** URL for this format variant */
  src:  string
  /** MIME type, e.g. 'image/avif', 'image/webp' */
  type: string
}

export interface PictureOptions extends ImgOptions {
  /**
   * Modern format sources in preference order (AVIF first, then WebP).
   * The src on ImgOptions is the universal fallback (JPEG/PNG).
   *
   * @example
   * sources: [
   *   { src: '/hero.avif', type: 'image/avif' },
   *   { src: '/hero.webp', type: 'image/webp' },
   * ]
   */
  sources?: PictureSource[]
}

/**
 * Generate an optimised <img> tag.
 * Always include width + height to prevent CLS.
 * Use priority: true for the LCP image.
 *
 * @example
 * import { img } from '@invisibleloop/pulse/image'
 * img({ src: '/hero.jpg', alt: 'Hero', width: 1200, height: 600, priority: true })
 */
export function img(options: ImgOptions): string

/**
 * Generate a <picture> element with modern format sources and a fallback <img>.
 * Provide sources in preference order (AVIF first, then WebP, then the fallback src).
 *
 * @example
 * import { picture } from '@invisibleloop/pulse/image'
 * picture({
 *   src: '/hero.jpg', alt: 'Hero', width: 1200, height: 600,
 *   sources: [
 *     { src: '/hero.avif', type: 'image/avif' },
 *     { src: '/hero.webp', type: 'image/webp' },
 *   ]
 * })
 */
export function picture(options: PictureOptions): string
