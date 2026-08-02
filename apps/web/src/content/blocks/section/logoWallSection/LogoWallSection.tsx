import { Eyebrow, SURFACE_CLASS } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import { CtaLink } from '@/content/CtaLink'
import { SanityImage } from '@/content/SanityImage'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type LogoWallSectionProps = SectionProps<'logoWallSection'>

/**
 * Section block: statement + client logo wall, built to the Home frame's
 * "Intro section" (`1864:2390`) — #42.
 *
 * `96px 96px 128px`, contents centred, 96px between the three parts:
 *
 * 1. **Eyebrow** — 18px (`Eyebrow size="lg"`), NEUTRAL `#636363` (`1864:2392`).
 * 2. **Statement** — 64px in a **1026px** column that is centred while its own
 *    text stays flush **left**, filled with `--gradient-statement` so the
 *    closing line fades out. That fill is the exploration's signature move and
 *    the most visible thing the scaffold was missing here.
 * 3. **Logo row** — six 310 × 132 tiles, 48px apart. Six tiles plus gaps come
 *    to 2100px against a 1440px frame, so the row is **wider than the page and
 *    clipped at both edges** — the frame shows a cut Vertex at the left and a
 *    cut Hire Heroes at the right. It is a marquee still, not a wrapped grid,
 *    and it bleeds past the gutter rather than sitting inside it. **At 402 it
 *    is neither**: the mobile frame (`1814:1898`) stacks the tiles one per
 *    row, 24px apart, inside the gutter — the bleed switches on at `lg`.
 * 4. **CTA** — `Button / Solid` Size=**Large**, dark fill (`1864:2405`).
 *
 * `layout: 'grid'` keeps a wrapped arrangement available for a wall with more
 * logos than the frame draws; the frame itself is the marquee.
 *
 * This band builds its own `<section>` rather than using `SectionShell`
 * because the logo row has to escape the gutter.
 *
 * ── THE ROW MOVES ──────────────────────────────────────────────────────────
 *
 * A frame can only draw the still, and a still clipped at both edges is a
 * marquee's middle frame. The sequence comes from the prototype's
 * `.o3-clients-track` and nowhere else: the tiles run **twice**, the track
 * crawls exactly one copy to the left over `--duration-marquee`, linear and
 * infinite, and a pointer anywhere on it pauses the lap.
 *
 * Each tile carries its own trailing gap (`lg:mr-12`) instead of the row
 * carrying a flex `gap` — that is what makes "one copy" exactly the 50% the
 * `o3marquee` keyframes translate by. With a flex gap the wrap lands one gap
 * short and the row visibly jumps once a lap.
 *
 * The clone is `aria-hidden`: six is what the page claims, twelve is what the
 * lap needs. It is also `hidden` below `lg`, where the frame stacks the tiles
 * and a second copy would just be six more rows, and under
 * `prefers-reduced-motion`, which leaves precisely the clipped still above.
 */
export function LogoWallSection({
  eyebrow,
  statement,
  clients,
  layout,
  cta,
  surface,
}: LogoWallSectionProps) {
  const isMarquee = stegaClean(layout) !== 'grid'
  const tiles = clients ?? []
  // One pass for the reader, one for the lap. `grid` never laps, so it gets
  // the reader's copy only.
  const passes = isMarquee ? [false, true] : [false]

  return (
    <section
      className={`${SURFACE_CLASS[resolveSurface(surface, 'bone')]} pt-band-sm pb-band-md overflow-hidden`}
    >
      <div className="px-gutter flex flex-col items-center gap-5 lg:gap-8">
        {eyebrow ? (
          <Eyebrow size="lg" className="text-center">
            {eyebrow}
          </Eyebrow>
        ) : null}
        {statement ? (
          <p className="text-hero font-display text-gradient max-w-[1026px] self-center text-left">
            {statement}
          </p>
        ) : null}
      </div>

      <ul
        className={
          isMarquee
            ? // The bleed — and the crawl — are a **desktop** treatment. At
              // 1440 this is a row allowed to run wider than the page, clipped
              // by the band's own overflow-hidden. At 402 the frame
              // (`1814:1898`) stacks the tiles one per row, 24px apart,
              // inside a 362px column — a row that bleeds off both edges of a
              // phone shows one and a half logos and reads as broken, and a
              // row that crawls off them reads as broken and busy.
              'px-gutter lg:mt-band-sm lg:animate-marquee mt-12 flex flex-col items-center gap-6 lg:w-max lg:min-w-full lg:flex-row lg:justify-center lg:gap-0 lg:px-0 lg:hover:[animation-play-state:paused] lg:motion-reduce:animate-none'
            : 'px-gutter lg:mt-band-sm mt-12 grid grid-cols-2 items-center gap-x-12 gap-y-10 sm:grid-cols-3 lg:grid-cols-6'
        }
      >
        {passes.flatMap((isClone) =>
          tiles.map((client) => (
            // 310 × 132 with 32px of side padding (`1864:2395`), so the logo gets
            // 246px and sits centred in the row's height. The 48px to the next
            // tile is this tile's margin, not the row's gap — see the header.
            <li
              key={isClone ? `lap-${client._id}` : client._id}
              aria-hidden={isClone || undefined}
              className={`h-[132px] items-center justify-center px-8 ${isMarquee ? 'w-[310px] lg:mr-12 lg:shrink-0' : ''} ${isClone ? 'hidden lg:flex lg:motion-reduce:hidden' : 'flex'}`}
            >
              {/*
               * Desaturated. Every logo on the frame's row is mono — IRONMAN
               * and Vertex black, caron grey — while the assets themselves are
               * the clients' full-colour marks. Filtering keeps the row reading
               * as one band instead of six brand palettes, without needing a
               * second mono upload per client.
               */}
              <SanityImage
                source={client.logo}
                alt={client.name ?? ''}
                width={492}
                className="max-h-[68px] w-auto max-w-full object-contain contrast-125 grayscale"
              />
            </li>
          )),
        )}
      </ul>

      {cta ? (
        <div className="px-gutter lg:mt-band-sm mt-12 flex justify-center">
          <CtaLink cta={cta} arrow size="large" />
        </div>
      ) : null}
    </section>
  )
}
