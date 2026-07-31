import type { MetadataRoute } from 'next'

import { SITEMAP_QUERY } from '@o3/sanity/queries'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'

import { getBaseUrl } from '@/lib/base-url'
import { sanityFetch } from '@/sanity/live'

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl()
  const entries: MetadataRoute.Sitemap = [
    entry(base, '', undefined, 1.0),
    entry(base, '/perspectives', undefined, 0.8),
  ]

  try {
    const { data } = await sanityFetch({
      query: SITEMAP_QUERY,
      perspective: 'published',
      stega: false,
    })

    for (const row of (data?.perspectives ?? []) as SitemapRow[]) {
      if (!row.slug) continue
      entries.push(entry(base, `${COLLECTION_PREFIXES.perspective}/${row.slug}`, row._updatedAt))
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
