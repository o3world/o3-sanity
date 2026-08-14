'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

import { readStudioToken, type EditorToolbarConfig } from './draftPreview'

/**
 * The editor toolbar's mount point (#60, #99), rendered on every page by the
 * site layout.
 *
 * This shell exists to render **nothing** for the overwhelming majority of
 * requests, as cheaply as possible:
 *
 * - No network. Detection is one `localStorage` read; token verification only
 *   happens when an editor actually clicks, and only server-side.
 * - No bundle. The toolbar — and the visual editing runtime its presentation
 *   detection imports — loads through `next/dynamic` after the probe says
 *   there is a Studio session worth offering it to.
 * - No layout shift. It renders `null` on the server and on first paint, and
 *   what it eventually renders is `fixed`.
 *
 * A stale or forged token only buys someone the sight of the toolbar. Clicking
 * Drafts fails with a 401 (`../draft-mode`) and clicking Edit lands on a
 * Studio login, which is why a client-side probe is allowed to be this loose.
 */
const EditorToolbarChip = dynamic(
  () => import('./EditorToolbarChip').then((m) => m.EditorToolbarChip),
  { ssr: false },
)

export function EditorToolbar({
  isDraft,
  config,
}: {
  isDraft: boolean
  config: EditorToolbarConfig
}) {
  const [hasStudioToken, setHasStudioToken] = useState(false)

  useEffect(() => {
    setHasStudioToken(readStudioToken(window.localStorage, config.projectId) !== null)
  }, [config.projectId])

  // Draft mode is itself proof of a session this app already verified, so an
  // editor whose token has since been cleared can still find the way out.
  if (!isDraft && !hasStudioToken) return null

  return <EditorToolbarChip isDraft={isDraft} config={config} />
}
