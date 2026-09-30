import type { BaseProps } from '@o3/content-runtime/blocks'
import { stegaClean } from '@sanity/client/stega'
import { cn } from '@o3/ui/lib/utils'

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

/** Current business cards (3813:93974 / 3906:17954); the band owns the image slot's size. */
export function MediaCard({ media, fit, heading, body, button, slotSizes }: MediaCardProps) {
  const contained = stegaClean(fit) === 'contain'
  return (
    <article className="flex flex-col gap-6">
      {media?.image ? (
        <div
          className={cn(
            'h-[var(--media-card-height,260px)] overflow-hidden rounded-[var(--media-card-radius,16px)] shadow-[var(--media-card-shadow,none)] max-lg:aspect-[var(--media-card-aspect,auto)]',
            contained && 'bg-black',
          )}
        >
          <SanityImage
            source={media?.image}
            alt={media?.alt}
            ratio="fill"
            fit={contained ? 'contain' : 'crop'}
            width={1220}
            sizes={slotSizes ?? LAYOUT_COLUMN[3]}
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        {heading ? <h3 className="text-display-xl font-display text-balance">{heading}</h3> : null}
        {body ? <p className="text-[20px] leading-7">{body}</p> : null}
        <ButtonLink
          button={button}
          // `Link`, not `Button`: no plate and no padding, and the label is
          // brand red at Bold rather than the button label's Medium.
          className="text-brand self-start p-0 pt-6 text-[18px] font-semibold leading-6"
        />
      </div>
    </article>
  )
}
