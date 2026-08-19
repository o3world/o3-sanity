import { cache } from 'react'

import { SITE_SETTINGS_QUERY } from '@o3/sanity/queries'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { typeTag } from './routes/cacheTags'
import { sanityFetch } from '#live'

/**
 * Site Settings, fetched once per request.
 *
 * Two callers need it and they run at different points of the same render:
 * `(site)/layout.tsx` for nav and footer, and every route's
 * `generateMetadata` for the SEO defaults tier (#26). React.cache collapses
 * them into one round-trip.
 *
 * `stega: false` — the settings that reach `generateMetadata` become `<title>`
 * and OG tags, where stega characters are invisible in the browser but
 * corrupt what a scraper reads. The chrome does not use Presentation overlays
 * on these fields, so one stega-free fetch serves both callers.
 */
export const getSiteSettings = cache(async (): Promise<SITE_SETTINGS_QUERY_RESULT> => {
  const { data } = await sanityFetch({
    query: SITE_SETTINGS_QUERY,
    tags: [typeTag('siteSettings')],
    stega: false,
  })
  return data
})
