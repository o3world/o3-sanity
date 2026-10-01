import type React from 'react'
import { Suspense } from 'react'
import { draftMode } from 'next/headers'
import { GoogleTagManager } from '@next/third-parties/google'
import { getSiteSettings } from '@o3/content-runtime/site-settings'

import { clientEnv } from '@/env'
import { currentYear } from '@/lib/currentYear'
import { gtmContainerFor } from '@/lib/gtmContainer'
import { FOOTER_MARK, NAV_MARK } from '@/components/brand/chromeMarks'
import { NavInkFirstPaint, SiteFooter, SiteNav } from '@o3/content-ui/chrome'

import { DraftTools } from './DraftTools'
import { RouteArrival } from './RouteArrival'
import { CookieNotice } from '@/components/cookie-notice/CookieNotice'
import { GlobeProvider } from '@/components/globe/GlobeProvider'
import { SpatialMotionControl } from '@/components/globe/SpatialMotionProvider'
import '@/components/globe/scene.css'

interface ShellProps {
  children: React.ReactNode
  gtmId?: string
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // `draftMode()` is the one request API a static shell may read: it answers
  // `false` while prerendering and marks nothing dynamic. `cookies()` and the
  // draft session's own reads are not, and they live in `DraftTools` and
  // behind the boundary below (#409).
  const { isEnabled: isDraft } = await draftMode()
  const gtmId = gtmContainerFor({ isDraft, gtmId: clientEnv.NEXT_PUBLIC_GTM_ID })

  // A draft session bypasses every `'use cache'` entry — that is what makes
  // the preview show unpublished content — so in it the settings read is
  // uncached IO, and Cache Components requires uncached IO to sit under a
  // Suspense boundary. The published path is untouched: nothing in `Shell`
  // suspends when the reads come from cache, so the shell is prerendered
  // whole, with the nav in the first byte.
  if (isDraft) {
    return (
      <Suspense fallback={<main className="bg-ink min-h-screen" />}>
        <Shell gtmId={gtmId}>{children}</Shell>
      </Suspense>
    )
  }
  return <Shell gtmId={gtmId}>{children}</Shell>
}

async function Shell({ children, gtmId }: ShellProps) {
  const [settings, year] = await Promise.all([getSiteSettings(), currentYear()])

  return (
    <GlobeProvider>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      {/* The chrome draws no mark of its own (#228); these are this app's. */}
      <SiteNav settings={settings} brandMark={NAV_MARK} menuUtilities={<SpatialMotionControl />} />
      {/* Bands paint their own surfaces over the document ground. Matching the
          opening band also covers space around streamed loading content. */}
      <main
        id="site-content"
        data-spatial-layout="true"
        className="bg-(--page-background) min-h-screen [--spacing-nav-offset:32px]"
      >
        {children}
      </main>
      <Suspense fallback={null}>
        <RouteArrival />
      </Suspense>
      {/* After `<main>`, so the arriving page's bands are parsed when it reads
          them, and inline, so it reads them before the first paint. */}
      <NavInkFirstPaint />
      <SiteFooter
        settings={settings}
        brandMark={FOOTER_MARK}
        year={year}
        utilityNavItems={settings?.utilityNavItems}
        utilities={<SpatialMotionControl />}
      />
      <CookieNotice />
      {/* Nothing visible renders here for a published visitor, so `null` is an
          honest fallback; the boundary exists so `DraftTools`' request-time
          read cannot block the shell. */}
      <Suspense fallback={null}>
        <DraftTools />
      </Suspense>
    </GlobeProvider>
  )
}
