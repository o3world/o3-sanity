import type { ComponentProps } from 'react'

import { ButtonLink } from '../../../ButtonLink'
import { SanityImage } from '../../../SanityImage'

import { PLATE_BLEED_CLASS, PLATE_BLEED_SIZES } from './plateBleed'

type ImageSource = ComponentProps<typeof SanityImage>['source']

export interface PanelPlateProps {
  /** The DOM id `PanelBand` observes to decide which rail stop is marked. */
  id: string
  /** The wordmark the platform panels lead with; it wins the heading's slot. */
  logo?: ImageSource
  heading?: string | null
  /** The rail's own word for this panel — what names a wordmark that has no heading. */
  railLabel?: string | null
  body?: string | null
  /** The quieter line under the body, where a panel carries one. */
  note?: string | null
  button?: ComponentProps<typeof ButtonLink>['button']
  media?: { image?: ImageSource; alt?: string | null } | null
  /** `bleed` runs the plate off the right edge of the screen — see `plateBleed.ts`. */
  plate?: 'square' | 'bleed'
  dataSanity?: string
}

/**
 * One panel of the rail band — a copy column paired with a media plate
 * (`2747:4503` at 1440, `2975:8204` at 402).
 *
 * ```
 * 1440   row, gap 33      copy 500  |  plate 395 × 396
 *   copy   column, gap 48    logo 257 × 70 over 20/28 prose, 12 apart
 *                            then the link
 *  402   column, gap 33    copy full width, plate under it
 * ```
 *
 * The frame's plate is 491 and overruns the panel column by the page gutter.
 * `plate: square` draws the 395 the band's own sum leaves for it — 82 + 238 +
 * 500 + 33 + 395 = 1248, the standard content column; `plate: bleed` draws the
 * frame's 491 and keeps going to the viewport's edge (`plateBleed.ts`).
 *
 * The call to action is the frame's `Link`, not its `Button`: 18/24 flush with
 * the copy above it, the arrow 4px off the label. The fill is still the
 * editor's, and every panel that draws one on this band sets `ghost`.
 */
export function PanelPlate({
  id,
  logo,
  heading,
  railLabel,
  body,
  note,
  button,
  media,
  plate = 'square',
  dataSanity,
}: PanelPlateProps) {
  return (
    <article
      id={id}
      // The panel's own path — `sections[_key=="…"].panels[_key=="…"]`.
      // `panels` has exactly one member type, so it serialises as an
      // `arrayItem` and resolves natively at this depth (#104).
      data-sanity={dataSanity}
      // A rail stop's jump lands here clear of the chrome: under the nav below
      // lg, level with the sticky rail at lg.
      className="scroll-mt-(--spacing-nav-height) flex flex-col gap-[33px] lg:scroll-mt-[calc(var(--spacing-nav-pinned)+96px)] lg:flex-row lg:items-center"
    >
      {/* 500 is a ceiling, not a floor: the plate is the rigid half of the
          row, so between 1024 and 1440 the copy column is what gives. */}
      <div className="flex min-w-0 flex-col gap-12 lg:w-[500px]">
        <div className="flex flex-col gap-3">
          {/* The platform panels lead with a wordmark and the rest with a
              heading. They occupy the same slot, which is why `logo` wins
              when present rather than sitting above the heading. */}
          {logo ? (
            <SanityImage
              source={logo}
              // The panels that carry a wordmark carry no heading, so the
              // rail's word for the panel is the only name it has.
              alt={heading ?? railLabel ?? ''}
              width={640}
              // The frame's slot is 257 × 70 with the artwork contained inside
              // it, so height is what a wordmark is sized by and width is the
              // artwork's own business.
              className="h-[70px] w-auto max-w-[257px] object-contain object-left"
              sizes="257px"
            />
          ) : heading ? (
            <h3 className="text-display-xl font-display text-balance">{heading}</h3>
          ) : null}

          {body ? (
            <p
              className={`text-fg-body text-[20px] ${logo ? 'leading-[26px] lg:leading-7' : 'leading-7'}`}
            >
              {body}
            </p>
          ) : null}
          {note ? <p className="text-lead text-fg-muted">{note}</p> : null}
        </div>

        {button ? (
          <ButtonLink
            button={button}
            // `Link` (`2747:4647`), not `Button`: no padding, and 4px to the
            // arrow rather than the button set's 12.
            className="text-brand gap-1 p-0 font-semibold"
          />
        ) : null}
      </div>

      {media?.image && plate === 'bleed' ? (
        <div
          className={`${PLATE_BLEED_CLASS} rounded-l-[32px] shadow-[-32px_32px_64px_rgba(0,0,0,0.2)]`}
        >
          <SanityImage
            source={media.image}
            alt={media.alt ?? ''}
            ratio="fill"
            width={1600}
            sizes={PLATE_BLEED_SIZES}
            className="rounded-[inherit]"
          />
        </div>
      ) : media?.image ? (
        <SanityImage
          source={media.image}
          alt={media.alt ?? ''}
          // Square at both widths. The 402 frame draws its three plates at
          // three heights (286, 396, 280) against one 396 copy column, so the
          // shape to hold is the one the 1440 frame states.
          //
          // Capped at the desktop plate's 395 from `sm` up: only below that is
          // the stacked column narrow enough for a full-width square to stay
          // plate-sized rather than filling most of a tablet viewport.
          ratio="1/1"
          width={790}
          sizes="(min-width: 640px) 395px, 90vw"
          className="w-full sm:max-w-[395px] lg:h-[396px] lg:w-[395px] lg:shrink-0"
        />
      ) : null}
    </article>
  )
}
