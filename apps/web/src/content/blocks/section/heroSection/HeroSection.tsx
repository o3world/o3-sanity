import { stegaClean } from '@sanity/client/stega'

import { CollectionHero, MaskedLines, OrbitalSphere, Reveal } from '@o3/ui'

import { CtaLink } from '@/content/CtaLink'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type HeroSectionProps = SectionProps<'heroSection'>

/**
 * Section block: the page hero, built to the canonical Home frame's opening
 * band (`1810:1616`) — #42.
 *
 * The frame flattens this band into a single raster (`1810:1588`) with the
 * NavBar and the whole headline baked into the pixels, keeping only four live
 * nodes. So the composition below is read off those pixels, against the nodes
 * the frame does keep:
 *
 * | Part       | Frame                                                        |
 * | ---------- | ------------------------------------------------------------ |
 * | Band       | 1440 × 892 of `#030303` under the orbital field              |
 * | Headline   | **centred**, 64px (`--text-hero`); the closing line sits back |
 * | Subheading | centred, 24px (`--text-lead`), ~600px measure                |
 * | CTA        | `Button / Solid` Size=Base, **white** fill (`1868:3262`)     |
 * | Dome       | a 2182 × 863 `#F0F0F0` ellipse at (−371, 784)                |
 *
 * Two things the pre-#42 hero had wrong: it set the headline flush left
 * against the gutter (the frame centres everything on the sphere), and its
 * CTA was brand red (no red button exists on the canonical frame).
 *
 * The dome belongs to the hero rather than to the section beneath it because
 * the frame draws it inside this band and lets it overlap — it is what turns
 * a hard band boundary into the curve the partners section rises through. Its
 * fill is therefore `bone`, and a hero followed by a non-bone band would show
 * a seam. That is the frame's own constraint, not one added here.
 */
export function HeroSection({
  variant,
  eyebrow,
  headlineLines,
  subheading,
  cta,
  decoration,
}: HeroSectionProps) {
  const lines = headlineLines ?? []
  const showOrbs = stegaClean(decoration) !== 'none'

  // The interior-page hero: a shallow ink-warm strip, not the full orbital
  // band. Work (`1634:1181`), About (`1924:5344`) and Solutions (`1925:6141`)
  // all draw it, so it is `CollectionHero` — the same component the /work and
  // /perspectives routes render, which is what stops a page-authored hero and
  // a route-owned hero drifting apart.
  if (stegaClean(variant) === 'band') {
    const centred = !subheading
    return (
      <CollectionHero
        eyebrow={eyebrow}
        heading={lines.join(' ')}
        subheading={subheading}
        align={centred ? 'center' : 'start'}
        decoration={
          showOrbs ? (
            // About hangs the sphere off the right edge of the band
            // (`1924:5344`), where the standfirst would otherwise sit.
            <OrbitalSphere className="-z-10 hidden lg:bottom-[-30%] lg:right-[-14%] lg:block lg:w-[720px]" />
          ) : null
        }
      />
    )
  }

  return (
    <section className="bg-ink px-gutter relative isolate overflow-hidden text-white">
      {showOrbs ? (
        /*
         * Only the sphere's cap is ever visible. Solving the frame's limb
         * (see OrbitalSphere) gives r ≈ 581 centred 339px below the band's
         * foot — 80.7% of the frame width, apex 242px up from the foot. Held
         * in `vw` so the ratio survives any viewport, and anchored to the
         * foot so the copy can grow above it.
         *
         * The ratio does NOT carry to 402: the band is barely a third the
         * width but only a quarter shorter, so 80.7vw leaves a 67px sliver of
         * sphere under a 660px band. The proportion the eye reads is
         * apex-height against band-height, so at 402 the sphere doubles and
         * hangs lower to hold roughly the frame's quarter-of-the-band cap.
         */
        <OrbitalSphere className="bottom-[-124vw] left-1/2 w-[165vw] -translate-x-1/2 lg:bottom-[-63.9vw] lg:w-[80.7vw]" />
      ) : null}

      {/* 164px of clearance for the floating pill, which sits at y 30. */}
      <div className="max-w-content relative z-10 mx-auto flex min-h-[420px] flex-col items-center justify-center gap-[18px] pb-[220px] pt-[164px] text-center lg:min-h-[520px] lg:pb-[368px]">
        <h1 className="text-hero font-display text-balance">
          <MaskedLines
            lines={lines.map((line, index) => (
              // The frame steps the value between lines rather than fading the
              // block: within a line it is flat, and the step is hard.
              <span
                key={line}
                className={
                  index === lines.length - 1 && lines.length > 1 ? 'text-white/50' : 'text-on-ink'
                }
              >
                {line}
              </span>
            ))}
          />
        </h1>

        {subheading ? (
          <Reveal delay={120}>
            <p className="text-lead text-on-ink-subtle mx-auto max-w-[760px] text-balance">
              {subheading}
            </p>
          </Reveal>
        ) : null}

        {cta ? (
          <Reveal delay={220} className="mt-6">
            {/*
             * `light` is forced for the same reason the nav pill forces it:
             * this band owns its background. The hero is always the orbital
             * field, so `surface` never reaches it and a `dark` fill would be
             * an ink button on ink whatever an editor picked.
             */}
            <CtaLink cta={cta} arrow variant="light" />
          </Reveal>
        ) : null}
      </div>

      {/*
       * The dome (`1810:1614`) — a 2182 × 863 ellipse at (−371, 784) on an
       * 892-tall band, i.e. 151.5% of the band's width with only its top 108px
       * above the foot. Reproduced as a masked strip that height, so the ratio
       * (and with it how shallow the curve reads) is the frame's, not a guess:
       * a shorter, rounder dome is the most obvious way to get this wrong.
       */}
      <div className="absolute inset-x-0 bottom-0 z-0 h-[54px] overflow-hidden lg:h-[108px]">
        <div className="bg-bone absolute left-1/2 top-0 aspect-[2182/863] w-[151.5%] -translate-x-1/2 rounded-[50%]" />
      </div>
    </section>
  )
}
