import type { ReactNode } from 'react'
import { stegaClean } from '@sanity/client/stega'

import {
  CloseIcon,
  CollectionHero,
  Eyebrow,
  MaskedLines,
  OrbitalSphere,
  Reveal,
  SurfaceProvider,
  surfaceAttrs,
} from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { cn } from '@o3/ui/lib/utils'

import { ButtonLink } from '../../../ButtonLink'
import { LogoKnockout } from '../../../LogoKnockout'
import { SanityImage } from '../../../SanityImage'
import { sectionBackground } from '../../sectionBackground'
import { resolveSurface } from '../../surface'

type HeroSectionProps = SectionProps<'heroSection'> & {
  /**
   * The brand's mark, for the partner lockup (#228). It reaches a block
   * renderer through the app's own binding in `clientComponents.tsx` rather
   * than from Sanity — the other half of the lockup is the content, and this
   * half is the app that is rendering it.
   */
  brandMark: ReactNode
}

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
 * | CTA        | white fill, radius 5 (`2205:1298`)    | `Button / Solid` Base    |
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
 * **The band's foot is a hard edge.** Neither frame draws a curve into the
 * section below: `2089:4316`'s children are the headline, the standfirst, the
 * button and the graphic, and `1814:1619` is the same with `clipsContent` on.
 * The partners band opens flush against this one at y 990.
 */
export function HeroSection({
  variant,
  eyebrow,
  headlineLines,
  subheading,
  logo,
  details,
  button,
  decoration,
  surface,
  backgroundMedia,
  brandMark,
}: HeroSectionProps) {
  const lines = headlineLines ?? []
  const showOrbs = stegaClean(decoration) !== 'none'

  // The interior-page hero: a shallow strip, not the full orbital band. It is
  // `CollectionHero` — the same component the /work and /insights routes
  // render, which is what stops a page-authored hero and a route-owned hero
  // drifting apart — drawn as the `Interior Hero` set (`2107:1051`), which
  // #308 ruled canonical for every route that opens on this band.
  if (stegaClean(variant) === 'band') {
    const detailGroups = details ?? []
    // Ink or white — the knob's own roster. Anything else a client could write
    // past the form falls back to the colour the set is instanced on.
    const band = resolveSurface(surface, 'heroSection') === 'white' ? 'white' : 'ink'
    /*
     * The partner lockup (`2479:2205`): the brand's own mark, a 12px ×, and
     * the partner's mark. Only the partner half is content; the × is the
     * lockup's own chrome and the first half comes from the app.
     *
     * The knockout is the ink band's treatment — the same "Mask group" the
     * case-study cards give a client logo, a white silhouette so a full-colour
     * mark does not read as a foreign object on the dark. A light band has no
     * dark to knock out of, and a white silhouette on it is invisible, so the
     * partner's own artwork stands there instead.
     */
    const lockup = logo ? (
      <div className="flex items-center gap-6">
        {brandMark}
        <CloseIcon
          className={cn('size-3', band === 'ink' ? 'text-white' : 'text-fg')}
          aria-hidden="true"
        />
        {band === 'ink' ? (
          <LogoKnockout source={logo} alt="" width={257} className="h-[70px]" />
        ) : (
          <SanityImage source={logo} alt="" width={257} sizes="257px" className="h-[70px] w-auto" />
        )}
      </div>
    ) : null

    /*
     * The right column when it holds credentials rather than a standfirst
     * (`2401:3196`) — a 12px-gap stack of one 18px eyebrow over its lines,
     * each line a list item so the three read as a set to a screen reader.
     */
    const aside = detailGroups.length ? (
      <div className="flex flex-col gap-8">
        {detailGroups.map((detail, index) => (
          <div key={detail._key ?? index} className="flex flex-col gap-3">
            {detail.label ? (
              <Eyebrow size="lg" tone={band === 'ink' ? 'inverse' : 'brand'}>
                {detail.label}
              </Eyebrow>
            ) : null}
            <ul className="text-lead flex list-disc flex-col gap-1 pl-5">
              {(detail.items ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ) : null

    return (
      <CollectionHero
        eyebrow={eyebrow}
        heading={lines.join(' ')}
        subheading={subheading}
        lockup={lockup}
        aside={aside}
        surface={band}
        background={sectionBackground(backgroundMedia, band)}
        /*
         * The redesigned set, and no `align`. Both of its instances put the
         * copy against the left gutter with the globe on the right
         * (`2107:1051`, `2960:6876`) — there is no centred composition in it to
         * reach for.
         */
        variant="interior"
        decoration={
          showOrbs ? (
            // About hangs the sphere off the right edge of the band
            // (`1924:5344`), where the standfirst would otherwise sit. On a
            // light band it is the hairline drawing rather than the lit rim —
            // the glow belongs to the dark bands (see `OrbitalSphere`).
            <OrbitalSphere
              tone={band === 'ink' ? 'ink' : 'light'}
              className="-z-10 hidden lg:bottom-[-30%] lg:right-[-14%] lg:block lg:w-[720px]"
            />
          ) : null
        }
      />
    )
  }

  return (
    // The orbital band always paints ink — the sphere and the white copy over
    // it are drawn on that colour, which is why the block offers no `surface`
    // to override it. Declaring it here is what gives the button below a
    // readable fill without anyone forcing one, and what inverts the text
    // roles inside (tokens/color.css).
    <SurfaceProvider surface="ink">
      <section
        {...surfaceAttrs('ink')}
        className="bg-ink px-gutter relative isolate overflow-hidden text-white"
      >
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
              <ButtonLink button={button} />
            </Reveal>
          ) : null}
        </div>
      </section>
    </SurfaceProvider>
  )
}
