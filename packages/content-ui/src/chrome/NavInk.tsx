'use client'

import { useEffect } from 'react'

import {
  COLUMNS,
  coversSample,
  DARK_SURFACES,
  LIGHT_LUMINANCE,
  LIGHT_SURFACES,
  luminance,
  NAV_INK_TARGET,
  type Box,
} from './navInkSample'

export { NAV_INK_TARGET }

/**
 * Alpha at or above which a background is treated as the surface, rather than
 * as something to see through.
 *
 * Read off the palette rather than picked: every background alpha this design
 * uses is below it — `--color-scrim-light`, the densest, is 0.6. The only
 * 0.9+ alpha anywhere in color.css is `--color-on-ink` at 0.92, which is a
 * text colour and never a fill. So 0.9 separates "a band" from "a veil over a
 * band", while still accepting the near-opaque values `color-mix` rounding
 * produces.
 */
const OPAQUE_ALPHA = 0.9

/**
 * The `data:` URI a background-image is, or `null` for anything else — a
 * gradient wash, a CDN url, `none`.
 *
 * It is how a picture is recognised. `SanityImage` paints every photograph's
 * LQIP as the `<img>`'s own background, sized and positioned to match the
 * `object-fit` it carries, so a `data:` background on an element means that
 * element is showing a photograph. A logo carries none — the projections that
 * ask for `metadata{lqip, isOpaque}` are the photographic fields — which is
 * exactly right: a logo on a band is not a ground, and the band behind it is.
 */
function pictureUri(backgroundImage: string): string | null {
  const match = /^url\("?(data:image\/[^")]+)"?\)/.exec(backgroundImage)
  return match?.[1] ?? null
}

/**
 * What a `data-surface` value says about the ground under it: light, dark, or
 * (`null`) nothing this file recognises — the vocabulary is `navInkSample`'s.
 */
function declaredGround(element: Element): boolean | null {
  const declared = element.getAttribute('data-surface')
  if (!declared) return null
  if ((DARK_SURFACES as readonly string[]).includes(declared)) return false
  if ((LIGHT_SURFACES as readonly string[]).includes(declared)) return true
  return null
}

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
 *    where every colour in the stack is transparent. A value in neither list
 *    is not guessed at: the walk falls through to the picture, and then to
 *    the computed background.
 * 2. **The picture, which is never a light ground.** See below.
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
 * ── A PICTURE IS A DARK GROUND, WHATEVER ITS PIXELS AVERAGE ────────────────
 *
 * The bar has two skins and they fail asymmetrically. White copy on
 * `--color-scrim` (20% black) survives almost any ground, because the scrim
 * darkens whatever is behind it. `#232323` on `--color-scrim-light` (white at
 * 60%) needs the ground to be pale AND even: the scrim lifts a dark ground a
 * long way, but not to white, and the hairline that shapes the pill needs an
 * even band around it to read as chrome at all. A photograph is that second
 * thing's enemy even when it is bright: measured on one article's picture, the
 * strip under the bar averaged 205 of 255 and still ran from 81 to 251 inside
 * the bar's own height, and the dark skin over it was unreadable (#372).
 *
 * So a picture is answered rather than sampled, and the answer is the skin
 * that survives it. That is also what the frames draw — the bar is glass over
 * hero imagery, and the dark skin is what it wears over `white`, `bone` and
 * `paper`, which are flat bands.
 *
 * `contain` is the one case that needs arithmetic: it leaves bars beside the
 * picture, and a strip of bar is not a strip of picture. The walk continues
 * there, to whatever the element paints behind its own background image.
 */
function groundOf(element: Element, sample: Box): boolean | null {
  const declared = declaredGround(element)
  if (declared !== null) return declared

  const style = getComputedStyle(element)
  if (pictureUri(style.backgroundImage)) {
    // `cover` fills the box, so the strip is on the picture wherever it falls.
    if (style.backgroundSize !== 'contain') return false
    const [x, y] = style.backgroundPosition.split(' ')
    const natural = intrinsicSize(element)
    if (
      !natural ||
      coversSample(sample, element.getBoundingClientRect(), natural, {
        x: x ?? '50%',
        y: y ?? x ?? '50%',
      })
    ) {
      return false
    }
  }

  const channels = style.backgroundColor.match(/[\d.]+/g)
  if (!channels || channels.length < 3) return null
  const [r, g, b, alpha] = channels.map(Number) as [number, number, number, number | undefined]
  if ((alpha ?? 1) < OPAQUE_ALPHA) return null
  return luminance(r, g, b) > LIGHT_LUMINANCE
}

/**
 * The picture's own proportions, off the element showing it.
 *
 * `naturalWidth`/`naturalHeight` are the decoded image's, and the LQIP behind
 * it is a scaled copy of the same picture — so either one answers the shape
 * question, and the element already has it. `null` before the image has
 * decoded, which is a `contain` box whose letterbox cannot be located yet;
 * the caller treats that as picture, which is the safe half.
 */
function intrinsicSize(element: Element): { width: number; height: number } | null {
  const image = element as HTMLImageElement
  if (!image.naturalWidth || !image.naturalHeight) return null
  return { width: image.naturalWidth, height: image.naturalHeight }
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
 * dark skin is white copy on a 20% black scrim, and the light skin is dark
 * copy on opaque white. Over the wrong ground the first is merely thin and
 * the second is a floating white slab.
 *
 * Columns are what make the bar honest over things narrower than itself. A
 * three-up card grid on a bone band is five different grounds at once — three
 * near-black pictures and two gutters — and the bar is legible over it only if
 * the pictures get a vote. A single white button on a dark hero gets its vote
 * too, and loses eight to one.
 *
 * ── PICTURES WITH NO LQIP ──────────────────────────────────────────────────
 *
 * The projections that ask for `metadata{lqip, isOpaque}` are the photographic
 * fields; a logo field carries no LQIP, and neither does an asset with
 * transparency. Those elements are not recognised as pictures, so the walk
 * passes through to whatever contains them — the right answer for a logo on a
 * band, and a guess for anything else. The way out is `data-surface`.
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
 *
 * ── A PAGE MID VIEW TRANSITION CANNOT BE HIT-TESTED ────────────────────────
 *
 * A cross-page fade captures the document and paints it as pseudo-elements,
 * and a captured box stops hit-testing while that runs. So the column walk
 * finds no band at all, falls through to the body's own white, and the bar
 * takes the light skin over an ink hero. It then STAYS there: the DOM swap
 * that scheduled the sample was the last thing to happen, so nothing asks
 * again. The bar was white after every nav click for that reason.
 *
 * But the page CAN be read: the DOM swap has happened, the new page is laid
 * out, and its bands declare their grounds. So a sample taken mid-capture
 * reads the declarations by geometry instead — which declared band each
 * column's centre falls inside — and flips at the swap. That is when the
 * flip belongs: the root snapshot holds the chrome still and live
 * (tokens/motion.css), so the bar crosses to the arriving page's skin over
 * the same 300ms the content crossfades, rather than wearing the old page's
 * skin over the new page's hero for the fade and then flipping after it.
 *
 * Only a page that declares nothing under the bar is deferred, a frame at a
 * time, to the hit-test that runs once the capture is over.
 */
function sampleNavInk(header: HTMLElement): boolean | null {
  /**
   * Is the document being captured for a view transition right now?
   *
   * The transition's own animations are the only ones that run on a
   * `::view-transition*` pseudo-element, so their presence is the state itself
   * rather than a proxy for it — there is no flag on `document` to read, and
   * the `ViewTransition` object belongs to whoever called
   * `startViewTransition`. Cheap beside the nine hit-tests below it.
   *
   * `getAnimations` is checked for rather than assumed, and the answer where it
   * is missing is `false` rather than a guess: a document that cannot enumerate
   * its animations cannot run a view transition either, so there is nothing to
   * wait for. That covers the older browser and the test DOM in one line.
   */
  const capturing = () =>
    typeof document.getAnimations === 'function' &&
    document
      .getAnimations()
      .some((animation) =>
        (animation.effect as KeyframeEffect | null)?.pseudoElement?.startsWith('::view-transition'),
      )

  /**
   * The pill's columns, each answered by `ground` — `true` light, `false`
   * dark, `null` unreadable — and the bar's verdict from them: light on a
   * majority of the columns that answered, `null` when none did.
   *
   * The PILL, not the header. The header is edge-to-edge at every width so
   * that the pill can centre inside it, and the pill is the box that has to
   * stay legible.
   */
  const verdict = (
    ground: (x: number, y: number, strip: Box) => boolean | null,
  ): boolean | null => {
    const pill = header.querySelector('nav') ?? header
    const bar = pill.getBoundingClientRect()
    const midpoint = bar.bottom - bar.height / 2
    const slice = bar.width / COLUMNS

    let light = 0
    let read = 0
    for (let column = 0; column < COLUMNS; column++) {
      const left = bar.left + slice * column
      const strip: Box = { left, right: left + slice, top: bar.top, bottom: bar.bottom }
      const answer = ground(left + slice / 2, midpoint, strip)
      if (answer === null) continue
      read++
      if (answer) light++
    }

    return read ? light * 2 > read : null
  }

  /** What is painted under a point, front to back. */
  const painted = (x: number, y: number, strip: Box): boolean => {
    for (const element of document.elementsFromPoint(x, y)) {
      if (header.contains(element)) continue
      const answer = groundOf(element, strip)
      // A veil, a gradient, an element with no ground of its own: keep
      // walking to what it is over.
      if (answer === null) continue
      return answer
    }
    // Nothing did, all the way down to `<html>` — the browser is painting its
    // default canvas, which is white.
    return true
  }

  /**
   * What is declared under a point, by geometry. Later in document order
   * wins, which is the order the browser would paint the same boxes in: a
   * card's plate over the band it sits on.
   */
  const declared = (x: number, y: number): boolean | null => {
    let answer: boolean | null = null
    for (const element of document.querySelectorAll('main [data-surface]')) {
      const box = element.getBoundingClientRect()
      if (x < box.left || x >= box.right || y < box.top || y >= box.bottom) continue
      answer = declaredGround(element) ?? answer
    }
    return answer
  }

  const light = capturing() ? verdict(declared) : verdict(painted)
  if (light === null) return null
  if (light) header.dataset.ink = 'dark'
  else delete header.dataset.ink
  return light
}

/** Settle the whole skin in this style pass, before a committed route paints. */
export function settleNavInk(header: HTMLElement): void {
  const style = document.createElement('style')
  style.textContent = `#${CSS.escape(header.id)} *{transition:none!important}`
  document.head.append(style)
  try {
    sampleNavInk(header)
    // Descendants have their own hover transitions; flush those too before
    // restoring the ordinary scroll/hover cadence. No frame holds this rule.
    for (const element of header.querySelectorAll('*')) void getComputedStyle(element).color
  } finally {
    style.remove()
  }
}

export function watchNavInk(header: HTMLElement): () => void {
  let frame = 0
  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(sample)
  }
  const sample = () => {
    frame = 0
    // An unreadable capture is early, not wrong; retry once it can be read.
    if (sampleNavInk(header) === null) schedule()
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
