import type { BaseProps } from '@o3/content-runtime/blocks'

import { PortableTextBody } from '@/content/portable-text/PortableTextBody'

type RichTextProps = BaseProps<'richText'>

/** Base block: a Portable Text passage inside a layoutSection column. */
export function RichText({ body }: RichTextProps) {
  return <PortableTextBody value={body} />
}
