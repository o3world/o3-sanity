import { stegaClean } from '@sanity/client/stega'

import { CollectionHero, MaskedLines, OrbitalSphere, Reveal } from '@o3/ui'

import { ButtonLink } from '@/content/ButtonLink'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type HeroSectionProps = SectionProps<'heroSection'>

/**
 * Section block: the page hero, built to the Home frame's opening band and
 * re-measured against the 2026-08 redesign of it (`2089:4316`, #89).
 *
 * The band's live nodes now carry every dimension — the raster the #42 build
 * had to read off pixels is gone:
 *
 * | Part       | 1440 (`2089:4316`)                    | 402 (`1814:1619`)        |
 * | ---------- | ------------------------------------- | ------------------------ |
 * | Band       | 1440 × **1100** of `#0A0A0B`          | 402 × 874 of `#030303`   |
 * | Headline   | centred, `Heading/h1` 64/76 **Light** | flush left, 36/40        |
 * | 2nd line   | white at 50%                          | white at 60%             |
 * | Subheading | centred, 24/34, **724** wide, 50%     | **absent**               |
 * | CTA        | white fill, radius 2 (`2205:1298`)    | `Button / Solid` Base    |
 * | Curve      | 1440 × **108**, `#F7F7F6`             | ellipse, **34** visible  |
 * | Rhythm     | 288 above, 41, 33, 470 below          | 276 above, 39, 353 below |
 *
 * The band is padding, not a `min-h` with the content centred inside it: both
 * frames place the headline at a measured distance from the top of the band
 * and let the sphere have the rest, so the two paddings are read values and
 * the height between them is whatever the copy needs.
 *
 * ⚠️ **The orbital sphere is not on the redesigned frame.** `2089:4316` draws
 * a blurred 1926 × 400 photographic graphic under a 50% scrim where the sphere
 * used to be, and the 402 frame does the same. The sphere stays here because
 * removing it is a composition change and this pass was a measurement one —
 * #89 carries the finding.
 *
 * The curve belongs to the hero rather than to the section beneath it because
 * the frame draws it inside this band and lets it overlap — it is what turns
 * a hard band boundary into the shape the partners band rises through. Its
 * fill is `bone-soft` (#F7F7F6), which is also where the partners band's warm
 * wash starts, so the two meet with no seam. A hero followed by a band that
 * does not open on #F7F7F6 would show one.
 */
export function HeroSection({
  variant,
  eyebrow,
  headlineLines,
  subheading,
  button,
  decoration,
}: HeroSectionProps) {
  const lines = headlineLines ?? []
  const showOrbs = stegaClean(decoration) !== 'none'

  // The interior-page hero: a shallow ink-warm strip, not the full orbital
  // band. Work (`1634:1181`), About (`1924:5344`) and Solutions (`1925:6141`)
  // all draw it, so it is `CollectionHero` — the same component the /work and
  // /insights routes render, which is what stops a page-authored hero and
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
        <OrbitalSphere
          motion="orbit"
          className="bottom-[-124vw] left-1/2 w-[165vw] -translate-x-1/2 lg:bottom-[-77.1vw] lg:w-[95.5vw]"
        />
      ) : null}

      {/*
       * The band's rhythm, read off both frames rather than centred inside a
       * `min-h`: the headline starts 288px down at 1440 (`2089:4313`) and
       * 276px down at 402 (`1814:1622`), and the sphere gets the 470 / 353
       * underneath. Together with the copy that resolves to the frames'
       * 1100 / 874 band heights.
       *
       * **Alignment switches at `lg`.** The 1440 frame centres the whole
       * block; the 402 frame sets it as a 362px column flush to the 20px
       * gutter, headline and button both left. That is composition, so it
       * lives here rather than in a token (ADR 0006).
       */}
      <div className="max-w-content relative z-10 mx-auto flex flex-col items-start pb-[353px] pt-[276px] text-left lg:items-center lg:pb-[470px] lg:pt-[288px] lg:text-center">
        <h1 className="text-hero font-display text-balance">
          <MaskedLines
            lines={lines.map((line, index) => (
              // The frame steps the value between lines rather than fading the
              // block: within a line it is flat, and the step is hard. Both
              // ends are solid white — the 92% `on-ink` alpha belongs to the
              // CTA band, and this headline is drawn at full opacity.
              <span
                key={line}
                className={
                  index === lines.length - 1 && lines.length > 1 ? 'text-white/50' : 'text-white'
                }
              >
                {line}
              </span>
            ))}
          />
        </h1>

        {subheading ? (
          // 724px and white at 50% (`2089:4315`) — the same alpha as the
          // headline's closing line, not the CTA band's 60% subhead.
          <Reveal delay={120} className="mt-10">
            <p className="text-lead mx-auto max-w-[724px] text-balance text-white/50">
              {subheading}
            </p>
          </Reveal>
        ) : null}

        {button ? (
          // 33 below the standfirst at 1440, 39 below the headline at 402
          // (`1814:1622`'s column gap, where there is no standfirst at all).
          <Reveal delay={220} className="mt-10 lg:mt-8">
            {/*
             * `light` is forced for the same reason the nav pill forces it:
             * this band owns its background. The hero is always the orbital
             * field, so `surface` never reaches it and a `dark` fill would be
             * an ink button on ink whatever an editor picked.
             */}
            <ButtonLink button={button} arrow variant="light" />
          </Reveal>
        ) : null}
      </div>

      {/*
       * The curve. Both frames draw the same shape and neither draws it the
       * same way twice: 1440 is now an explicit `Curve` vector (`2089:4309`,
       * 1440 × 108 at the band's foot, filled #F7F7F6 — the redesign replaced
       * the 2182 × 863 ellipse the #42 build read); 402 is still an ellipse
       * (`1864:2410`, 715.53 × 283 at y 840 on an 874-tall band, i.e. 178% of
       * the band's width showing its top 34px).
       *
       * Reproduced as one masked ellipse at both widths, because the two
       * shapes have the same proportion to a tenth of a percent (2182/863 =
       * 2.528, 715.53/283 = 2.529) — what differs is how much of it shows.
       * Getting that wrong is the obvious failure: a shorter, rounder dome.
       */}
      <div className="absolute inset-x-0 bottom-0 z-0 h-[34px] overflow-hidden lg:h-[108px]">
        <div className="bg-bone-soft absolute left-1/2 top-0 aspect-[2182/863] w-[178%] -translate-x-1/2 rounded-[50%] lg:w-[151.5%]" />
      </div>
    </section>
  )
}
