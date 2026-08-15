import { Eyebrow, SURFACE_CLASS, SurfaceProvider } from '@o3/ui'

import { ButtonLink } from '@/content/ButtonLink'
import { SanityImage } from '@/content/SanityImage'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type LogoWallSectionProps = SectionProps<'logoWallSection'>

/**
 * Section block: the partners band, rebuilt to the 2026-08 frame
 * `Section - Partners` (`1864:2390`) — #89.
 *
 * `128px 96px`, contents centred, 128px between the three parts, on the warm
 * wash (`--gradient-surface-wash-warm`, #F7F7F6 → #F1F0EC) rather than the
 * flat bone the band used to sit on.
 *
 * | Part     | Frame        | Treatment                                       |
 * | -------- | ------------ | ----------------------------------------------- |
 * | Eyebrow  | `1864:2392`  | 18/22 (`Eyebrow size="lg"`), `fg-muted`         |
 * | Heading  | `1864:2393`  | `Heading/h2` — 48/58 **Light**, ink, 1026px     |
 * | Body     | `2250:1307`  | 24/34 (`--text-lead`), `fg-body`, 724px         |
 * | Logo bar | `1864:2394`  | one centred row of six 280 × 280 tiles          |
 * | CTA      | `2209:2255`  | solid ink, "See all partners", trailing arrow   |
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
  clients,
  button,
  surface,
}: LogoWallSectionProps) {
  const resolved = resolveSurface(surface, 'bone')

  return (
    <SurfaceProvider surface={resolved}>
      <section
        className={`${SURFACE_CLASS[resolved]} px-gutter pt-band-sm pb-band-md lg:pt-band-md lg:gap-band-md bg-(image:--gradient-surface-wash-warm) flex flex-col items-center gap-12`}
      >
        {/* 32 at 1440 (`1864:2391`), 20 at 402 (`1814:1642`). */}
        <div className="flex w-full flex-col items-center gap-5 text-center lg:gap-8">
          {eyebrow ? <Eyebrow size="lg">{eyebrow}</Eyebrow> : null}
          {heading ? (
            // `font-light` is the call site's, not the token's: `Heading/h2` is
            // Figtree Light on every redesigned frame, but `display-xl` still
            // carries the 400-weight section headlines on the frames the
            // redesign has not reached. See tokens/typography.css.
            <h2 className="text-display-xl font-display text-ink max-w-[1026px] text-balance font-light">
              {heading}
            </h2>
          ) : null}
          {body ? <p className="text-lead text-fg-body max-w-[724px] text-pretty">{body}</p> : null}
        </div>

        {/*
         * The strip bleeds: `-mx-gutter` gives the row the full viewport, and
         * `justify-center` + `overflow-hidden` clip it symmetrically, which is
         * the frame's own composition at 1440 (120px off each end).
         *
         * Below `lg` it wraps instead of clipping — three across at `sm`, two on
         * a phone. The 402 frame is un-migrated (`1814:1898` still draws the old
         * four-tile column), so this is a renderer decision under ADR 0006
         * rather than a read value; what it protects is that a phone sees all
         * six partners rather than one and a half. Clipping there would also be
         * a hidden scroll region, which `home.render.test` forbids outright.
         */}
        <div className="-mx-gutter flex justify-center overflow-hidden">
          {/* The px compensates the tiles' negative margins so the outer edge
           * keeps its hairline; without it the top and left rules are clipped. */}
          <ul className="ml-px mt-px flex flex-wrap justify-center lg:flex-nowrap">
            {(clients ?? []).map((client) => (
              // 280 × 280 with 64px of side padding, so the artwork gets a
              // 152px box (`1864:2395`). Adjacent tiles share one hairline —
              // Figma centres the stroke, so the seams collapse; `-ml-px`
              // `-mt-px` is the CSS equivalent.
              <li
                key={client._id}
                className="border-line -ml-px -mt-px flex size-[168px] shrink-0 items-center justify-center border px-8 sm:size-[224px] sm:px-12 lg:size-[280px] lg:px-16"
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
                />
              </li>
            ))}
          </ul>
        </div>

        {button ? <ButtonLink button={button} arrow size="large" /> : null}
      </section>
    </SurfaceProvider>
  )
}
