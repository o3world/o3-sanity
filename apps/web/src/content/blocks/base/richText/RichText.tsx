import { PortableTextBody } from '@/content/portable-text/PortableTextBody'
import type { BaseProps } from '@/content/blocks/sectionTypes'

type RichTextProps = BaseProps<'richText'>

/** Base block: a Portable Text passage inside a layoutSection column. */
export function RichText({ body }: RichTextProps) {
  return <PortableTextBody value={body} />
}
