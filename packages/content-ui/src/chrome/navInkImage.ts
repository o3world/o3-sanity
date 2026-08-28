import type { Pixels } from './navInkSample'

/**
 * The decoded LQIPs the ink flip has needed so far, keyed by the `data:` URI
 * itself — which is the asset's identity, so two elements showing the same
 * picture decode once. `null` records a decode that failed or an environment
 * with no canvas, so it is never retried.
 */
const decoded = new Map<string, Pixels | null>()

/** Decodes in flight, so a bar crossing an image does not queue one per frame. */
const pending = new Set<string>()

/** Everyone waiting to be told a decode landed. */
const waiting = new Set<() => void>()

/**
 * The `data:` URI a background-image is, or `null` for anything else — a
 * gradient wash, a CDN URL, `none`. Only a data URI is worth reading: it is
 * already in the document, it cannot taint a canvas, and in this codebase it
 * is the LQIP `SanityImage` paints under every photograph.
 */
export function dataBackground(backgroundImage: string): string | null {
  const match = /^url\("?(data:image\/[^")]+)"?\)/.exec(backgroundImage)
  return match?.[1] ?? null
}

function decode(uri: string, canvas: HTMLCanvasElement | null) {
  if (!canvas) {
    decoded.set(uri, null)
    return
  }
  pending.add(uri)
  const image = new Image()
  image.decoding = 'async'
  image.onload = () => {
    pending.delete(uri)
    try {
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('no 2d context')
      context.drawImage(image, 0, 0)
      decoded.set(uri, context.getImageData(0, 0, canvas.width, canvas.height))
    } catch {
      decoded.set(uri, null)
    }
    for (const listener of waiting) listener()
  }
  image.onerror = () => {
    pending.delete(uri)
    decoded.set(uri, null)
    for (const listener of waiting) listener()
  }
  image.src = uri
}

/**
 * The pixels of an LQIP: the grid once it is decoded, `null` where it never
 * will be, and `undefined` while the decode is in flight — which is the caller's
 * signal to leave that part of the bar unanswered rather than guess at it.
 *
 * The first ask starts the decode and registers `onReady`, so the frame that
 * finishes it re-samples. A `data:` URI needs no network, so that is the next
 * frame or two, not a visible wait.
 */
export function lqipPixels(uri: string, onReady: () => void): Pixels | null | undefined {
  if (decoded.has(uri)) return decoded.get(uri)
  waiting.add(onReady)
  if (!pending.has(uri)) {
    decode(uri, typeof document === 'undefined' ? null : document.createElement('canvas'))
  }
  return decoded.has(uri) ? decoded.get(uri) : undefined
}

/** Stop telling a torn-down bar about decodes it no longer cares about. */
export function forgetListener(onReady: () => void) {
  waiting.delete(onReady)
}
