import type { ReactNode } from 'react'
import { stegaClean } from '@sanity/client/stega'

import {
  CloseIcon,
  CollectionHero,
  Entrance,
  heroStagger,
  HERO_ENTRANCE,
  Eyebrow,
  StaggeredLines,
  OrbitalSphere,
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

/** The Figma page composition with the existing orbital renderer and entrance lifecycle. */
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
    const centred = stegaClean(alignment) === 'center'
    const detailGroups = details ?? []
    // The knob's own roster, all three. Anything else a client could write past
    // the form falls back to the colour the set is instanced on.
    const resolvedBand = resolveSurface(surface, 'heroSection')
    const band = resolvedBand === 'white' || resolvedBand === 'paper' ? resolvedBand : 'ink'
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
        align={centred ? 'center' : 'start'}
        decoration={
          showOrbs ? (
            /*
             * ONE SEATING FOR EVERY SURFACE. The interior hero hangs its
             * sphere in the same place whichever colour the band is painted;
             * only the drawing changes with the surface, not the geometry.
             *
             * The geometry is the ink set's. The art rides in the set's own
             * frame — a flattened capture (`I2101:861;2846:4466` on Work, the
             * same node on Insights and on Software Engineering
             * `I2354:2583;2846:4466`), so its 1577 box is the capture's bounds
             * and not the sphere's. The sphere inside it is what this is
             * seated to: tracing the lit limb across the three exports gives
             * **d ≈ 918, top edge 184px below the band's top** at BOTH widths,
             * moving only sideways — left edge 639 on the 1440 frames and 205
             * on the 402 one (`I2107:1086;2960:6869`, the same capture slid
             * 434 left). So the size is a literal, `lg` anchors to the right
             * edge it overhangs by 117, and it is drawn at both widths.
             *
             * On the light surfaces it is the hairline drawing rather than the
             * lit rim, because the glow belongs to the dark bands (see
             * `OrbitalSphere`).
             */
            /*
             * THE BLOOM IS FADED OUT WHERE THE NAV SITS.
             *
             * The sphere is placed correctly — its crest lands at 184, level
             * with the eyebrow, which is what the frame draws. What collides
             * with the chrome is the glow: the export's outer ring reaches
             * about 164 user units past the sphere, ~220px at this band's
             * scale, so it washes up behind the nav pill and greys the button
             * inside it.
             *
             * Neither obvious fix works alone, and the arithmetic is why.
             * Moving the globe clear would need +182px on a 581px band, which
             * recomposes the whole thing. Shrinking the glow to fit the 38px
             * between the nav's foot and the sphere's crest would mean cutting
             * it from 164 units to 28 — deleting it, not reducing it.
             *
             * So only the colliding part goes. The mask is transparent above
             * the nav's foot and fully open again by the time the sphere's
             * crest arrives. That window is 38px wide, so the very top of the
             * limb is fractionally dimmed; everything below it, and the whole
             * of the bloom to the sides and underneath, is the export
             * untouched.
             */
            <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent_0,transparent_146px,#000_190px)]">
              <OrbitalSphere
                /* It turns here as it does in the Home opener — the captures
                 these are seated to stand in for the animation, so a still
                 sphere is the stand-in rather than the thing. `motion-reduce`
                 stops it. */
                motion="orbit"
                /* The red globe on ink, the same one the Home opener draws — an
                 interior hero is not a quieter version of the opener, it is the
                 same field on a shorter band. The line drawing still belongs to
                 the light surfaces, where a bloom has nothing to sit on. */
                preset={band === 'ink' ? 'hero' : 'line'}
                /* A literal size at both widths — that is the reading above,
                 not an oversight: the frames slide the same capture sideways
                 rather than rescaling it. */
                className="left-[205px] top-[184px] w-[918px] lg:left-auto lg:right-[-117px]"
              />
            </div>
          ) : null
        }
      />
    )
  }

  // CSS starts at first paint; optional content consumes a beat only when present.
  const lineStagger = heroStagger(lines.length + Number(!!subheading) + Number(!!button))
  const columnDelay = (lines.length + 2) * lineStagger

  return (
    // The orbital band always paints ink — the sphere and the white copy over
    // it are drawn on that colour, which is why the block offers no `surface`
    // to override it. Declaring it here is what gives the button below a
    // readable fill without anyone forcing one, and what inverts the text
    // roles inside (tokens/color.css).
    <SurfaceProvider surface="ink">
      <section
        {...surfaceAttrs('ink')}
        /* `hero-band` declares the parallax clock the two layers below read;
           it does nothing on its own. See tokens/motion.css. */
        className="hero-band bg-ink px-gutter relative isolate overflow-hidden text-white"
      >
        {showOrbs ? (
          /*
           * Only the sphere's cap is ever visible, and the `Graphic`
           * (`1866:2412`) is where the frame draws it. The launch review read
           * the drawn globe about a tenth too large for the band, so the
           * geometry the raster gives is scaled down uniformly, on round `vw`:
           * **120vw** across at 1440, apex 20vw above the band's foot. Held in
           * `vw` so the ratio survives any viewport, and anchored to the foot
           * so the copy can grow above it.
           *
           * The ratio does NOT carry to 402: the band is barely a third the
           * width but only a fourteenth shorter (874 against 940), so a
           * 1440-scale sphere leaves a sliver. The proportion the eye reads is
           * apex-height against band-height, so at 402 the sphere is 148vw and
           * hangs lower to hold roughly the same cap.
           */
          /*
           * THE LAYER, NOT THE SPHERE, CARRIES THE PARALLAX. `hero-lag`
           * animates `translate`, and the sphere already spends that property
           * on its own centring — one element cannot hold both. The wrapper is
           * `absolute inset-0`, so it is the section's padding box exactly and
           * the sphere is seated where it always was.
           */
          <div className="hero-lag pointer-events-none absolute inset-0">
            <OrbitalSphere
              preset="hero"
              motion="orbit"
              className="bottom-[-111vw] left-1/2 w-[148vw] -translate-x-1/2 lg:bottom-[-100vw] lg:w-[120vw]"
            />
          </div>
        ) : null}

        <div
          data-route-foreground=""
          className="hero-lead relative z-10 mx-auto flex max-w-[1248px] flex-col items-center pb-[237px] pt-[173px] text-center lg:pb-[259px] lg:pt-[254px]"
        >
          <h1 className="text-hero-xl font-display space-y-4 text-balance">
            <StaggeredLines
              baseDelay={lineStagger * 2}
              stagger={lineStagger}
              lines={lines.map((line, index) => (
                // Match 50% white over ink with an opaque gray so the moving
                // stars cannot show through the closing line.
                <span
                  key={line}
                  className={
                    index === lines.length - 1 && lines.length > 1
                      ? 'text-[color:color-mix(in_srgb,white_50%,var(--color-ink))]'
                      : 'text-white'
                  }
                >
                  {line}
                </span>
              ))}
            />
          </h1>

          {subheading ? (
            <Entrance delay={columnDelay} className={cn('mt-12 lg:mt-20', HERO_ENTRANCE)}>
              <p className="text-lead mx-auto max-w-[732px] text-balance text-white">
                {subheading}
              </p>
            </Entrance>
          ) : null}

          {button ? (
            <Entrance
              delay={columnDelay + (subheading ? 300 : 0)}
              className={cn('mt-12', HERO_ENTRANCE)}
            >
              <ButtonLink button={button} />
            </Entrance>
          ) : null}
        </div>
      </section>
    </SurfaceProvider>
  )
}
