'use client'

import { useEffect } from 'react'

import { dataBackground, forgetListener, lqipPixels } from './navInkImage'
import {
  averageLuminance,
  LIGHT_LUMINANCE,
  luminance,
  sampledRegion,
  type Box,
} from './navInkSample'

/**
 * The id `SiteNav` puts on its `<header>` and hands back here. The controller
 * styles nothing itself; it only decides which of the header's two skins is
 * live, and the CSS in `SiteNav` does the rest.
 */
export const NAV_INK_TARGET = 'site-nav'

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
 * How many columns the bar is read as.
 *
 * The bar is 900px wide and the things it crosses are not: a three-up card
 * grid puts three pictures and two gutters under it at once, and one sample at
 * the centre answers for whichever of the five it happens to land in. Nine
 * columns is one per 100px of pill — fine enough that a card cannot be missed
 * and coarse enough that the whole read is nine hit-tests against boxes the
 * engine has already laid out.
 */
const COLUMNS = 9

/**
 * The surfaces this design paints a dark ground with, and the ones it paints
 * light. A band, a card or a plate that declares `data-surface` has already
 * answered the only question this file asks, so the declaration is read before
 * anything is measured — that is what lets the bar cross a full-bleed
 * photograph correctly, since the picture's darkness lives in pixels no
 * computed style can report.
 *
 * A value in neither set is not guessed at: the walk falls through to the
 * picture, and then to the computed background.
 */
const DARK_SURFACES = new Set(['ink'])
const LIGHT_SURFACES = new Set(['white', 'paper', 'bone'])

/**
 * Is this element's ground light — or is it no ground at all (`null`)?
 *
 * Three answers in order, because that is the order the browser paints in and
 * the order of how much each one knows:
 *
 * 1. **The declaration.** `data-surface` is already how this design says what
 *    an element's ground is — it is what re-points the text roles
 *    (tokens/color.css), and the rule beside them is that whatever paints a
 *    dark background sets `data-surface="ink"`. One attribute lookup, and it
 *    is the only thing that can speak for a photograph under a gradient scrim,
 *    where every colour in the stack is transparent.
 * 2. **The picture.** `SanityImage` paints each photograph's LQIP as the
 *    `<img>`'s own background, sized and positioned to match the `object-fit`
 *    it carries — so the placeholder is a 20px stand-in for exactly what that
 *    element shows, already in the document, and a `data:` URI that taints no
 *    canvas. Read it and the bar knows the tone of the strip of picture it is
 *    actually over, rather than the tone of the band behind it.
 * 3. **The fill.** `getComputedStyle` normalises every authored form to
 *    `rgb(r, g, b)` or `rgba(r, g, b, a)` and nothing else, so two shapes are
 *    all this has to read.
 *
 * The fallthrough does the skipping that matters. A translucent overlay fails
 * `OPAQUE_ALPHA` and the walk continues past it to what it is veiling. An
 * element carrying only a gradient or a CDN url has a transparent
 * background-color, so it is skipped too, and the element behind it is judged
 * exactly.
 *
 * `undefined` is the fourth answer and a temporary one: a picture whose LQIP
 * has not finished decoding. That column stays unread for a frame or two
 * rather than being answered by the band behind the picture.
 */
function groundOf(element: Element, sample: Box, onReady: () => void): boolean | null | undefined {
  const declared = element.getAttribute('data-surface')
  if (declared) {
    if (DARK_SURFACES.has(declared)) return false
    if (LIGHT_SURFACES.has(declared)) return true
  }

  const style = getComputedStyle(element)
  const uri = dataBackground(style.backgroundImage)
  if (uri) {
    const pixels = lqipPixels(uri, onReady)
    if (pixels === undefined) return undefined
    if (pixels) {
      const [x, y] = style.backgroundPosition.split(' ')
      const region = sampledRegion(
        sample,
        element.getBoundingClientRect(),
        pixels,
        style.backgroundSize !== 'contain',
        { x: x ?? '50%', y: y ?? x ?? '50%' },
      )
      const mean = region && averageLuminance(pixels, region)
      if (mean !== null && mean !== undefined) return mean > LIGHT_LUMINANCE
    }
  }

  const channels = style.backgroundColor.match(/[\d.]+/g)
  if (!channels || channels.length < 3) return null
  const [r, g, b, alpha] = channels.map(Number) as [number, number, number, number | undefined]
  if ((alpha ?? 1) < OPAQUE_ALPHA) return null
  return luminance(r, g, b) > LIGHT_LUMINANCE
}

/**
 * The nav's ink flip.
 *
 * The bar is pinned, so it spends the page crossing bands: white copy over the
 * hero, unreadable two sections later over `bone`. On every scroll frame this
 * asks one question — what is actually underneath the bar right now? — and
 * answers it by toggling `data-ink="dark"` on the header. Nothing else about
 * the bar is touched from JS; the attribute is the whole API, and the
 * `group-data-` variants in `SiteNav` carry the appearance, so the flipped skin
 * is inspectable in the class list rather than only in a debugger.
 *
 * ── THE BAR IS READ IN COLUMNS ─────────────────────────────────────────────
 *
 * `elementsFromPoint` at a column's centre returns the stack under that point,
 * front to back, ending at `<body>` and `<html>`. Walk it, skip anything inside
 * the header (the bar is fixed, so it is always first, and it would otherwise
 * sample its own scrim), and take the FIRST element that reads as a ground at
 * all. Falling off the end means nothing did, all the way down to `<html>` —
 * the browser is painting its default canvas, which is white.
 *
 * That is one column. The bar takes the answer the **majority** of its columns
 * give, and a tie goes to dark, because the two skins fail asymmetrically: the
 * light skin is white copy on a 20% black scrim, and the dark skin is
 * `#232323` copy on a 10% one. Over the wrong ground the first is merely thin
 * and the second disappears.
 *
 * Columns are what make the bar honest over things narrower than itself. A
 * three-up card grid on a bone band is five different grounds at once — three
 * near-black pictures and two gutters — and the bar is legible over it only if
 * the pictures get a vote. A single white button on a dark hero gets its vote
 * too, and loses eight to one.
 *
 * ── KNOWN LIMITATION: PICTURES WITH NO LQIP ────────────────────────────────
 *
 * The projections that ask for `metadata{lqip, isOpaque}` are the photographic
 * fields; a logo field carries no LQIP, and neither does an asset with
 * transparency (Sanity renders every LQIP onto a flat ground, which would
 * report a plate the real asset never paints). Those elements have no ground
 * of their own, so the walk passes through to whatever contains them — which is
 * the right answer for a logo on a band, and a guess for anything else. The way
 * out is the declaration, not a harder sampler.
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
 * - **An LQIP finishing its decode.** The first frame over a picture cannot
 *   read it yet; the decode says when it can.
 *
 * Everything funnels through `schedule`, so however many of them fire at once
 * the bar is still sampled at most once per frame.
 */
export function watchNavInk(header: HTMLElement): () => void {
  let frame = 0

  // Declared before `isOverLight` needs it, and passed down to `groundOf` so a
  // decode that lands after the sample can ask for another one.
  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(sample)
  }

  const isOverLight = () => {
    // The PILL, not the header. The header is edge-to-edge at every width so
    // that the pill can centre inside it, and the pill is the box that has to
    // stay legible.
    const pill = header.querySelector('nav') ?? header
    const bar = pill.getBoundingClientRect()
    const midpoint = bar.bottom - bar.height / 2
    const slice = bar.width / COLUMNS

    let light = 0
    let read = 0
    for (let column = 0; column < COLUMNS; column++) {
      const left = bar.left + slice * column
      const strip: Box = { left, right: left + slice, top: bar.top, bottom: bar.bottom }
      let ground: boolean | null | undefined = true
      for (const element of document.elementsFromPoint(left + slice / 2, midpoint)) {
        if (header.contains(element)) continue
        ground = groundOf(element, strip, schedule)
        if (ground !== null) break
        // A veil, a gradient, an element with no ground of its own: keep
        // walking to what it is over.
        ground = true
      }
      // Still decoding: this column has no answer yet, so it casts no vote.
      if (ground === undefined) continue
      read++
      if (ground) light++
    }

    // No column could be read at all — every one of them is over a picture
    // still decoding. Hold the skin the server rendered rather than flip twice.
    if (read === 0) return false
    return light * 2 > read
  }

  const sample = () => {
    frame = 0
    if (isOverLight()) header.dataset.ink = 'dark'
    else delete header.dataset.ink
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
    forgetListener(schedule)
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
