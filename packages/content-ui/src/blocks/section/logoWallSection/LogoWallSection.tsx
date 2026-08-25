import { Eyebrow, SURFACE_CLASS, SurfaceProvider, surfaceAttrs } from '@o3/ui'
import { cn } from '@o3/ui/lib/utils'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { stegaClean } from '@sanity/client/stega'

import { ButtonLink } from '../../../ButtonLink'
import { SanityImage } from '../../../SanityImage'
import { resolveSurface } from '../../surface'

type LogoWallSectionProps = SectionProps<'logoWallSection'>

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
 * | Logo bar | one centred row of six 280 × 280 tiles  | wraps — see below  |
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
            // `font-light` is the call site's, not the token's: `Heading/h2` is
            // Figtree Light on every redesigned frame, but `display-xl` still
            // carries the 400-weight section headlines on the frames the
            // redesign has not reached. See tokens/typography.css.
            //
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
         * Below `lg` it wraps instead of clipping — three across at `sm`, two
         * on a phone. The 402 frame's `2975:8088` is the desktop's 1680px row
         * pasted at x −639 — the same un-adapted-capture tell as the services
         * band — and rendering it as drawn shows one whole mark and two halves,
         * so the wrap is a renderer decision under ADR 0006 until the file
         * carries a real mobile treatment (Nick's call, 2026-08-24). What it
         * protects is that a phone sees all six partners.
         *
         * The clip must stay `overflow-hidden`; the moment it becomes a scroll
         * region `home.render.test`'s sideways-scroll guard fails.
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
          {/* The px compensates the tiles' negative margins so the outer edge
           * keeps its hairline; without it the top and left rules are clipped. */}
          <ul
            className={cn('flex flex-wrap justify-center lg:flex-nowrap', !isBar && 'ml-px mt-px')}
          >
            {(clients ?? []).map((client) => (
              // `plates` — 280 × 280 with 64px of side padding at 1440, so the
              // artwork gets a 152px box (`1864:2395`); the smaller steps
              // below `lg` follow the wrap, not a frame. Adjacent tiles share
              // one hairline — Figma centres the stroke, so the seams
              // collapse; `-ml-px` `-mt-px` is the CSS equivalent.
              //
              // `bar` — the same 280 width and the same 64px padding, at 100
              // tall and with no stroke at all (`2471:2112`). Dropping the
              // plate is what the variant IS, so the negative margins that
              // collapse the seams go with it.
              <li
                key={client._id}
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
          </ul>
        </div>

        {button ? <ButtonLink button={button} size="large" /> : null}
      </section>
    </SurfaceProvider>
  )
}
