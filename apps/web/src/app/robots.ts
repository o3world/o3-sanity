import type { MetadataRoute } from 'next'

import { getBaseUrl } from '@o3/content-runtime/base-url'

import { isIndexedBuild } from '@/lib/indexing'

/**
 * Previews and the staging alias stay blanket-disallowed, and every response
 * they send carries `X-Robots-Tag: noindex` (next.config). NOTE: there must be
 * no static `public/robots.txt` — this metadata route is the single source of
 * truth for `/robots.txt`.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexedBuild(process.env.VERCEL_ENV)) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/studio', '/api/'] }],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  }
}
