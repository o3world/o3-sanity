import type { MetadataRoute } from 'next'

import { SITEMAP_QUERY } from '@o3/sanity/queries'
import { collectionPrefixes } from '@o3/sanity/brand'
import { getBaseUrl } from '@o3/content-runtime/base-url'
import { sanityFetch } from '@o3/content-runtime/live'
import { typeTag } from '@o3/content-runtime/routes'

import { REDIRECTED_PATHS } from '@/lib/redirects.generated'

interface SitemapRow {
  slug: string | null
  _updatedAt: string
}

function entry(
  base: string,
  path: string,
  updatedAt?: string,
  priority = 0.7,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${base}${path}`,
    lastModified: updatedAt ? new Date(updatedAt) : undefined,
    changeFrequency: 'weekly',
    priority,
  }
}

/**
 * A path this site permanently redirects is not a path it has (#24).
 *
 * 32 migrated documents are in exactly that position: WordPress still holds
 * the post — which is why the extractor found it and the loader loaded it —
 * while 301ing its URL to o3xo.ai, where its owners moved the content.
 * Listing such a URL here would advertise a page that answers 301, and point
 * a crawler at a competitor for the ranking. The redirect table is generated,
 * so this stays true without anyone maintaining a second list.
 */
function isRedirected(path: string): boolean {
  return REDIRECTED_PATHS.has(path === '' ? '/' : path)
}

/**
 * `sanityFetch` calls `cacheTag()` under Cache Components, so it runs inside
 * a `'use cache'` function or not at all. Explicit type tags so
 * `/api/revalidate` reaches this read — without them the sitemap would stay
 * frozen at its build-time content.
 */
async function readSitemapRows() {
  'use cache'
  const { data } = await sanityFetch({
    query: SITEMAP_QUERY,
    perspective: 'published',
    stega: false,
    tags: ['page', 'insight', 'caseStudy'].map(typeTag),
  })
  return data
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl()
  const prefixes = collectionPrefixes()
  const entries: MetadataRoute.Sitemap = [
    entry(base, '', undefined, 1.0),
    entry(base, '/insights', undefined, 0.8),
    entry(base, '/work', undefined, 0.8),
  ]

  try {
    const data = await readSitemapRows()

    for (const row of (data?.insights ?? []) as SitemapRow[]) {
      if (!row.slug) continue
      const path = `${prefixes.insight}/${row.slug}`
      if (isRedirected(path)) continue
      entries.push(entry(base, path, row._updatedAt))
    }
    for (const row of (data?.caseStudies ?? []) as SitemapRow[]) {
      if (!row.slug) continue
      const path = `${prefixes.caseStudy}/${row.slug}`
      if (isRedirected(path)) continue
      entries.push(entry(base, path, row._updatedAt))
    }
    for (const row of (data?.pages ?? []) as SitemapRow[]) {
      if (!row.slug) continue
      // The homepage slug is "index" and is already covered by the root entry.
      if (row.slug === 'index') continue
      const path = `/${row.slug}`
      if (isRedirected(path)) continue
      entries.push(entry(base, path, row._updatedAt, 0.8))
    }
  } catch {
    // Serve the static entries when the dataset is unreachable.
  }

  return entries
}
