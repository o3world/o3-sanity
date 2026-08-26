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
 * uses is far below it — `--color-scrim` is 0.2 and `--color-scrim-light` is
 * 0.1. The only 0.9+ alpha anywhere in color.css is
 * `--color-on-ink` at 0.92, which is a text colour and never a fill. So 0.9
 * separates "a band" from "a veil over a band" with the whole palette to spare,
 * while still accepting the near-opaque values `color-mix` rounding produces.
 */
const OPAQUE_ALPHA = 0.9

/**
 * Slack, in px, when asking whether a candidate spans the bar. Sub-pixel
 * layout and a rounded scrollbar gutter routinely leave a full-width band a
 * fraction short of the pill's own box; 1px absorbs that without letting
 * anything that is genuinely narrower through.
 */
const SPAN_TOLERANCE = 1

/**
 * The surfaces this design paints a dark ground with, and the ones it paints
 * light. A band, a card or a plate that declares `data-surface` has already
 * answered the only question this file asks, so the declaration is read before
 * anything is measured — that is what lets the bar cross a full-bleed
 * photograph correctly, since the picture's darkness lives in pixels no
 * computed style can report.
 *
 * A value in neither set is not guessed at: the walk falls through to the
 * computed background, which is what every element without a declaration gets.
 */
const DARK_SURFACES = new Set(['ink'])
const LIGHT_SURFACES = new Set(['white', 'paper', 'bone'])

/**
 * Is this element's ground light — or is it no ground at all (`null`)?
 *
 * `getComputedStyle` normalises every authored form to `rgb(r, g, b)` or
 * `rgba(r, g, b, a)` and nothing else, so two shapes are all the fallback has
 * to read.
 */
function groundOf(element: Element): boolean | null {
  const declared = element.getAttribute('data-surface')
  if (declared) {
    if (DARK_SURFACES.has(declared)) return false
    if (LIGHT_SURFACES.has(declared)) return true
  }
  const channels = getComputedStyle(element).backgroundColor.match(/[\d.]+/g)
  if (!channels || channels.length < 3) return null
  const [r, g, b, alpha] = channels.map(Number) as [number, number, number, number | undefined]
  if ((alpha ?? 1) < OPAQUE_ALPHA) return null
  return r * 0.299 + g * 0.587 + b * 0.114 > LIGHT_LUMINANCE
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
 * would otherwise sample its own scrim), and take the FIRST element that reads
 * as a ground at all.
 *
 * **A ground is a declaration, or failing that a fill.** `data-surface` is
 * already how this design says what an element's ground is — it is what
 * re-points the text roles (tokens/color.css), and the rule beside them is
 * that whatever paints a dark background sets `data-surface="ink"`. Reading it
 * here costs one attribute lookup and answers the case a fill cannot: a
 * full-bleed photograph under an ink scrim, whose darkness lives in pixels no
 * computed style reports. Everything undeclared falls back to
 * `background-color`, so a band that arrives from a new block type, a document
 * template or the footer is still classified without registering anything.
 *
 * The fallback does the skipping that matters. A translucent overlay fails
 * `OPAQUE_ALPHA` and the walk continues past it to what it is veiling. An
 * element carrying only a background-image — a gradient wash, an undeclared
 * photo — has a transparent background-color, so it is skipped too: judging an
 * image cheaply is not possible, and the element behind it can be judged
 * exactly. An element with an image over an opaque fill is judged on the fill,
 * which is the honest answer available and the one the designer chose as its
 * base.
 *
 * **A candidate also has to be wide enough to BE the surface.** The hero's
 * white button and the bone insights cards both sit under the sample point on
 * the way past, and both won the walk on colour alone — a 180px button flipping
 * a 900px bar is a false positive that reads as a flicker while scrolling. So a
 * candidate must span the PILL horizontally. The pill and not the header: the
 * header is edge-to-edge at every width so the pill can centre inside it, and
 * measuring against that box asks whether a candidate covers the whole
 * viewport. A /work case-study card is 1248 of a 1600 window and covers the
 * 900px pill entirely, which is the only width the question is about; against
 * the header it failed, and the bar wore dark ink over a near-black card.
 * Anything narrower than the pill is furniture ON the band, and the walk
 * continues to what the furniture is sitting on.
 *
 * Falling off the end of the walk means nothing read as a ground all the way
 * down to `<html>` — the browser is painting its default canvas, which is
 * white. Light, therefore, and the bar flips. Horizontal position is the pill's
 * own centre: every band in this design is full-width, so one column answers
 * for the row.
 *
 * ── KNOWN LIMITATION: UNDECLARED PICTURES ──────────────────────────────────
 *
 * An `<img>` has no background-color, so where nothing around it declares a
 * surface the walk passes straight through to whatever contains it. Scrolling
 * an Insights article, the bar crosses the inline photographs still wearing the
 * light skin it took from the white column behind them.
 *
 * It is left that way on purpose. Reading the actual tone of a picture means
 * sampling pixels: a canvas draw per frame, and a CORS taint on every image
 * served from the CDN. The way out is the declaration, not a harder sampler —
 * an inline figure that wants the bar to know it is dark says so the same way
 * the case-study card does.
 *
 * **This is cheaper than what it replaced.** One `elementsFromPoint` plus a
 * short walk is a hit-test against boxes the engine has already laid out, where
 * the old sample called `getBoundingClientRect` on every band on the page,
 * every frame. Fewer forced reads, not more.
 *
 * The flip is a colour state, not motion — it is not gated on
 * `prefers-reduced-motion`, and the SSR/no-JS output is simply the default dark
 * skin, which is correct wherever the page starts.
 *
 * ── WHEN IT ASKS ───────────────────────────────────────────────────────────
 *
 * Scrolling is not the only way the surface under a fixed bar changes, and a
 * sample taken once at mount is stale the moment anything else moves (#318).
 * Every trigger below is a way the page can change underneath a bar whose
 * scroll position never moved and whose viewport never resized:
 *
 * - **The frame after mount.** The mount sample runs in the hydration commit,
 *   which is before the browser has laid the hydrated document out and painted
 *   it. Asking again one frame later costs one hit-test and is the answer that
 *   ships.
 * - **A reflow.** Fonts swapping in, images arriving, content streaming in,
 *   a section revealing — each changes where the bands are, and the document
 *   element's own box changes with them. `ResizeObserver` sees all of it.
 * - **Content swapped in place.** A client-side route change replaces the page
 *   under a layout that never unmounts, so `NavInk` keeps running with the
 *   previous page's answer; navigating at the top of the document produces
 *   neither a scroll nor a resize. `MutationObserver` sees the swap.
 * - **A restore from the back/forward cache.** The page comes back with its
 *   effects never re-run, so `pageshow` is the only signal there is.
 *
 * Everything funnels through `schedule`, so however many of them fire at once
 * the bar is still sampled at most once per frame.
 */
export function watchNavInk(header: HTMLElement): () => void {
  let frame = 0

  const isOverLight = () => {
    // The PILL, not the header. The header is edge-to-edge at every width so
    // that the pill can centre inside it, and measuring the span against that
    // box asks whether a candidate covers the whole viewport — which a
    // full-bleed case-study card, 1248 of a 1600 window, does not. It covers
    // the 900px pill completely, which is the only width the question is about.
    const pill = header.querySelector('nav') ?? header
    const bar = pill.getBoundingClientRect()
    const midpoint = bar.bottom - bar.height / 2
    for (const element of document.elementsFromPoint((bar.left + bar.right) / 2, midpoint)) {
      if (header.contains(element)) continue
      const light = groundOf(element)
      if (light === null) continue
      // Only measure the handful of elements that got this far, never the
      // whole stack. `<body>` and `<html>` span everything, so the walk
      // always terminates somewhere.
      const box = element.getBoundingClientRect()
      if (box.left > bar.left + SPAN_TOLERANCE || box.right < bar.right - SPAN_TOLERANCE) continue
      return light
    }
    // Nothing that reads as a ground under the bar, `<html>` included: the
    // browser is painting its default canvas.
    return true
  }

  const sample = () => {
    frame = 0
    if (isOverLight()) header.dataset.ink = 'dark'
    else delete header.dataset.ink
  }

  // Scroll fires far faster than the compositor paints, and a reflow can fire
  // several of the triggers below at once. One sample per frame is all that
  // can show up on screen either way.
  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(sample)
  }

  sample()
  schedule()

  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  window.addEventListener('pageshow', schedule)

  const reflow = new ResizeObserver(schedule)
  reflow.observe(document.documentElement)

  // Attributes are deliberately not watched: `sample` writes one to this very
  // header, and the whole ink flip is styled off it.
  const swap = new MutationObserver(schedule)
  swap.observe(document.body, { childList: true, subtree: true })

  return () => {
    if (frame) cancelAnimationFrame(frame)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('pageshow', schedule)
    reflow.disconnect()
    swap.disconnect()
  }
}

export function NavInk({ targetId = NAV_INK_TARGET }: { targetId?: string }) {
  useEffect(() => {
    const header = document.getElementById(targetId)
    if (!header) return
    return watchNavInk(header)
  }, [targetId])

  return null
}
