import type { BaseProps } from '@o3/content-runtime/blocks'

import { ButtonLink } from '../../../ButtonLink'
import { SanityImage } from '../../../SanityImage'
import { LAYOUT_COLUMN } from '../../../imageSizes'

type MediaCardProps = BaseProps<'mediaCard'> & {
  /**
   * The `sizes` of the column this card was placed in, from the section that
   * placed it (`layoutSection` passes `LAYOUT_COLUMN[count]`).
   */
  slotSizes?: string
}

/**
 * Base block: a picture over a name, a line about it, and the link out — the
 * About frame's "Beyond O3 World" cards (`1924:5388`).
 *
 * ```
 * card  column, gap 24    395 wide in the three-up row
 *   image  395 x 391      near enough square that the box is `1/1`
 *   copy   column, gap 24
 *     h3    48/58 Light
 *     body  18/21.6
 *     link  18/21.6 Bold, brand red, no glyph
 * ```
 *
 * The link is a `button`, drawn as the frame's text link rather than as the
 * button set: no plate, no padding, and the label carries the colour. What it
 * is missing is the arrow, because the frame draws none here.
 */
export function MediaCard({ media, heading, body, button, slotSizes }: MediaCardProps) {
  return (
    <article className="flex flex-col gap-6">
      <SanityImage
        source={media?.image}
        alt={media?.alt}
        // 395 x 391 on the frame — a square box crops 4px off a 395-wide
        // picture, which is less than the CDN's own rounding.
        ratio="1/1"
        width={790}
        sizes={slotSizes ?? LAYOUT_COLUMN[3]}
      />
      <div className="flex flex-col gap-6">
        {heading ? (
          <h3 className="text-display-xl font-display text-balance font-light">{heading}</h3>
        ) : null}
        {/* 18px flat on the frame, which no token reaches: `body` tops out at
            20 and `eyebrow-lg` is uppercase and tracked. */}
        {body ? <p className="text-[18px] leading-[1.2]">{body}</p> : null}
        <ButtonLink
          button={button}
          // `Link`, not `Button`: no plate and no padding, and the label is
          // brand red at Bold rather than the button label's Medium.
          className="text-brand p-0 text-[18px] font-bold leading-[1.2]"
        />
      </div>
    </article>
  )
}
