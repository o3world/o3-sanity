import type { ReactNode } from 'react'
import { stegaClean } from '@sanity/client/stega'

import {
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
import { MoleculeDecoration } from '../../MoleculeDecoration'

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
}: HeroSectionProps) {
  const lines = headlineLines ?? []
  const showOrbs = stegaClean(decoration) !== 'none'

  if (stegaClean(variant) === 'band') {
    const centred = stegaClean(alignment) === 'center'
    const detailGroups = details ?? []
    // The knob's own roster, all three. Anything else a client could write past
    // the form falls back to the colour the set is instanced on.
    const resolvedBand = resolveSurface(surface, 'heroSection')
    const band =
      resolvedBand === 'white' || resolvedBand === 'paper' || resolvedBand === 'bone'
        ? resolvedBand
        : 'ink'
    // Current partner hero (3895:17003): the partner mark alone, with16px below it.
    const lockup = logo ? (
      <div className="max-w-full pb-4">
        {band === 'ink' ? (
          <LogoKnockout source={logo} alt="" width={257} className="h-[70px] max-w-full" />
        ) : (
          <SanityImage
            source={logo}
            alt=""
            width={257}
            sizes="257px"
            className="h-[70px] max-w-full object-contain object-left"
          />
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
            <ul className="text-lead flex flex-col">
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
        heading={lines.join('\n')}
        subheading={subheading}
        lockup={lockup}
        aside={aside}
        surface={band}
        background={sectionBackground(backgroundMedia, band)}
        align={centred ? 'center' : 'start'}
        decoration={
          showOrbs && !logo ? (
            centred && band !== 'ink' ? (
              <svg
                aria-hidden="true"
                focusable="false"
                data-hero-decoration="ring"
                viewBox="0 0 608 608"
                className="pointer-events-none absolute left-1/2 top-[109px] -z-10 size-[440px] -translate-x-1/2 fill-white opacity-50 lg:top-[132px] lg:size-[608px]"
              >
                <path d="M0 303.983C0 471.598 136.395 608 304 608C471.606 608 608 471.633 608 303.983C608 136.332 471.641 0 304 0C136.359 0 0 136.367 0 303.983ZM485.614 303.983C485.614 404.116 404.163 485.642 304 485.642C203.837 485.642 122.386 404.151 122.386 303.983C122.386 203.814 203.872 122.358 304 122.358C404.128 122.358 485.614 203.814 485.614 303.983Z" />
              </svg>
            ) : (
              <MoleculeDecoration
                decoration="molecule"
                block="heroSection"
                surface={band}
                visibleFrom="base"
                className={cn(
                  'left-[167px] top-[-390px] size-[980px] opacity-10 lg:left-auto',
                  centred
                    ? 'lg:right-[-397px] lg:top-[-426px]'
                    : 'lg:right-[-287px] lg:top-[-384px]',
                )}
              />
            )
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
