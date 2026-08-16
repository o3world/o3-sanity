import { stegaClean } from '@sanity/client/stega'

/** What a band hangs behind its copy, or nothing (`decorationKnob`). */
export type Decoration = 'molecule' | 'orbs' | 'none'

/**
 * Resolve a band's editor-chosen `decoration` to the three values a renderer
 * draws. `stegaClean` strips the invisible characters draft-mode strings
 * carry; a stega'd `"molecule"` fails a bare `===` and silently draws nothing.
 *
 * **The fallback is `orbs`, and it is baked in rather than passed** — which is
 * the one way this differs from its sibling `resolveSurface`. Every block whose
 * knob offers orbs lists them first, so `orbs` IS the declared `initialValue`
 * wherever the answer can be `orbs` at all; a block whose knob is
 * `['none', 'molecule']` never asks for anything but `molecule`, so what the
 * other two arms resolve to cannot reach it.
 */
export function resolveDecoration(value: string | null | undefined): Decoration {
  const chosen = stegaClean(value)
  return chosen === 'molecule' || chosen === 'none' ? chosen : 'orbs'
}

/**
 * What a band must be for a decoration to hang in it: a positioning context
 * (`relative`), its own stacking context (`isolate`, so a `-z-10` child stays
 * above the band's background instead of falling behind it), and a clip
 * (`overflow-hidden`, because every decoration here is drawn deliberately
 * larger than the band and bleeding off an edge).
 *
 * **Whether a band applies it always or only when decorated is the band's own
 * fact, and the four do not agree.** `ctaSection` and `quoteSection` position
 * other children absolutely — the fade strip, the two spheres — so the context
 * is theirs whatever the knob says. `layoutSection` applies it only when
 * decorated: its columns hold arbitrary base blocks, and clipping them
 * unconditionally cuts the right-hand edge off any that overruns the band.
 * `/1682-conference-ai-innovation` is the page that proves it — its CTA button
 * is 13px wider than a 390px viewport (#181), and an unconditional clip there
 * loses the end of the label instead of the horizontal scroll.
 */
export const DECORATED_BAND_CLASS = 'relative isolate overflow-hidden'
