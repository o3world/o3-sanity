'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

import { readStudioToken, SANITY_PROJECT_ID } from './draftPreview'

/**
 * The preview switcher's mount point (#60), rendered on every page by
 * `(site)/layout.tsx` beside `<SanityLive />`.
 *
 * This shell exists to render **nothing** for the overwhelming majority of
 * requests, as cheaply as possible:
 *
 * - No network. Detection is one `localStorage` read; token verification only
 *   happens when an editor actually clicks, and only server-side.
 * - No bundle. The chip — and the visual editing runtime its presentation
 *   detection imports — loads through `next/dynamic` after the probe says
 *   there is a Studio session worth offering it to.
 * - No layout shift. It renders `null` on the server and on first paint, and
 *   what it eventually renders is `fixed`.
 *
 * A stale or forged token only buys someone the sight of the chip. Clicking it
 * fails with a 401 (`draftModeRoutes`), which is why a client-side probe is
 * allowed to be this loose.
 */
const PreviewSwitcherChip = dynamic(
  () => import('./PreviewSwitcherChip').then((m) => m.PreviewSwitcherChip),
  { ssr: false },
)

export function PreviewSwitcher({ isDraft }: { isDraft: boolean }) {
  const [hasStudioToken, setHasStudioToken] = useState(false)

  useEffect(() => {
    setHasStudioToken(readStudioToken(window.localStorage, SANITY_PROJECT_ID) !== null)
  }, [])

  // Draft mode is itself proof of a session this app already verified, so an
  // editor whose token has since been cleared can still find the way out.
  if (!isDraft && !hasStudioToken) return null

  return <PreviewSwitcherChip isDraft={isDraft} />
}
