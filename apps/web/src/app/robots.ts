import type { MetadataRoute } from 'next'

import { getBaseUrl } from '@/lib/base-url'

/**
 * Only the promoted production deployment may be indexed; previews and the
 * staging alias stay blanket-disallowed so non-canonical hosts never get
 * indexed. NOTE: there must be no static `public/robots.txt` — this metadata
 * route is the single source of truth for `/robots.txt`.
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === 'production'
  if (!isProduction) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/studio', '/api/'] }],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  }
}
