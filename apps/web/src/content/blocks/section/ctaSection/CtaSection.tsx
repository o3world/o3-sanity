import { OrbitalSphere } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import { CtaLink } from '@/content/CtaLink'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type CtaSectionProps = SectionProps<'ctaSection'>

/**
 * Section block: the closing CTA band, built to the Home frame's `1680:2132`
 * — #42.
 *
 * ```
 * 1440 × 790, the orbital field behind it
 *   copy      600px column centred, gap 18
 *     heading 60px (--text-cta) at 92% white, centred
 *     body    24px at 60% white in a 446px measure
 *   cta       Button / Solid Size=Base, WHITE fill
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
export function CtaSection({ heading, body, cta, decoration }: CtaSectionProps) {
  const showOrbs = stegaClean(decoration) !== 'none'

  return (
    <section className="bg-ink-deep px-gutter relative isolate overflow-hidden text-white">
      {/*
       * Sized off the BAND, not the viewport — the one place the two spheres
       * differ, because what this band composes around is how much of the
       * globe it reveals rather than how wide the globe is.
       *
       * **The band shows the globe's lower three quarters.** Its top quarter
       * sits above the band's edge and its bottom limb lands on the floor, so
       * the sphere reads as one whose underside you are looking into: at
       * `h-[133.3%]` the visible 100% of the band IS 75% of the sphere, and
       * `top-[-33.3%]` is the quarter held back.
       *
       * That is Nick's call on intent, and it is worth writing down that the
       * one export we hold disagrees with it. `.figma/frames/cta-band.png`
       * (2450 × 1344, the same 1.7014× export as the hero) fits a limb of
       * r ≈ 1490 centred (1225, 1470): an apex just above the top edge and an
       * equator below the floor — the TOP hemisphere, confirmed by the
       * silhouette widening all the way down and standing near-vertical at the
       * bottom. But that file is the video capture with a mouse cursor in the
       * middle of it, which orbital-sphere.tsx already refuses to take
       * geometry from, and it is one frame of a globe that was turning. The
       * canonical CTA frame is `1799:1470` and is not exported here; pull it
       * before treating either reading as settled.
       *
       * What both readings agree on: the previous `w-[120vw]` centred on the
       * band was wrong. It put the limb off-screen left and right and left
       * only the middle arcs showing, and a globe you cannot see the edge of
       * does not read as a globe at all.
       */}
      {showOrbs ? (
        <OrbitalSphere
          intensity="soft"
          motion="orbit"
          className="left-1/2 top-[-33.3%] h-[133.3%] w-auto -translate-x-1/2"
        />
      ) : null}

      <div className="py-band-lg relative z-10 mx-auto flex max-w-[600px] flex-col items-center gap-[18px] text-center">
        {heading ? (
          <h2 className="text-cta font-display text-on-ink text-balance">{heading}</h2>
        ) : null}
        {body ? (
          <p className="text-lead text-on-ink-subtle max-w-[446px] text-balance">{body}</p>
        ) : null}
        {cta ? (
          <div className="mt-6">
            {/* Same reasoning as the hero: this band always paints its own ink
                field, so the fill is structural rather than editorial. */}
            <CtaLink cta={cta} arrow variant="light" />
          </div>
        ) : null}
      </div>

      {/* `1928:6596` — 87px of --gradient-ink-fade, transparent at the top. */}
      <div className="bg-(image:--gradient-ink-fade) pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[87px]" />
    </section>
  )
}
