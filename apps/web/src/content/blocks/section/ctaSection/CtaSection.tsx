import { OrbitalSphere, SurfaceProvider } from '@o3/ui'

import { DECORATED_BAND_CLASS, resolveDecoration } from '@/content/blocks/decoration'
import { MoleculeDecoration } from '@/content/blocks/MoleculeDecoration'
import { ButtonLink } from '@/content/ButtonLink'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type CtaSectionProps = SectionProps<'ctaSection'>

/**
 * Section block: the closing CTA band, built to the Home frame's `1680:2132`
 * — #42.
 *
 * ```
 * 1440 × 790, the orbital field behind it
 *   copy      600px column centred, gap 18
 *     heading 64px (--text-cta, the 2026-08 shared CTA component's step) at
 *     92% white, centred
 *     body    24px at 60% white in a 446px measure
 *   button    Button / Solid Size=Base, WHITE fill
 *   bleed     an 87px strip of --gradient-ink-fade along the foot (1928:6596)
 * ```
 *
 * The bleed strip is this band's whole reason for being a bespoke `<section>`:
 * it fades the band into the `#030303` footer beneath it, so the two dark
 * areas read as one field rather than two bands that happen to touch.
 *
 * The sphere runs at `soft` and centred, rather than hung below the foot — the
 * CTA band shows the middle of it where the hero shows only the cap.
 */
export function CtaSection({ heading, body, button, decoration }: CtaSectionProps) {
  // The sphere and the molecule are alternatives: the band draws one or neither.
  const showOrbs = resolveDecoration(decoration) === 'orbs'

  return (
    // The band always paints its own ink field, so it declares one: `ink-deep`
    // is the darker end of the same surface, and the button on it resolves the
    // way it would on any ink band.
    <SurfaceProvider surface="ink">
      <section className={`bg-ink-deep px-gutter text-white ${DECORATED_BAND_CLASS}`}>
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
         * here is Nick's. The canonical CTA frame is `1799:1470` and is not
         * exported to `.figma/frames/`; pull it before treating this as settled.
         *
         * What every reading agrees on: the original `w-[120vw]` centred on the
         * band was wrong. It put the limb off-screen left, right AND bottom and
         * left only the middle arcs showing, and a globe you cannot see the edge
         * of does not read as a globe at all.
         */}
        {showOrbs ? (
          <OrbitalSphere
            intensity="soft"
            motion="orbit"
            className="bottom-[4%] left-1/2 w-[150vw] -translate-x-1/2 lg:w-[90vw]"
          />
        ) : null}

        {/*
         * What the canonical `CTA` component actually hangs (`2124:72`) — the
         * molecule, not the sphere. 775.9 on a 1440 band is 53.9% of the width,
         * centred on it (x 332.05 + 388 = 720.0) and starting a hair above the
         * band's top edge, at 15%.
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
          decoration={decoration}
          surface="ink"
          visibleFrom="base"
          className="left-1/2 top-0 w-[54%] min-w-[420px] -translate-x-1/2 -translate-y-[3%] opacity-15"
        />

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

        {/* `1928:6596` — 87px of --gradient-ink-fade, transparent at the top. */}
        <div className="bg-(image:--gradient-ink-fade) pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[87px]" />
      </section>
    </SurfaceProvider>
  )
}
