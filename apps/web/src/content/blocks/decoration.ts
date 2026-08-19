import { stegaClean } from '@sanity/client/stega'

import { BLOCK_KNOBS } from '@o3/sanity/knobs'

import type { PageSection } from '@o3/content-runtime/blocks'

/** What a band hangs behind its copy, or nothing (`decorationKnob`). */
export type Decoration = 'molecule' | 'orbs' | 'none'

const DECORATIONS: readonly Decoration[] = ['molecule', 'orbs', 'none']

/**
 * Each block's declared decoration default, keyed by its Sanity `_type` — read
 * off the `decoration` knob in `packages/sanity/src/knobs/<block>.ts`, never
 * restated. The same construction `surface.ts` uses, for the same reason.
 *
 * A block that declares no `decoration` knob is absent here rather than
 * defaulted, so the one arm below that has to invent an answer stays visible.
 */
const DECLARED_DECORATION: Readonly<Record<string, Decoration>> = Object.fromEntries(
  Object.entries(BLOCK_KNOBS).flatMap(([type, spec]) => {
    const declared = spec.knobs.find((knob) => knob.name === 'decoration')?.initialValue
    return DECORATIONS.includes(declared as Decoration) ? [[type, declared as Decoration]] : []
  }),
)

/**
 * Resolve a band's editor-chosen `decoration` to the three values a renderer
 * draws. `stegaClean` strips the invisible characters draft-mode strings
 * carry; a stega'd `"molecule"` fails a bare `===` and silently draws nothing.
 *
 * **The caller names the BLOCK, not the fallback.** This read a single `orbs`
 * literal until #163, on the premise that every offering block lists orbs
 * first — true right up until the CTA band moved to the molecule its canonical
 * component draws. A literal here is a mirror of the declaration that nothing
 * checks: flip a knob's option order and new documents repaint while every
 * existing one stays on the old glyph, which is the drift ADR 0020 retired
 * `defaultSurface` to stop. Its sibling `resolveSurface` already reads
 * `BLOCK_KNOBS` for exactly this; the two now differ in nothing.
 */
export function resolveDecoration(
  value: string | null | undefined,
  block: PageSection['_type'],
): Decoration {
  const chosen = stegaClean(value)
  if (DECORATIONS.includes(chosen as Decoration)) return chosen as Decoration
  return DECLARED_DECORATION[block] ?? 'orbs'
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
