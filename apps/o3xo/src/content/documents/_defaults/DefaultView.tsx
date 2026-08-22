import { Blocks } from '@/content/blocks/Blocks'
import type { SanityBlock } from '@o3/sanity/types'

/**
 * Generic full-template renderer for routable documents that have a title
 * and (optionally) a `sections[]` page-builder array. Content types whose
 * template diverges register their own View in `registry.ts`.
 */
export interface DefaultViewProps {
  readonly _id?: string
  readonly _type?: string
  readonly title?: string | null
  readonly sections?: readonly SanityBlock[] | null
}

export function DefaultView({ _id, _type, title, sections }: DefaultViewProps) {
  return (
    <article>
      {title ? (
        <header className="mx-auto max-w-5xl px-6 pb-12 pt-40">
          <h1 className="text-display-xl font-display">{title}</h1>
        </header>
      ) : null}
      {sections?.length ? <Blocks blocks={sections} documentId={_id} documentType={_type} /> : null}
    </article>
  )
}
