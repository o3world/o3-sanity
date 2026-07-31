import type React from 'react'
import { draftMode } from 'next/headers'

import { SanityLive } from '@/sanity/live'
import { getSiteSettings } from '@/sanity/siteSettings'
import { VisualEditing } from '@/sanity/VisualEditing'
import { SiteFooter } from '@/ui/SiteFooter'
import { SiteNav } from '@/ui/SiteNav'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Shared with every route's generateMetadata via React.cache — one fetch
  // per request, not one per consumer.
  const [settings, { isEnabled: isDraft }] = await Promise.all([getSiteSettings(), draftMode()])

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
