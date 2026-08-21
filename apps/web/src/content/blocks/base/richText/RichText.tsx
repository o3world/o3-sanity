import { PortableTextBody } from '@/content/portable-text/PortableTextBody'
import type { BaseProps } from '@/content/blocks/sectionTypes'

type RichTextProps = BaseProps<'richText'> & {
  /**
   * The `sizes` of the column this passage was placed in, from the section
   * that placed it. A `bodyText` body may hold a `figure`, and in a column
   * that figure's slot is the column — not the article measure the same
   * renderer uses on a detail page (#268).
   */
  slotSizes?: string
}

/** Base block: a Portable Text passage inside a layoutSection column. */
export function RichText({ body, slotSizes }: RichTextProps) {
  return <PortableTextBody value={body} figureSizes={slotSizes} />
}
