import type React from 'react'
import { draftMode } from 'next/headers'
import { EditorToolbar } from '@o3/editor-chrome/toolbar'
import { SanityLive } from '@o3/content-runtime/live'
import { getSiteSettings } from '@o3/content-runtime/site-settings'

import { currentYear } from '@/lib/currentYear'
import { editorToolbarConfig } from '@/sanity/editorToolbar'
import { VisualEditing } from '@/sanity/VisualEditing'
import { SiteFooter, SiteNav } from '@/chrome'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, { isEnabled: isDraft }, year] = await Promise.all([
    getSiteSettings(),
    draftMode(),
    currentYear(),
  ])

  return (
    <>
      {/* This app's own chrome (#243, ADR 0028's second addendum) — the kit's
          dropdown bar and its light footer, not the shared pill. No utility
          strip: O3XO has no equivalent, and the two property links it would
          carry are drawn by the footer's own row, which is where the kit puts
          them. The mark is no longer a slot the layout fills, because the
          components are this brand's and reach for it themselves. */}
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
