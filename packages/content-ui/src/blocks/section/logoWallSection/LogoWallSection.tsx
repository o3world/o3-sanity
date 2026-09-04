import { Eyebrow, SURFACE_CLASS, SurfaceProvider, surfaceAttrs } from '@o3/ui'
import { cn } from '@o3/ui/lib/utils'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { stegaClean } from '@sanity/client/stega'

import { ButtonLink } from '../../../ButtonLink'
import { SanityImage } from '../../../SanityImage'
import { resolveSurface } from '../../surface'
import { MarqueeTrack } from './MarqueeTrack'

type LogoWallSectionProps = SectionProps<'logoWallSection'>

/**
 * The widest tile the strip ever draws — the 1440 plate (`1864:2395`). Copies
 * are counted off this rather than off the phone's 168, because a track sized
 * for the small tile would run out of marks on a desktop.
 */
const TILE_WIDTH = 280

/**
 * How wide the track has to be before it can loop without showing its end.
 *
 * The loop shifts by exactly one copy, so what has to cover the viewport is
 * everything BUT that copy. 4800 leaves a shy 4000 behind a one-copy shift,
 * which clears the widest display anyone opens this on with room to spare.
 */
const TRACK_MIN_WIDTH = 4800

/**
 * How many times the marks are laid down.
 *
 * At least two — one copy cannot loop into itself — and then as many as it
 * takes to reach `TRACK_MIN_WIDTH`, so a band with three partners marches at
 * the same speed and with the same continuity as one with six. Six plates make
 * three copies; three make six.
 */
function marqueeCopies(count: number) {
  if (count < 1) return 1
  return Math.max(2, Math.ceil(TRACK_MIN_WIDTH / (count * TILE_WIDTH)))
}

/**
 * Section block: the partners band, rebuilt to the 2026-08 frame
 * `Section - Partners` (`1864:2390`) — #89.
 *
 * `128px 96px`, contents centred, on the warm wash
 * (`--gradient-surface-wash-warm`, #F7F7F6 → #F1F0EC) rather than the flat bone
 * the band used to sit on. The three parts are 128 apart at 1440 and 24 apart
 * at 402 (`2975:8083`); the vertical padding is 128 at both.
 *
 * | Part     | 1440 (`1864:2390`)                      | 402 (`2975:8083`)  |
 * | -------- | --------------------------------------- | ------------------ |
 * | Eyebrow  | 18/22 (`Eyebrow size="lg"`), `fg-muted` | the same           |
 * | Heading  | `Heading/h2` — 48/58 Light, ink, 1026px | 36/44 Light        |
 * | Body     | 24/34 (`--text-lead`), `fg-body`, 724px | 20/**32**          |
 * | Logo bar | one centred row of six 280 × 280 tiles  | the same, smaller |
 * | CTA      | solid ink, "See all partners", arrow    | the same           |
 *
 * The text block's own 32px gap is flat (`1864:2391`, `2975:8084`).
 *
 * ── WHAT THE RESTRUCTURE CHANGED ───────────────────────────────────────────
 *
 * The band used to be one 64px `statement` filled with `--gradient-statement`
 * over a 3 × 2 wall of six large marks. All three of those moved:
 *
 * - **The statement split.** One display sentence became a heading with a
 *   standfirst under it, which is why the schema carries `heading` + `body`
 *   now instead of `statement`.
 * - **The gradient fill is gone from this band.** `1864:2393` is a SOLID ink
 *   (#0A0A0B, the new ink variable) where it used to be the statement
 *   gradient's co-anchor. The token survives — the pull quote still draws it —
 *   but reaching for `text-gradient` here is now wrong.
 * - **The wall became a strip.** Six square plates in ONE row, hairlined
 *   rather than floating, and the row is deliberately wider than the page:
 *   6 × 280 = 1680 against a 1248 content column, centred, so the two end
 *   tiles are clipped by the viewport. That is what the frame draws (see the
 *   export of `1864:2390`), and it is why this band bleeds past the gutter.
 *
 * ── THE STRIP MOVES ────────────────────────────────────────────────────────
 *
 * A row clipped at BOTH ends is a still of something travelling, and Nick
 * settled it as one (2026-08-25): the marks crawl left a copy per
 * `--duration-marquee`, coming to rest under a pointer and picking up again
 * when it leaves (`MarqueeTrack`), and holding still under
 * `prefers-reduced-motion`. Figma cannot say this either way — it draws stills
 * — so the period is the motion token's and the decision is the ruling's,
 * not the frame's.
 *
 * The marks are laid down `marqueeCopies` times and the track shifts by
 * exactly one copy, which is why the loop has no seam: at the end of a lap the
 * next copy is already where the last one started. Every copy after the first
 * is `aria-hidden` — a reader hears the six partners once.
 *
 * It also settles 402, where the row used to wrap. The 402 frame's `2975:8088`
 * is the desktop's 1680px row pasted at x −639 — the same un-adapted-capture
 * tell as the services band — so there was never a mobile treatment to read,
 * and the wrap existed only so a phone could see all six marks. A moving strip
 * does that without a second composition, so the wrap is gone and ADR 0006's
 * switch with it.
 *
 * ── `layout: bar` — the partner page's band (`2332:1708`), #92 ─────────────
 *
 * ```
 * 64px 96px, centred, gap 24
 *   heading   Heading/h3 — 36/44, not the 48px h2
 *   logo bar  six 280 × 100 frames, 64px side padding, NO stroke
 * ```
 *
 * Three differences from `plates`, and they all say the same thing: this row
 * is a footnote to the heading rather than the band's subject. The plate is
 * gone, the tile is 100 tall instead of 280, and the band is a 64px strip
 * rather than the 128 one. The bleed and the clipping stay — 6 × 280 is still
 * wider than the page, and that is still what the frame draws.
 *
 * The eyebrow, standfirst and button all still render if a band carries them;
 * the partner frame simply writes none of the three.
 *
 * ── THE MARKS ARE DESATURATED AGAIN ────────────────────────────────────────
 *
 * #42 removed `grayscale` on the argument that a wall of six large marks
 * should show CHOP's blue and La Colombe's red. The redesign reverses it: the
 * uploaded artwork is full colour, but every tile applies a Figma image
 * adjustment that renders it grey — visible in the frame export, though the
 * REST payload does not carry the adjustment. It follows the composition
 * change rather than contradicting it: a small mark inside a hairlined plate
 * is a mark in a set, and six palettes fighting inside six identical boxes is
 * the noise the plates exist to remove.
 */
export function LogoWallSection({
  eyebrow,
  heading,
  body,
  layout,
  clients,
  button,
  surface,
}: LogoWallSectionProps) {
  const resolved = resolveSurface(surface, 'logoWallSection')
  const isBar = stegaClean(layout) === 'bar'
  const marks = clients ?? []
  const copies = marqueeCopies(marks.length)
  const track = Array.from({ length: copies }, (_, copy) =>
    marks.map((client) => ({ client, copy })),
  ).flat()

  return (
    <SurfaceProvider surface={resolved}>
      <section
        {...surfaceAttrs(resolved)}
        className={cn(
          SURFACE_CLASS[resolved],
          'px-gutter bg-(image:--gradient-surface-wash-warm) flex flex-col items-center',
          // Both partners frames are 128 top and bottom, gapping their three
          // parts 24 at 402 and 128 at 1440; the bar band (`2332:1708`) is a
          // 64px strip with 24 between heading and logos, which is most of
          // what makes it read as a footnote.
          isBar ? 'pb-band-sm pt-band-sm gap-6' : 'py-band-md lg:gap-band-md gap-6',
        )}
      >
        {/* 32 at both widths (`1864:2391`, `2975:8084`). */}
        <div className="flex w-full flex-col items-center gap-8 text-center">
          {eyebrow ? <Eyebrow size="lg">{eyebrow}</Eyebrow> : null}
          {heading ? (
            // Explicit Light also serves brands whose display tokens are Regular.
            // The bar band steps the heading down to `Heading/h3` (`2332:1711`)
            // — it is introducing the logos, not making the page's claim.
            //
            // `plates` steps to 36/44 at 402 (`2975:8086`), a width under the
            // token's own 40px floor, so the band names it rather than the
            // ramp: 40 is what `display-xl` reads on the frames whose 402 node
            // nobody has redrawn.
            <h2
              className={cn(
                'font-display text-ink text-balance font-light',
                isBar
                  ? 'text-display-lg max-w-[1026px]'
                  : 'text-display-xl max-w-[1026px] max-lg:text-[36px] max-lg:leading-[44px]',
              )}
            >
              {heading}
            </h2>
          ) : null}
          {body ? (
            // `text-lead` already floors at the 20px `2975:8087` reads; its
            // leading does not — 32 at 402 against the token's 26.
            <p className="text-lead text-fg-body max-w-[724px] text-pretty max-lg:leading-8">
              {body}
            </p>
          ) : null}
        </div>

        {/*
         * The strip bleeds: `-mx-gutter` gives the row the full viewport, and
         * `justify-center` + `overflow-hidden` clip it symmetrically, which is
         * the frame's own composition at 1440 (120px off each end).
         *
         * The clip must stay `overflow-hidden`; the moment it becomes a scroll
         * region `home.render.test`'s sideways-scroll guard fails. The marquee
         * is what makes that acceptable at 402 as well as 1440 — a clipped row
         * nobody can scroll would hide four of the six marks on a phone.
         *
         * `self-stretch` is what holds the clip to the viewport. The band is a
         * column flex container, so this row is a flex item whose width is
         * cross-axis and therefore content-derived: left to `auto` it takes
         * the 1680px row's max-content and the clip never bites, which is the
         * 118px the whole document scrolled sideways at 1440 (#341). Stretched,
         * the box is the content column plus the two negative gutters — the
         * viewport exactly — and the end tiles clip against it.
         */}
        <div className="-mx-gutter flex justify-center self-stretch overflow-hidden">
          {/*
           * The track. `shrink-0` is load-bearing twice over: it lets the row
           * take its content width against a container narrower than it, and
           * it makes the border box the whole track, which is what
           * `--marquee-shift` is a percentage OF. Clamped to the container the
           * shift would resolve against the viewport and the loop would tear.
           *
           * The px compensates the tiles' negative margins so the outer edge
           * keeps its hairline; without it the top and left rules are clipped.
           * It is margin, so it moves the track without joining its width —
           * every copy stays exactly one `copies`-th of the box.
           */}
          <MarqueeTrack copies={copies} className={cn(!isBar && 'ml-px mt-px')}>
            {track.map(({ client, copy }) => (
              // `plates` — 280 × 280 with 64px of side padding at 1440, so the
              // artwork gets a 152px box (`1864:2395`); the smaller steps
              // below `lg` are the phone's, not a frame's. Adjacent tiles share
              // one hairline — Figma centres the stroke, so the seams
              // collapse; `-ml-px` `-mt-px` is the CSS equivalent, and it
              // collapses the seam between two copies as readily as within one.
              //
              // `bar` — the same 280 width and the same 64px padding, at 100
              // tall and with no stroke at all (`2471:2112`). Dropping the
              // plate is what the variant IS, so the negative margins that
              // collapse the seams go with it.
              <li
                key={`${copy}-${client._id}`}
                // Every copy after the first is the same six marks again. A
                // reader hears the partners once.
                aria-hidden={copy > 0 || undefined}
                className={cn(
                  'flex shrink-0 items-center justify-center',
                  isBar
                    ? 'h-[100px] w-[168px] px-8 sm:w-[224px] sm:px-12 lg:w-[280px] lg:px-16'
                    : 'border-line -ml-px -mt-px size-[168px] border px-8 sm:size-[224px] sm:px-12 lg:size-[280px] lg:px-16',
                )}
              >
                {/*
                 * Width-filling, natural height. Every mark is trimmed to its
                 * own bounding box, so a 152px box puts each one at the 28–42px
                 * the frame's rectangles read — no per-logo height cap, and no
                 * cover-crop.
                 */}
                <SanityImage
                  source={client.logo}
                  alt={client.name ?? ''}
                  width={456}
                  className="w-full grayscale"
                  // The artwork box is the tile less its padding at each step.
                  // Without this the browser has no slot and downloads all 456
                  // for a 152px box.
                  sizes="(min-width: 1024px) 152px, (min-width: 640px) 128px, 104px"
                />
              </li>
            ))}
          </MarqueeTrack>
        </div>

        {button ? <ButtonLink button={button} size="large" /> : null}
      </section>
    </SurfaceProvider>
  )
}
