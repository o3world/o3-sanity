import type React from 'react'
import { draftMode } from 'next/headers'

import { SITE_SETTINGS_QUERY } from '@o3/sanity/queries'

import { typeTag } from '@/lib/content-routes/cacheTags'
import { sanityFetch, SanityLive } from '@/sanity/live'
import { VisualEditing } from '@/sanity/VisualEditing'
import { SiteFooter } from '@/ui/SiteFooter'
import { SiteNav } from '@/ui/SiteNav'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ data: settings }, { isEnabled: isDraft }] = await Promise.all([
    sanityFetch({ query: SITE_SETTINGS_QUERY, tags: [typeTag('siteSettings')] }),
    draftMode(),
  ])

  return (
    <>
      <SiteNav settings={settings} />
      <main className="min-h-screen">{children}</main>
      <SiteFooter settings={settings} />
      <SanityLive />
      {isDraft ? <VisualEditing /> : null}
    </>
  )
}
