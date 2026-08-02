import { PERSPECTIVES_PAGE_QUERY } from '@o3/sanity/queries'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import type { PERSPECTIVES_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { PerspectiveIndexView } from './PerspectiveIndexView'
import { defineIndexType } from '@/lib/content-routes/define'
import type { IndexRendererProps } from '@/lib/content-routes/types'

type Props = IndexRendererProps<typeof PERSPECTIVES_PAGE_QUERY>

function PerspectiveIndexRenderer({ pagination, ...rest }: Props) {
  // Q widens to string at this site (TS#33304); cast back to the typed
  // query result for the view.
  const data = rest as unknown as NonNullable<PERSPECTIVES_PAGE_QUERY_RESULT>
  return <PerspectiveIndexView items={data.items} pagination={pagination} />
}

/**
 * The paginated /perspectives index (12/page). Unlike vtx listings there is
 * no backing singleton document — the query returns `{items, total}` and
 * metadata is static.
 */
export const perspectiveIndex = defineIndexType({
  itemTypes: ['perspective'],
  query: PERSPECTIVES_PAGE_QUERY,
  pageSize: 12,
  renderer: PerspectiveIndexRenderer,
  seo: {
    title: 'Perspectives',
    description: 'Essays and field notes — the thinking behind the work.',
    // Paginated pages canonicalize to the unpaginated index: `?page=2` is
    // the same collection, not a second document.
    path: COLLECTION_PREFIXES.perspective,
  },
})
