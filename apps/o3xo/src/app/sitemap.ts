import type { MetadataRoute } from 'next'

import { SITEMAP_QUERY } from '@o3/sanity/queries'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import { getBaseUrl } from '@o3/content-runtime/base-url'
import { sanityFetch } from '@o3/content-runtime/live'

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
 * No redirect filter here, unlike apps/web's (#24). That filter exists because
 * WordPress still serves 32 posts whose URLs 301 elsewhere; o3xo.ai's own
 * redirect audit is the launch-cutover ticket's job, and until it produces a
 * map there is nothing to exclude. When it does, the exclusion belongs here in
 * the same shape.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl()
  const entries: MetadataRoute.Sitemap = [
    entry(base, '', undefined, 1.0),
    entry(base, COLLECTION_PREFIXES.insight, undefined, 0.8),
    entry(base, COLLECTION_PREFIXES.caseStudy, undefined, 0.8),
  ]

  try {
    const { data } = await sanityFetch({
      query: SITEMAP_QUERY,
      perspective: 'published',
      stega: false,
    })

    for (const row of (data?.insights ?? []) as SitemapRow[]) {
      if (!row.slug) continue
      entries.push(entry(base, `${COLLECTION_PREFIXES.insight}/${row.slug}`, row._updatedAt))
    }
    for (const row of (data?.caseStudies ?? []) as SitemapRow[]) {
      if (!row.slug) continue
      entries.push(entry(base, `${COLLECTION_PREFIXES.caseStudy}/${row.slug}`, row._updatedAt))
    }
    for (const row of (data?.pages ?? []) as SitemapRow[]) {
      if (!row.slug) continue
      // The homepage slug is "index" and is already covered by the root entry.
      if (row.slug === 'index') continue
      entries.push(entry(base, `/${row.slug}`, row._updatedAt, 0.8))
    }
  } catch {
    // Serve the static entries when the dataset is unreachable.
  }

  return entries
}
