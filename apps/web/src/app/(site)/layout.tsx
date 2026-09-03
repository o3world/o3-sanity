import type React from 'react'
import { Suspense, ViewTransition } from 'react'
import { draftMode } from 'next/headers'
import { getSiteSettings } from '@o3/content-runtime/site-settings'

import { currentYear } from '@/lib/currentYear'
import { FOOTER_MARK, NAV_MARK } from '@/components/brand/chromeMarks'
import { NavInkFirstPaint, SiteFooter, SiteNav, UtilityNav } from '@o3/content-ui/chrome'

import { DraftTools } from './DraftTools'

interface ShellProps {
  children: React.ReactNode
}

export default async function SiteLayout({ children }: ShellProps) {
  // `draftMode()` is the one request API a static shell may read: it answers
  // `false` while prerendering and marks nothing dynamic. `cookies()` and the
  // draft session's own reads are not, and they live in `DraftTools` and
  // behind the boundary below (#409).
  const { isEnabled: isDraft } = await draftMode()

  // A draft session bypasses every `'use cache'` entry — that is what makes
  // the preview show unpublished content — so in it the settings read is
  // uncached IO, and Cache Components requires uncached IO to sit under a
  // Suspense boundary. The published path is untouched: nothing in `Shell`
  // suspends when the reads come from cache, so the shell is prerendered
  // whole, with the nav in the first byte.
  if (isDraft) {
    return (
      <Suspense fallback={<main className="bg-ink min-h-screen" />}>
        <Shell>{children}</Shell>
      </Suspense>
    )
  }
  return <Shell>{children}</Shell>
}

async function Shell({ children }: ShellProps) {
  const [settings, year] = await Promise.all([getSiteSettings(), currentYear()])

  return (
    <>
      {/* The brand-property strip sits IN the document above everything else
          and scrolls away with it (`2250:1453` is an in-flow child of the Home
          frame); the pill below it is fixed. That difference is why the two are
          siblings here rather than one component.

          EVERY ROUTE DRAWS IT, and the strip is data rather than a route:
          `utilityNavItems` decides whether there is one, which is the same
          question `SiteNav` asks for the pill's resting offset and `<main>`
          asks for its heroes' clearance. Those three used to disagree — the
          strip was gated on the route through an `@utility` parallel slot
          while the other two read the setting, so every interior page hung the
          pill at 124px and padded its hero to clear a strip that was not
          there. One source, one answer. */}
      <UtilityNav settings={settings} />
      {/* The chrome draws no mark of its own (#228); these are this app's. */}
      <SiteNav settings={settings} brandMark={NAV_MARK} />
      {/* `bg-ink` is the DOCUMENT'S GROUND, not a band. Every band paints over
          it, so the only time it is seen is beside a skeleton: the index routes
          stream their feed into a Suspense boundary whose fallback holds the
          shape of the grid but not the whole viewport's height. Over the body's
          white the uncovered part was a white flash on every click through to
          /work or /insights — and a second flicker behind it, since `NavInk`
          samples that white, flips the bar to its light skin, and flips back
          when the ink hero paints. Ink is the colour both index heroes arrive
          in, so what shows around the skeleton matches what fills it. */}
      <main
        // No `utilityNavItems`, no strip — and the nav-offset token every
        // clearance under the pill derives from (hero padding, sticky tops,
        // jump-target margins) drops to the strip-less 32px the interior
        // frames draw (`2336:4382`, `2250:2251`, `2250:2131`, all at y: 32).
        // `SiteNav` makes the same call for the pill itself; the two read one
        // settings fetch.
        className={
          (settings?.utilityNavItems ?? []).length > 0
            ? 'bg-ink min-h-screen'
            : 'bg-ink min-h-screen [--spacing-nav-offset:32px]'
        }
      >
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
      {/* After `<main>`, so the arriving page's bands are parsed when it reads
          them, and inline, so it reads them before the first paint. */}
      <NavInkFirstPaint />
      <SiteFooter settings={settings} brandMark={FOOTER_MARK} year={year} />
      {/* Nothing visible renders here for a published visitor, so `null` is an
          honest fallback; the boundary exists so `DraftTools`' request-time
          read cannot block the shell. */}
      <Suspense fallback={null}>
        <DraftTools />
      </Suspense>
    </>
  )
}
