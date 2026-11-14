import type React from 'react'
import { Suspense } from 'react'
import { draftMode } from 'next/headers'
import { GoogleTagManager } from '@next/third-parties/google'
import { SkipLink } from '@o3/content-ui/chrome'

import { clientEnv } from '@/env'
import { currentYear } from '@/lib/currentYear'
import { gtmContainerFor } from '@/lib/gtmContainer'
import { CookieNotice } from '@/components/cookie-notice/CookieNotice'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LANDING_CONTENT_ID } from '@/components/landing/landingContent'

import { DraftTools } from '../(site)/DraftTools'

/**
 * The shell for landing pages: no site nav, no site footer. Each page draws
 * its own nav and `<main>`; this keeps what every page on the domain needs —
 * GTM, the skip link, the cookie notice, the draft tools — and a one-line
 * footer. Fonts and globals come from the root layout, as they do for (site).
 */
export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  // Readable while prerendering, and the only request API the shell reads —
  // the same contract as `(site)/layout.tsx`.
  const { isEnabled: isDraft } = await draftMode()
  const gtmId = gtmContainerFor({ isDraft, gtmId: clientEnv.NEXT_PUBLIC_GTM_ID })

  // A draft read bypasses the cache, and uncached IO has to sit under a
  // Suspense boundary; the published shell prerenders whole.
  if (isDraft) {
    return (
      <Suspense fallback={<main className="bg-ink min-h-screen" />}>
        <Shell gtmId={gtmId}>{children}</Shell>
      </Suspense>
    )
  }
  return <Shell gtmId={gtmId}>{children}</Shell>
}

async function Shell({ children, gtmId }: { children: React.ReactNode; gtmId?: string }) {
  const year = await currentYear()
  return (
    <>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <SkipLink target={LANDING_CONTENT_ID} />
      {children}
      <LandingFooter year={year} />
      <CookieNotice />
      <Suspense fallback={null}>
        <DraftTools />
      </Suspense>
    </>
  )
}
