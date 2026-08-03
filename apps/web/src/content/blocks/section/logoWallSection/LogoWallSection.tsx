import { Eyebrow, SURFACE_CLASS } from '@o3/ui'

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
 * 3. **Logo wall** — a **3 × 2 grid of six**, inside the gutter, capped at the
 *    statement's 1026px so the wall sits under the sentence it belongs to.
 *    Two columns at 402, three from `lg` — three across is what lets each mark
 *    be *big*: a 342px cell against 246px in the old row, and a 96px ceiling
 *    against 68px. The marquee had to keep tiles small because the row's whole
 *    argument was how many of them there were; a wall of six can afford to let
 *    each one be read.
 * 4. **CTA** — `Button / Solid` Size=**Large**, dark fill (`1864:2405`).
 *
 * ── THE ROW NO LONGER MOVES ────────────────────────────────────────────────
 *
 * It used to. The frame draws a row clipped at both edges, which reads as a
 * marquee's middle frame, and the prototype's `.o3-clients-track` crawled it —
 * two passes, one lap per `--duration-marquee`, paused under a pointer. A
 * crawling logo row is a tell: it says "look, clients" in a way that makes a
 * reader stop reading the logos. Six marks standing still, at full colour and
 * at size, say the same thing and are legible while they say it.
 *
 * Full colour is the other half of that. The row was `grayscale contrast-125`
 * so six brand palettes read as one band; the cost was that CHOP's blue and La
 * Colombe's red — the part of a mark a reader recognises before the wordmark —
 * were the first thing thrown away. A grid holds the row together on its own
 * geometry, so the desaturation has nothing left to buy.
 */
export function LogoWallSection({
  eyebrow,
  statement,
  clients,
  cta,
  surface,
}: LogoWallSectionProps) {
  return (
    <section
      className={`${SURFACE_CLASS[resolveSurface(surface, 'bone')]} pt-band-sm pb-band-md px-gutter`}
    >
      <div className="flex flex-col items-center gap-5 lg:gap-8">
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

      <ul className="lg:mt-band-sm mx-auto mt-12 grid max-w-[1026px] grid-cols-2 items-center gap-x-10 gap-y-12 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-16">
        {(clients ?? []).map((client) => (
          // A cell, not a 310 × 132 tile: the grid gives each mark the same
          // box, and the mark is centred in it with its height capped so a
          // wide wordmark and a tall roundel carry the same visual weight.
          // The cap is the size control — 96px at `lg`, down to 64px at 402
          // where the cell is half a 362px column and a 96px mark would
          // collide with its neighbour.
          <li key={client._id} className="flex h-24 items-center justify-center lg:h-32">
            <SanityImage
              source={client.logo}
              alt={client.name ?? ''}
              width={684}
              className="max-h-16 w-auto max-w-full object-contain lg:max-h-24"
            />
          </li>
        ))}
      </ul>

      {cta ? (
        <div className="lg:mt-band-sm mt-12 flex justify-center">
          <CtaLink cta={cta} arrow size="large" />
        </div>
      ) : null}
    </section>
  )
}
