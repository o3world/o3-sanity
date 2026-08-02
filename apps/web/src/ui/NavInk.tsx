'use client'

import { useEffect } from 'react'

/**
 * The id `SiteNav` puts on its `<header>` and hands back here. The controller
 * styles nothing itself; it only decides which of the header's two skins is
 * live, and the CSS in `SiteNav` does the rest.
 */
export const NAV_INK_TARGET = 'site-nav'

/**
 * Perceived luminance above which a band counts as light —
 * `0.299r + 0.587g + 0.114b > 140`, the prototype's threshold verbatim.
 *
 * It sits deliberately above mid-grey (127.5): `--color-bone` (#F0F0F0, 240)
 * and white clear it easily, every ink surface is nowhere near it, and the one
 * value that could be argued either way — a mid photograph — is not a
 * background colour at all, so it never reaches this test.
 */
const LIGHT_LUMINANCE = 140

/**
 * The nav's ink flip, carried from the prototype's `nav ink` script.
 *
 * The bar is pinned, so it spends the page crossing bands: white copy over the
 * hero, unreadable two sections later over `bone`. On every scroll frame this
 * asks one question — is the bar's vertical midpoint currently inside a light
 * band? — and answers it by toggling `data-ink="dark"` on the header. Nothing
 * else about the bar is touched from JS. The prototype wrote inline styles
 * onto each link; here the attribute is the whole API and the `group-data-`
 * variants in `SiteNav` carry the appearance, so the flipped skin is
 * inspectable in the class list rather than only in a debugger.
 *
 * **The light-band list is built once, on mount.** Which sections exist and
 * what they are filled with is server-rendered here and never mutated on the
 * client — no tabs, no filtering, no band that appears on interaction. If that
 * stops being true, this is the line that goes stale first.
 *
 * Sampling `getComputedStyle` rather than reading the block's `surface` field
 * is the prototype's decision and worth keeping: it is decoupled from how
 * sections are built, so a band that arrives from a new block type, a document
 * template or the footer is classified correctly without registering anything.
 *
 * The flip is a colour state, not motion — it is not gated on
 * `prefers-reduced-motion`, and the SSR/no-JS output is simply the default
 * dark skin, which is correct wherever the page starts.
 */
export function NavInk({ targetId = NAV_INK_TARGET }: { targetId?: string }) {
  useEffect(() => {
    const header = document.getElementById(targetId)
    if (!header) return

    const lightBands = Array.from(document.querySelectorAll('section, footer')).filter((band) => {
      // `rgb(240, 240, 240)` or `rgba(3, 3, 3, 0.2)`, and nothing else —
      // getComputedStyle normalises every authored form to one of the two.
      const channels = getComputedStyle(band).backgroundColor.match(/[\d.]+/g)
      if (!channels || channels.length < 3) return false
      const [r, g, b, alpha] = channels.map(Number) as [number, number, number, number | undefined]
      // A transparent band is not a band — it shows whatever is behind it, and
      // that ancestor is in this list on its own account.
      if (alpha === 0) return false
      return r * 0.299 + g * 0.587 + b * 0.114 > LIGHT_LUMINANCE
    })

    let frame = 0

    const sample = () => {
      frame = 0
      const bar = header.getBoundingClientRect()
      const midpoint = bar.bottom - bar.height / 2
      const overLight = lightBands.some((band) => {
        const rect = band.getBoundingClientRect()
        return rect.top <= midpoint && rect.bottom >= midpoint
      })
      if (overLight) header.dataset.ink = 'dark'
      else delete header.dataset.ink
    }

    // Scroll fires far faster than the compositor paints, and every sample
    // reads layout off every band on the page. One read per frame is enough.
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(sample)
    }

    sample()
    window.addEventListener('scroll', schedule, { passive: true })
    // A resize reflows the bands under a bar whose scroll position has not
    // changed, so the answer can go stale without a single scroll event.
    window.addEventListener('resize', schedule, { passive: true })

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [targetId])

  return null
}
