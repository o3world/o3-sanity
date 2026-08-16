import { MoleculeMark, OrbitalSphere, SurfaceProvider } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import { ButtonLink } from '@/content/ButtonLink'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type CtaSectionProps = SectionProps<'ctaSection'>

/**
 * Section block: the closing CTA band.
 *
 * ```
 * 1440 × 790, the decoration behind it
 *   copy      600px column centred, gap 18
 *     heading 64px (--text-cta, the 2026-08 shared CTA component's step) at
 *     92% white, centred
 *     body    24px at 60% white in a 446px measure
 *   button    Button Theme=White
 * ```
 *
 * **Only the decoration is the `CTA` component's.** Those measurements are
 * `1680:2132`'s, and the component (`2124:72`, set `2177:1354`) does not agree
 * with them: it gaps the copy 24 and the button 48, measures the body at 580,
 * and stretches the column to the 96px gutter instead of pinning it at 600.
 * Reconciling that is a repaint of every closer's typography and is nobody's
 * ticket yet — read the numbers above as this band's, not as the component's.
 *
 * **`orbs` is the pre-redesign band (`1680:2132`), and it is a pair.** The
 * sphere and the 87px `--gradient-ink-fade` strip along the foot (`1928:6596`)
 * are one composition: the strip dissolves the sphere's lower limb into the
 * `#030303` footer, so the two dark areas read as one field rather than two
 * bands that happen to touch. The component draws neither, so neither the
 * molecule nor `none` carries a strip — there is no limb to hide and no colour
 * step to soften.
 *
 * Home is the one page still on it (#163): its frame keeps the bespoke closer
 * where About, Solutions, Live and the two collection indexes moved to the
 * component.
 */
export function CtaSection({ heading, body, button, decoration }: CtaSectionProps) {
  const chosen = stegaClean(decoration)
  // Unset draws the molecule, the same value `decorationKnob` starts a newly
  // inserted band on.
  const showOrbs = chosen === 'orbs'
  const showMolecule = !showOrbs && chosen !== 'none'

  return (
    // The band always paints its own ink field, so it declares one: `ink-deep`
    // is the darker end of the same surface, and the button on it resolves the
    // way it would on any ink band.
    <SurfaceProvider surface="ink">
      <section className="bg-ink-deep px-gutter relative isolate overflow-hidden text-white">
        {/*
         * **The globe's bottom, at the hero's scale.** `95.5vw` is the hero's
         * own width, so the two spheres read as the same object seen twice; the
         * band then shows the underside of it, with the bottom limb seated a few
         * percent clear of the floor rather than grazing it.
         *
         * The size and the fraction visible are in direct tension, and size won.
         * A sphere this wide is 1375px at 1440 — more than twice the band's 671 —
         * so the band can only ever reveal about half of it. Asking for three
         * quarters caps the diameter near 1.29 × the band height, which is the
         * ~895px version this replaces: correct fraction, far too small beside
         * the hero. Positioned from `bottom` rather than `top` so the limb keeps
         * its clearance whatever the band's height does.
         *
         * The one export we hold disagrees about WHICH half.
         * `.figma/frames/cta-band.png` fits a limb of r ≈ 1490 centred
         * (1225, 1470) — apex above the top edge, equator below the floor, the
         * TOP hemisphere, and the silhouette widening all the way down confirms
         * it. But that file is the video capture with a mouse cursor in the
         * middle of it, which orbital-sphere.tsx already refuses to take
         * geometry from, and it is one frame of a globe that was turning. Intent
         * here is Nick's. The sphere layer inside Home's closer is `1799:1470`
         * and is not exported to `.figma/frames/`; pull it before treating this
         * as settled.
         *
         * What every reading agrees on: the original `w-[120vw]` centred on the
         * band was wrong. It put the limb off-screen left, right AND bottom and
         * left only the middle arcs showing, and a globe you cannot see the edge
         * of does not read as a globe at all.
         */}
        {showOrbs ? (
          <>
            <OrbitalSphere
              intensity="soft"
              motion="orbit"
              className="bottom-[4%] left-1/2 w-[150vw] -translate-x-1/2 lg:w-[90vw]"
            />
            {/* `1928:6596` — 87px of --gradient-ink-fade, transparent at the top. */}
            <div className="bg-(image:--gradient-ink-fade) pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[87px]" />
          </>
        ) : null}

        {/*
         * What the canonical `CTA` component actually hangs (`2124:72`) — the
         * molecule, not the sphere. 775.9 square at x 332.05, y -63.95 on a
         * 1440 band, at 15%:
         *
         *   width   775.9 / 1440    = 53.9%
         *   centre  332.05 + 387.95 = 720.0, the middle of 1440
         *   rise    -63.95 / 775.9  = 8.24%
         *
         * The rise is a fraction of the MARK, not the band — that is what a
         * percentage translate resolves against — so it holds at every width
         * the square keeps its proportion at.
         *
         * White rather than `currentColor`'s inherited ink: the band is
         * `ink-deep` and the frame draws the glyph in the light, which is the
         * inverse of the quote band's use of the same mark on bone.
         */}
        {showMolecule ? (
          <MoleculeMark className="absolute left-1/2 top-0 -z-0 w-[54%] min-w-[420px] -translate-x-1/2 -translate-y-[8.24%] text-white opacity-15" />
        ) : null}

        <div className="py-band-lg relative z-10 mx-auto flex max-w-[600px] flex-col items-center gap-[18px] text-center">
          {heading ? (
            <h2 className="text-cta font-display text-on-ink text-balance">{heading}</h2>
          ) : null}
          {body ? (
            <p className="text-lead text-on-ink-subtle max-w-[446px] text-balance">{body}</p>
          ) : null}
          {button ? (
            <div className="mt-6">
              <ButtonLink button={button} />
            </div>
          ) : null}
        </div>
      </section>
    </SurfaceProvider>
  )
}
