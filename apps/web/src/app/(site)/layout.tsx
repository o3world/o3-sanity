import type React from 'react'
import { draftMode } from 'next/headers'
import { EditorToolbar } from '@o3/editor-chrome/toolbar'
import { SanityLive } from '@o3/content-runtime/live'
import { getSiteSettings } from '@o3/content-runtime/site-settings'

import { currentYear } from '@/lib/currentYear'
import { editorToolbarConfig } from '@/sanity/editorToolbar'
import { VisualEditing } from '@/sanity/VisualEditing'
import { FOOTER_MARK, NAV_MARK } from '@/components/brand/chromeMarks'
import { SiteFooter, SiteNav } from '@o3/content-ui/chrome'

export default async function SiteLayout({
  children,
  utility,
}: {
  children: React.ReactNode
  /** The brand-property strip's slot — `@utility`, home only. */
  utility: React.ReactNode
}) {
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
          siblings here rather than one component.

          Home draws it and no interior frame does, so it arrives through the
          `@utility` slot: the router decides which route fills it, which is
          the only gate that survives a prerender. */}
      {utility}
      {/* The chrome draws no mark of its own (#228); these are this app's. */}
      <SiteNav settings={settings} brandMark={NAV_MARK} />
      {/* `bg-ink` is the DOCUMENT'S GROUND, not a band. Every band paints over
          it, so the only time it is seen is where one has not arrived yet: the
          index routes stream their feed into a Suspense boundary with a `null`
          fallback (#280), and until it lands `<main>` is an empty viewport.
          Over the body's white that was a white flash on every click through to
          /work or /insights — and a second flicker behind it, since `NavInk`
          samples that white, flips the bar to its light skin, and flips back
          when the ink hero paints. Ink is the colour both index heroes arrive
          in, so the hole now matches what fills it. The height the hole should
          hold is still #280's. */}
      <main className="bg-ink min-h-screen">{children}</main>
      <SiteFooter settings={settings} brandMark={FOOTER_MARK} year={year} />
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
