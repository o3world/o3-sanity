'use client'

import { useEffect } from 'react'

/**
 * The id `SiteNav` puts on its `<header>` and hands back here. The controller
 * styles nothing itself; it only decides which of the header's two skins is
 * live, and the CSS in `SiteNav` does the rest.
 */
export const NAV_INK_TARGET = 'site-nav'

/**
 * Perceived luminance above which a surface counts as light —
 * `0.299r + 0.587g + 0.114b > 140`, the prototype's threshold verbatim.
 *
 * It sits deliberately above mid-grey (127.5): `--color-bone` (#F1F0EC, ~240)
 * and white clear it easily, and every ink surface in the palette is nowhere
 * near it — `--color-ink` lands at 10.
 */
const LIGHT_LUMINANCE = 140

/**
 * Alpha at or above which a background is treated as the surface, rather than
 * as something to see through.
 *
 * Read off the palette rather than picked: every background alpha this design
 * uses is far below it — `--color-scrim` is 0.2 and `--color-scrim-light`, the
 * highest, is 0.55. The only 0.9+ alpha anywhere in color.css is
 * `--color-on-ink` at 0.92, which is a text colour and never a fill. So 0.9
 * separates "a band" from "a veil over a band" with the whole palette to spare,
 * while still accepting the near-opaque values `color-mix` rounding produces.
 */
const OPAQUE_ALPHA = 0.9

/**
 * Slack, in px, when asking whether a candidate spans the bar. Sub-pixel
 * layout and a rounded scrollbar gutter routinely leave a full-width band a
 * fraction short of the header's own box; 1px absorbs that without letting
 * anything that is genuinely narrower through.
 */
const SPAN_TOLERANCE = 1

/**
 * `getComputedStyle` normalises every authored form to `rgb(r, g, b)` or
 * `rgba(r, g, b, a)` and nothing else, so two shapes are all this has to read.
 */
function backgroundOf(element: Element) {
  const channels = getComputedStyle(element).backgroundColor.match(/[\d.]+/g)
  if (!channels || channels.length < 3) return null
  const [r, g, b, alpha] = channels.map(Number) as [number, number, number, number | undefined]
  return { luminance: r * 0.299 + g * 0.587 + b * 0.114, alpha: alpha ?? 1 }
}

/**
 * The nav's ink flip, carried from the prototype's `nav ink` script.
 *
 * The bar is pinned, so it spends the page crossing bands: white copy over the
 * hero, unreadable two sections later over `bone`. On every scroll frame this
 * asks one question — what is actually underneath the bar right now? — and
 * answers it by toggling `data-ink="dark"` on the header. Nothing else about
 * the bar is touched from JS. The prototype wrote inline styles onto each link;
 * here the attribute is the whole API and the `group-data-` variants in
 * `SiteNav` carry the appearance, so the flipped skin is inspectable in the
 * class list rather than only in a debugger.
 *
 * ── WHY A HIT-TEST, NOT A LIST ─────────────────────────────────────────────
 *
 * This used to collect `section, footer` on mount, keep the ones whose own
 * background-color read light, and ask whether any of their rects spanned the
 * bar. That is the prototype's algorithm and it is wrong on a real page, in
 * two ways that both showed up in the browser:
 *
 * - **It could only see light that a `<section>` declared itself.** A band left
 *   transparent over the document's white, a light-filled `<div>` that is not a
 *   section, the hero's bone dome — all light under the bar, none of them in
 *   the list, so the bar stayed white on white.
 * - **The list was built once.** The old comment here admitted the staleness
 *   and guessed it would not matter. It did.
 *
 * So the question is asked of the page instead of a cache:
 * `elementsFromPoint` at the bar's vertical midpoint returns the stack under
 * that point, front to back, ending at `<body>` and `<html>`. Walk it, skip
 * anything inside the header (the bar is fixed, so it is always first, and it
 * would otherwise sample its own scrim), and take the FIRST element whose
 * background is opaque enough to be the surface.
 *
 * That single rule does all the skipping that matters. A translucent overlay
 * fails `OPAQUE_ALPHA` and the walk continues past it to what it is veiling. An
 * element that carries only a background-image — a gradient wash, a photo — has
 * a transparent background-color, so it is skipped too: judging an image cheaply
 * is not possible, and the element behind it can be judged exactly. An element
 * with an image over an opaque fill is judged on the fill, which is the honest
 * answer available and the one the designer chose as its base.
 *
 * **A candidate also has to be wide enough to BE the surface.** The hero's
 * white CTA and the bone insights cards both sit under the sample point on
 * the way past, and both won the walk on colour alone — a 180px button flipping
 * a 900px bar is a false positive that reads as a flicker while scrolling. So
 * a candidate must span the header horizontally, which is the same "bands are
 * full-width" assumption that lets one x answer for the row. Anything narrower
 * is furniture ON the band, not the band, and the walk continues to what the
 * furniture is sitting on — which is the surface the bar is mostly over anyway.
 *
 * Falling off the end of the walk means nothing opaque was found all the way
 * down to `<html>` — the browser is painting its default canvas, which is
 * white. Light, therefore, and the bar flips. Horizontal position is fixed at
 * the viewport centre: every band in this design is full-width, so one column
 * answers for the row.
 *
 * ── KNOWN LIMITATION: PICTURES ─────────────────────────────────────────────
 *
 * An `<img>` has no background-color, so the walk passes straight through it to
 * whatever contains it. Scrolling a Insights article, the bar crosses the
 * inline photographs still wearing the light skin it took from the white column
 * behind them — verified in the browser, and it is dark ink over a dark picture
 * for the height of each one.
 *
 * It is left that way on purpose, because the alternative is worse and the
 * middle ground is expensive. Not flipping on article bodies at all — what the
 * old list did, since the body is not a light `<section>` — put white copy on
 * white paper for the entire article, which is unreadable rather than merely
 * unlovely. Reading the actual tone of a picture means sampling pixels: a
 * canvas draw per frame, and a CORS taint on every image served from the CDN.
 * The 55%-white pill lifts its own backdrop enough that the bar stays legible
 * over a dark photo, which is what makes the trade acceptable rather than just
 * cheap. If it needs solving, solve it with data — the block knows it is
 * rendering a full-bleed image — and not with a sampler that guesses harder.
 *
 * **This is cheaper than what it replaced.** One `elementsFromPoint` plus a
 * short walk is a hit-test against boxes the engine has already laid out, where
 * the old sample called `getBoundingClientRect` on every band on the page,
 * every frame. Fewer forced reads, not more.
 *
 * Sampling computed style rather than reading the block's `surface` field is
 * the prototype's decision and worth keeping: it is decoupled from how sections
 * are built, so a band that arrives from a new block type, a document template
 * or the footer is classified correctly without registering anything.
 *
 * The flip is a colour state, not motion — it is not gated on
 * `prefers-reduced-motion`, and the SSR/no-JS output is simply the default dark
 * skin, which is correct wherever the page starts.
 */
export function NavInk({ targetId = NAV_INK_TARGET }: { targetId?: string }) {
  useEffect(() => {
    const header = document.getElementById(targetId)
    if (!header) return

    let frame = 0

    const isOverLight = () => {
      const bar = header.getBoundingClientRect()
      const midpoint = bar.bottom - bar.height / 2
      for (const element of document.elementsFromPoint(window.innerWidth / 2, midpoint)) {
        if (header.contains(element)) continue
        const background = backgroundOf(element)
        if (!background || background.alpha < OPAQUE_ALPHA) continue
        // Only measure the handful of elements that got this far, never the
        // whole stack. `<body>` and `<html>` span everything, so the walk
        // always terminates somewhere.
        const box = element.getBoundingClientRect()
        if (box.left > bar.left + SPAN_TOLERANCE || box.right < bar.right - SPAN_TOLERANCE) continue
        return background.luminance > LIGHT_LUMINANCE
      }
      // Nothing opaque under the bar, `<html>` included: the default canvas.
      return true
    }

    const sample = () => {
      frame = 0
      if (isOverLight()) header.dataset.ink = 'dark'
      else delete header.dataset.ink
    }

    // Scroll fires far faster than the compositor paints. One sample per frame
    // is all that can show up on screen.
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
