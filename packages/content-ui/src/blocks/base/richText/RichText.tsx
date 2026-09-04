import type { BaseProps } from '@o3/content-runtime/blocks'

import { PortableTextBody } from '../../../portable-text/PortableTextBody'

type RichTextProps = BaseProps<'richText'> & {
  /**
   * The `sizes` of the column this passage was placed in, from the section
   * that placed it. A `bodyText` body may hold a `figure`, and in a column
   * that figure's slot is the column — not the article measure the same
   * renderer uses on a detail page (#268).
   */
  slotSizes?: string
}

/**
 * Base block: a Portable Text passage inside a layoutSection column.
 *
 * A column's copy reads at `lead`, not the article's `body` step: the band
 * frames draw it at `Body/Default` 24/34 (`2360:2861`), a size up from the
 * 20/32 an insight body is set in. The proof-point band (`2357:2690`) goes
 * a step further to 28/38; `lead` is the nearest step on the ramp.
 */
export function RichText({ body, slotSizes }: RichTextProps) {
  return <PortableTextBody value={body} figureSizes={slotSizes} className="text-lead" />
}
