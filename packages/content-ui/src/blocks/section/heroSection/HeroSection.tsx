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
 * | Part       | 1440 (`2089:4316`)                    | 402 (`1814:1619`)          |
 * | ---------- | ------------------------------------- | -------------------------- |
 * | Band       | 1440 × **940** of `#0A0A0B`           | 402 × 874 of `#030303`     |
 * | Headline   | centred, `Heading/h1` 64/76 **Light** | centred, 36/44 Light       |
 * | 2nd line   | white at 50% (`2089:4318`)            | white at 50% (`2975:8419`) |
 * | Standfirst | centred, 24/34, **724** wide, solid   | centred, 24/34, 362 wide   |
 * | CTA        | white fill, radius 5 (`2205:1298`)    | the same set (`2975:8417`) |
 * | Rhythm     | 288 above, 0, 41, 33, 310 below       | 173 above, 16, 39, 39, 247 |
 * | Graphic    | 1926 × 400 on the foot (`1866:2412`)  | same fill (`1814:1927`)    |
 *
 * The `Graphic` row is a raster of this site's own orbital sphere, seated on
 * the band's foot under a 50% scrim that hides its top edge — a stand-in for
 * the animation, which `OrbitalSphere` is the implementation of. Its geometry
 * is what the sphere is seated to (see the call site); its pixels are not.
 *
 * Both widths draw the same composition — a centred column with a standfirst.
 * What splits is the step, the measure and the rhythm.
 *
 * The band is padding, not a `min-h` with the content centred inside it: both
 * frames place the headline at a measured distance from the top of the band
 * and let the sphere have the rest, so the two paddings are read values and
 * the height between them is whatever the copy needs.
 *
 * **The band's foot is a hard edge.** Neither frame draws a curve into the
 * section below: `2089:4316`'s children are the headline, the standfirst, the
 * button and the graphic, and `1814:1619` is the same with `clipsContent` on
 * plus its own `Links` bar. The partners band opens flush against this one.
 */
export function HeroSection({
  variant,
  alignment,
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
    // Left everywhere but Solutions (`1925:6141`), which stacks the eyebrow and
    // the headline on the centre line. Anything a client could write past the
    // form falls back to the arrangement every other instance draws.
    const centred = stegaClean(alignment) === 'center'
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
         * The redesigned set. Both of its instances put the copy against the
         * left gutter with the globe on the right (`2107:1051`, `2960:6876`);
         * `center` is the arrangement the Solutions frame draws instead
         * (`1925:6141`) — one column on the centre line, and the right of the
         * band given back to the band.
         */
        align={centred ? 'center' : 'start'}
        variant="interior"
        decoration={
          showOrbs && !centred ? (
            /*
             * THE TWO SURFACES HANG DIFFERENT SPHERES, and the geometry is
             * read per surface rather than shared.
             *
             * On INK the art rides in the set's own frame — a flattened
             * capture (`I2101:861;2846:4466` on Work, the same node on
             * Insights and on Software Engineering `I2354:2583;2846:4466`),
             * so its 1577 box is the capture's bounds and not the sphere's.
             * The sphere inside it is what this is seated to: tracing the lit
             * limb across the three exports gives **d ≈ 918, top edge 184px
             * below the band's top** at BOTH widths, moving only sideways —
             * left edge 639 on the 1440 frames and 205 on the 402 one
             * (`I2107:1086;2960:6869`, the same capture slid 434 left). So the
             * size is a literal, `lg` anchors to the right edge it overhangs
             * by 117, and it is drawn at both widths.
             *
             * On WHITE it is the About band's own art (`I2960:6876;2960:6862`)
             * — 782 wide off the right edge, where the standfirst would
             * otherwise sit — and the hairline drawing rather than the lit
             * rim, because the glow belongs to the dark bands (see
             * `OrbitalSphere`).
             */
            <OrbitalSphere
              tone={band === 'ink' ? 'ink' : 'light'}
              /* The interior band runs the field quieter than the Home opener:
                 the limb peaks around 40 points of red over its neighbours in
                 the ink exports, against the 120 a full-intensity draw puts
                 there. */
              intensity={band === 'ink' ? 'soft' : 'full'}
              className={
                band === 'ink'
                  ? 'left-[205px] top-[184px] -z-10 w-[918px] lg:left-auto lg:right-[-117px]'
                  : '-z-10 hidden lg:bottom-[-30%] lg:right-[-14%] lg:block lg:w-[720px]'
              }
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
           * Only the sphere's cap is ever visible, and the `Graphic`
           * (`1866:2412`) is where the frame draws it. Tracing the lit limb
           * down that raster gives r ≈ 963 centred 640px below the band's foot
           * — a sphere **133.75%** of the frame width, apex 323px up from the
           * foot, which is where the button's own foot sits. Held in `vw` so
           * the ratio survives any viewport, and anchored to the foot so the
           * copy can grow above it.
           *
           * The ratio does NOT carry to 402: the band is barely a third the
           * width but only a fourteenth shorter (874 against 940), so 80.7vw
           * leaves a sliver. The proportion the eye reads is apex-height
           * against band-height, so at 402 the sphere doubles and hangs lower
           * to hold roughly the frame's quarter-of-the-band cap.
           */
          <OrbitalSphere
            motion="orbit"
            className="bottom-[-124vw] left-1/2 w-[165vw] -translate-x-1/2 lg:bottom-[-111.3vw] lg:w-[133.75vw]"
          />
        ) : null}

        {/*
         * The band's rhythm, read off both frames rather than centred inside a
         * `min-h`: the headline starts 288px down at 1440 (`2089:4313`) and
         * 173px down at 402 (`1814:1622`), and the graphic gets the 310 / 247
         * underneath. Together with the copy that resolves to the frames'
         * 940 / 874 band heights.
         *
         * The column is centred at both widths — `1814:1622` centres on its
         * cross axis and every text node in it is centre-set.
         */}
        <div className="max-w-content relative z-10 mx-auto flex flex-col items-center pb-[247px] pt-[173px] text-center lg:pb-[310px] lg:pt-[288px]">
          {/*
           * 16 between the two headline blocks at 402 (`2975:8420` over
           * `2975:8419`); at 1440 they are set solid, one 76px step apart with
           * nothing added (`2089:4313` → `2089:4318`).
           */}
          <h1 className="text-hero font-display space-y-4 text-balance lg:space-y-0">
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
            // 724px and solid white (`2089:4315`); the whole 362 column at 402
            // (`2975:8418`), where 24/34 holds rather than stepping down. The
            // 50% belongs to the headline's closing line alone — the standfirst
            // carries no alpha at either width.
            <Reveal delay={120} className="mt-10">
              {/* 24/34 on both frames — flat, so `text-lead`'s 20px floor
               * would undersize it at 402. */}
              <p className="mx-auto max-w-[724px] text-balance text-[24px] leading-[34px] text-white">
                {subheading}
              </p>
            </Reveal>
          ) : null}

          {button ? (
            // 33 below the standfirst at 1440, 39 at 402 (`1814:1622`'s
            // column gap, which is the same 39 above the standfirst).
            <Reveal delay={220} className="mt-10 lg:mt-8">
              <ButtonLink button={button} />
            </Reveal>
          ) : null}
        </div>
      </section>
    </SurfaceProvider>
  )
}
