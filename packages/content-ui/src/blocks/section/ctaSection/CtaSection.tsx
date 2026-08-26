import { OrbitalSphere, SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { DECORATED_BAND_CLASS, resolveDecoration } from '../../decoration'
import { MoleculeDecoration } from '../../MoleculeDecoration'
import { sectionBackground } from '../../sectionBackground'
import { ButtonLink } from '../../../ButtonLink'

type CtaSectionProps = SectionProps<'ctaSection'>

/**
 * Section block: the closing CTA band.
 *
 * ```
 * 1440 × 790, the decoration behind it — `1680:2132`
 *   copy      600px column centred, gap 18
 *     heading 64px (--text-cta, the 2026-08 shared CTA component's step) at
 *     92% white, centred
 *     body    24px at 60% white in a 524px measure
 *   button    20 under the copy, Button Theme=White
 *
 * 402 × 616 — `1814:1775`, filed in the frame under "ClaudeTest"
 *   128 top and bottom, the copy column the full 362, gap 53 to the button
 *     heading 36/44 — `--text-cta`'s own floor
 *     body    18/22 at −0.8 tracking, a step under `--text-lead`'s floor
 * ```
 *
 * **Only the decoration is the `CTA` component's.** The component (`2124:72`,
 * set `2177:1354`) measures its own band differently: 1248 across to the 96px
 * gutter rather than a 600 column, the body fixed at 580, the copy gapped 24
 * and the button 48, all inside 192 of vertical padding. Taking those numbers
 * repaints every closer's typography, and the design is walking the other way
 * — most page frames now draw a copy of `1680:2132` rather than instance the
 * component, a census `ctaSectionKnobs` keeps — so this band stays measured
 * from the band above.
 *
 * **`orbs` is the pre-redesign band (`1680:2132`), and it is a pair.** The
 * sphere and the 172px `--gradient-ink-fade` strip along the foot
 * (`1928:6596`) are one composition: the strip dissolves the sphere's lower
 * limb into the `#030303` footer, so the two dark areas read as one field
 * rather than two bands that happen to touch. The component draws neither, so
 * neither the molecule nor `none` carries a strip — there is no limb to hide
 * and no colour step to soften.
 *
 * Home is the one page whose seed pins it (#163).
 *
 * **A picture is the third composition, and it is `backgroundMedia`** (#303) —
 * the field every section already carries, laid full-bleed the way the hero
 * and the rail band lay theirs. It is not a fourth decoration: a band either
 * sits on an image or hangs a glyph in front of its own ink, and both cannot
 * be the background at once, so a picture silences whatever the knob says.
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
        className={`bg-ink-deep px-gutter text-white ${DECORATED_BAND_CLASS}`}
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
             * The neutral globe: the grey export names itself the background
             * globe and this band is the case it names. The band drew the red
             * one run quiet before, which the export has no setting for — a
             * dimmer was how the traced version approximated a second palette.
             */}
            <OrbitalSphere
              preset="background"
              motion="orbit"
              className="bottom-[4%] left-1/2 w-[150vw] -translate-x-1/2 lg:w-[90vw]"
            />
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

        {/*
         * Two nested columns, because the frame gaps them differently: 18
         * inside the copy block (`1680:2087`) and 20 between that block and
         * the button (`1680:2090`). One flat column would gap the button like
         * a third line of copy. At 402 the copy block keeps its 18 and the
         * button falls 53 clear of it (`1814:1775`).
         */}
        <div className="py-band-lg relative z-10 mx-auto flex max-w-[600px] flex-col items-center gap-[53px] text-center lg:gap-5">
          {heading || body ? (
            <div className="flex flex-col items-center gap-[18px]">
              {heading ? (
                <h2 className="text-cta font-display text-on-ink text-balance">{heading}</h2>
              ) : null}
              {body ? (
                // 18/22 at −0.8 tracking at 402 (`1814:1778`) — a step under
                // `text-lead`'s 20px floor, so the band names it.
                <p className="text-lead text-on-ink-subtle max-w-[524px] text-balance max-lg:text-[18px] max-lg:leading-[22px] max-lg:tracking-[-0.8px]">
                  {body}
                </p>
              ) : null}
            </div>
          ) : null}
          {button ? <ButtonLink button={button} /> : null}
        </div>
      </section>
    </SurfaceProvider>
  )
}
