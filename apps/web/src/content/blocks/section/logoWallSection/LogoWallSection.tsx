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
 *    and it bleeds past the gutter rather than sitting inside it.
 * 4. **CTA** — `Button / Solid` Size=**Large**, dark fill (`1864:2405`).
 *
 * `layout: 'grid'` keeps a wrapped arrangement available for a wall with more
 * logos than the frame draws; the frame itself is the marquee.
 *
 * This band builds its own `<section>` rather than using `SectionShell`
 * because the logo row has to escape the gutter.
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

  return (
    <section
      className={`${SURFACE_CLASS[resolveSurface(surface, 'bone')]} pt-band-sm pb-band-md overflow-hidden`}
    >
      <div className="px-gutter flex flex-col items-center gap-8">
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
            ? // The bleed: a centred row allowed to run wider than the page,
              // clipped by the band's own overflow-hidden.
              'mt-band-sm flex w-max min-w-full items-center justify-center gap-12'
            : 'px-gutter mt-band-sm grid grid-cols-2 items-center gap-x-12 gap-y-10 sm:grid-cols-3 lg:grid-cols-6'
        }
      >
        {tiles.map((client) => (
          // 310 × 132 with 32px of side padding (`1864:2395`), so the logo gets
          // 246px and sits centred in the row's height.
          <li
            key={client._id}
            className={`flex h-[132px] items-center justify-center px-8 ${isMarquee ? 'w-[310px] shrink-0' : ''}`}
          >
            <SanityImage
              source={client.logo}
              alt={client.name ?? ''}
              width={492}
              className="max-h-[68px] w-auto max-w-full object-contain"
            />
          </li>
        ))}
      </ul>

      {cta ? (
        <div className="px-gutter mt-band-sm flex justify-center">
          <CtaLink cta={cta} arrow size="large" />
        </div>
      ) : null}
    </section>
  )
}
