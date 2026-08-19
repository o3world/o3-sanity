import type React from 'react'
import { draftMode } from 'next/headers'
import { EditorToolbar } from '@o3/editor-chrome/toolbar'
import { SanityLive } from '@o3/content-runtime/live'
import { getSiteSettings } from '@o3/content-runtime/site-settings'

import { editorToolbarConfig } from '@/sanity/editorToolbar'
import { VisualEditing } from '@/sanity/VisualEditing'
import { SiteFooter, SiteNav, UtilityNav } from '@o3/content-ui/chrome'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Shared with every route's generateMetadata via React.cache — one fetch
  // per request, not one per consumer.
  const [settings, { isEnabled: isDraft }] = await Promise.all([getSiteSettings(), draftMode()])

  return (
    <>
      {/* The brand-property strip sits IN the document above everything else
          and scrolls away with it (`2250:1453` is an in-flow child of the Home
          frame); the pill below it is fixed. That difference is why the two are
          siblings here rather than one component. */}
      <UtilityNav settings={settings} />
      <SiteNav settings={settings} />
      <main className="min-h-screen">{children}</main>
      <SiteFooter settings={settings} />
      <SanityLive />
      {isDraft ? <VisualEditing /> : null}
      {/* Renders nothing unless the visitor holds a Studio session (#60, #99).
          `<VisualEditing />` above is what lets it tell Presentation's frame
          from an ordinary tab — see shouldShowEditorToolbar. */}
      <EditorToolbar isDraft={isDraft} config={editorToolbarConfig} />
    </>
  )
}
