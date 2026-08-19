import type React from 'react'
import { draftMode } from 'next/headers'
import { EditorToolbar } from '@o3/editor-chrome/toolbar'
import { SanityLive } from '@o3/content-runtime/live'
import { getSiteSettings } from '@o3/content-runtime/site-settings'

import { editorToolbarConfig } from '@/sanity/editorToolbar'
import { VisualEditing } from '@/sanity/VisualEditing'
import { O3xoMark } from '@/brand/O3xoMark'
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
      {/* This brand's mark, handed to chrome that draws none of its own (#228).
          Stacked and plate-less on both, in `2 color` — the white word beside
          the accent star the kit plates on black, and this chrome is black.
          The two sizes are the boxes O3's frames measure for the nav and the
          footer; O3XO has no chrome frames of its own yet, so the stacked
          lockup takes them rather than the layout moving under an unread
          design. */}
      <SiteNav settings={settings} brandMark={<O3xoMark layout="stacked" height={64} />} />
      <main className="min-h-screen">{children}</main>
      <SiteFooter settings={settings} brandMark={<O3xoMark layout="stacked" height={128} />} />
      <SanityLive />
      {isDraft ? <VisualEditing /> : null}
      {/* Renders nothing unless the visitor holds a Studio session (#60, #99).
          `<VisualEditing />` above is what lets it tell Presentation's frame
          from an ordinary tab — see shouldShowEditorToolbar. */}
      <EditorToolbar isDraft={isDraft} config={editorToolbarConfig} />
    </>
  )
}
