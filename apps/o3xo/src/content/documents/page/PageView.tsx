import type { PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { Blocks } from '@/content/blocks/Blocks'

type PageDoc = NonNullable<PAGE_QUERY_RESULT>
export type PageViewProps = PageDoc

/**
 * View for `page` documents: the sections array through the block machinery.
 * `Blocks` resolves draft mode itself and picks the server or Presentation
 * renderer accordingly.
 */
export function PageView({ _id, title, sections }: PageViewProps) {
  if (!sections?.length) {
    return (
      <article className="mx-auto max-w-5xl px-6 pb-24 pt-40">
        <h1 className="text-display-xl font-display">{title}</h1>
      </article>
    )
  }

  return (
    <article>
      <Blocks blocks={sections} documentId={_id} documentType="page" fieldPath="sections" />
    </article>
  )
}
