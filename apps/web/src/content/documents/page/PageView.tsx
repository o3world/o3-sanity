import type { PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { BlockRenderer } from '@/content/blocks/BlockRenderer'
import { ClientBlockRenderer } from '@/content/blocks/ClientBlockRenderer'

type PageDoc = NonNullable<PAGE_QUERY_RESULT>
export type PageViewProps = PageDoc & { readonly isDraft?: boolean }

/**
 * View for `page` documents: the sections array through the block machinery.
 * Draft mode (Presentation preview) routes through ClientBlockRenderer for
 * optimistic drag-reorder; the published path stays a server render.
 */
export function PageView({ _id, title, sections, isDraft }: PageViewProps) {
  if (!sections?.length) {
    return (
      <article className="mx-auto max-w-5xl px-6 pb-24 pt-40">
        <h1 className="text-display-xl font-display">{title}</h1>
      </article>
    )
  }

  const Renderer = isDraft ? ClientBlockRenderer : BlockRenderer
  return (
    <article>
      <Renderer blocks={sections} documentId={_id} documentType="page" fieldPath="sections" />
    </article>
  )
}
