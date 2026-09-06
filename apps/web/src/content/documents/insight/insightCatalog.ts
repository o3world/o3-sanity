import { currentReadMode, sanityFetch, type ReadMode } from '@o3/content-runtime/live'
import { typeTag } from '@o3/content-runtime/routes'
import { INSIGHTS_CATALOG_QUERY } from '@o3/sanity/queries'

async function readCatalog(read: ReadMode) {
  'use cache'
  const { data } = await sanityFetch({
    query: INSIGHTS_CATALOG_QUERY,
    params: {},
    tags: ['insight', 'category', 'collectionIndex'].map(typeTag),
    ...read,
  })
  return data.items
}

export async function insightCatalog() {
  return readCatalog(await currentReadMode())
}
