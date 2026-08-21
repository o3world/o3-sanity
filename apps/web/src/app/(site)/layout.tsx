import type React from 'react'
import { draftMode } from 'next/headers'
import { EditorToolbar } from '@o3/editor-chrome/toolbar'

import { currentYear } from '@/lib/currentYear'
import { editorToolbarConfig } from '@/sanity/editorToolbar'
import { SanityLive } from '@/sanity/live'
import { getSiteSettings } from '@/sanity/siteSettings'
import { VisualEditing } from '@/sanity/VisualEditing'
import { SiteFooter } from '@/ui/SiteFooter'
import { SiteNav } from '@/ui/SiteNav'
import { UtilityNav } from '@/ui/UtilityNav'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, { isEnabled: isDraft }, year] = await Promise.all([
    getSiteSettings(),
    draftMode(),
    currentYear(),
  ])

  return (
    <>
      {/* The brand-property strip sits IN the document above everything else
          and scrolls away with it (`2250:1453` is an in-flow child of the Home
          frame); the pill below it is fixed. That difference is why the two are
          siblings here rather than one component. */}
      <UtilityNav settings={settings} />
      <SiteNav settings={settings} />
      <main className="min-h-screen">{children}</main>
      <SiteFooter settings={settings} year={year} />
      {/* Draft sessions only: SanityLive is the delivery path for draft
          updates in Presentation (see live.ts). Published visitors get
          freshness from the Sanity webhook → /api/revalidate instead, so
          they hold no Live Content API connection. */}
      {isDraft ? (
        <>
          <SanityLive includeDrafts />
          <VisualEditing />
        </>
      ) : null}
      {/* Renders nothing unless the visitor holds a Studio session (#60, #99).
          `<VisualEditing />` above is what lets it tell Presentation's frame
          from an ordinary tab — see shouldShowEditorToolbar. */}
      <EditorToolbar isDraft={isDraft} config={editorToolbarConfig} />
    </>
  )
}
