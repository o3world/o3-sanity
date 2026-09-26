import { OrbitalSphere, SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { DECORATED_BAND_CLASS, resolveDecoration } from '../../decoration'
import { MoleculeDecoration } from '../../MoleculeDecoration'
import { sectionBackground } from '../../sectionBackground'
import { ButtonLink } from '../../../ButtonLink'

type CtaSectionProps = SectionProps<'ctaSection'>

/**
 * Closing CTA foreground from the current Home instances (3720:62172 / 3726:68508).
 * Authored backgrounds and the existing orbital/molecule motion remain independent.
 */
export function CtaSection({
  heading,
  body,
  button,
  decoration,
  backgroundMedia,
}: CtaSectionProps) {
  // `null` on every band that carries no picture — the same question
  // `SectionShell` asks its `background` prop.
  const picture = sectionBackground(backgroundMedia, 'ink')
  // The sphere and the molecule are alternatives: the band draws one or neither.
  // Unset resolves to this block's declared `initialValue`, which is the
  // molecule — so the renderer and the knob cannot disagree.
  const showOrbs = !picture && resolveDecoration(decoration, 'ctaSection') === 'orbs'

  return (
    // The band always paints its own ink field, so it declares one: `ink-deep`
    // is the darker end of the same surface, and the button on it resolves the
    // way it would on any ink band.
    <SurfaceProvider surface="ink">
      <section
        {...surfaceAttrs('ink')}
        /* `cta-band` declares the parallax clock the sphere's layer reads;
           it does nothing on its own. See tokens/motion.css. */
        className={`cta-band bg-ink-deep px-4 text-white lg:px-24 ${DECORATED_BAND_CLASS}`}
      >
        {picture}
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
            {/*
             * THE LAYER, NOT THE SPHERE, CARRIES THE PARALLAX. `cta-lag`
             * animates `translate`, and the sphere already spends that
             * property on its own centring — one element cannot hold both.
             * The wrapper is `absolute inset-0`, the band's padding box
             * exactly, so the sphere is seated where it always was and the
             * layer sits under the copy and the fade strip, both of which
             * carry `z-10`.
             */}
            <div className="cta-lag pointer-events-none absolute inset-0">
              {/*
               * Red. Every closing band in the file draws the red globe — none
               * of them draws the neutral one, whatever the grey export calls
               * itself.
               */}
              <OrbitalSphere
                preset="hero"
                motion="orbit"
                className="bottom-[4%] left-1/2 w-[150vw] -translate-x-1/2 lg:w-[90vw]"
              />
            </div>
            {/* --gradient-ink-fade, transparent at the top: 172px at 1440
             * (`1928:6596`), 64 at 402 (`1928:6595`). */}
            <div className="bg-(image:--gradient-ink-fade) pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 lg:h-[172px]" />
          </>
        ) : null}

        {/*
         * What the canonical `CTA` component actually hangs (`2124:72`) — the
         * molecule, not the sphere. `2114:1195`, 775.9 square at x 332.05,
         * y -63.95 on the set's 1440 × 648 band, at 15%:
         *
         *   width   775.9 / 1440    = 53.9%
         *   centre  332.05 + 387.95 = 720.0, the middle of 1440
         *   rise    -63.95 / 775.9  = 8.24%
         *
         * On the set's 648 the mark is taller than the band it hangs in, so
         * it overhangs top and floor by the same 63.95 and the band clips
         * both. Here the band is `py-band-lg` around the copy, so how much
         * of the mark shows moves with the copy's height.
         *
         * The rise is a fraction of the MARK, not the band — that is what a
         * percentage translate resolves against — so it holds at every width
         * the square keeps its proportion at.
         *
         * White rather than `currentColor`'s inherited ink: the band declares
         * the `ink` surface, and the glyph inverts on ink — the opposite of
         * the quote band's use of the same mark on bone.
         *
         * `visibleFrom="base"` because this glyph is sized in the band's own
         * terms (54% of it, with a floor) rather than in the frame's pixels,
         * so it has an honest 402 form where the other three bands' do not.
         */}
        <MoleculeDecoration
          decoration={picture ? 'none' : decoration}
          block="ctaSection"
          surface="ink"
          visibleFrom="base"
          className="left-1/2 top-0 w-[54%] min-w-[420px] -translate-x-1/2 -translate-y-[8.24%] opacity-15"
        />

        <div className="relative z-10 mx-auto flex max-w-[600px] flex-col items-center gap-12 pb-16 pt-32 text-center lg:pb-48">
          {heading || body ? (
            <div className="flex flex-col items-center gap-8">
              {heading ? (
                <h2 className="text-cta font-display text-on-ink text-balance">{heading}</h2>
              ) : null}
              {body ? (
                <p className="text-lead text-on-ink-subtle max-w-[524px] text-balance">{body}</p>
              ) : null}
            </div>
          ) : null}
          {button ? <ButtonLink button={button} /> : null}
        </div>
      </section>
    </SurfaceProvider>
  )
}
