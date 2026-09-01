import type React from 'react'
import { ViewTransition } from 'react'
import { draftMode } from 'next/headers'
import { EditorToolbar } from '@o3/editor-chrome/toolbar'
import { SanityLive } from '@o3/content-runtime/live'
import { getSiteSettings } from '@o3/content-runtime/site-settings'

import { currentYear } from '@/lib/currentYear'
import { editorToolbarConfig } from '@/sanity/editorToolbar'
import { VisualEditing } from '@/sanity/VisualEditing'
import { SiteFooter, SiteNav } from '@/components/chrome'

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
      <main className="min-h-screen">
        {/*
         * THE CROSS-PAGE FADE (#403). One `<ViewTransition>` around the routed
         * content and nothing else: a navigation replaces what is inside `<main>`
         * and leaves the chrome standing, so the chrome is exactly what must not
         * animate. The pseudo-element rules are in tokens/motion.css, where the
         * root snapshot — nav, footer, ground — is held still and only this
         * element crosses; `default="page"` is the class they name.
         *
         * `<Link>` navigation is a React Transition, which is what activates
         * this; a browser with no View Transitions API navigates as it always
         * did, with no fallback to write.
         */}
        <ViewTransition default="page">{children}</ViewTransition>
      </main>
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
