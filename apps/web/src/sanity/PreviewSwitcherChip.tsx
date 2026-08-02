'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useIsPresentationTool } from 'next-sanity/hooks'

import {
  ENABLE_DRAFT_MODE_PATH,
  readStudioToken,
  SANITY_PROJECT_ID,
  shouldShowPreviewSwitcher,
} from './draftPreview'
import { PreviewSwitcherView, type PreviewSwitcherStatus } from './PreviewSwitcherView'

/**
 * The preview switcher's behaviour (#60): where it hides, and what the two
 * sides do.
 *
 * Loaded through `next/dynamic` from `PreviewSwitcher`, and only once a Studio
 * session looks plausible — `useIsPresentationTool` drags the visual editing
 * runtime in with it, and an anonymous visitor should pay for none of that.
 *
 * **Entering draft mode is a POST, leaving it is a link.** Entering needs the
 * Studio token in a body the server can verify, then `router.refresh()` picks
 * up the cookie the response set and re-renders the URL in place. Leaving
 * needs no credential at all, so it is an ordinary `<a>` that works without
 * JavaScript and redirects back to where it was.
 */
export function PreviewSwitcherChip({ isDraft }: { isDraft: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const isPresentationTool = useIsPresentationTool()
  const [status, setStatus] = useState<PreviewSwitcherStatus>('idle')

  // window.location rather than useSearchParams(): the query string is part of
  // where the editor was (?page=3 on an index), and useSearchParams() would
  // impose a Suspense boundary on every page for a value only this chip reads.
  const [returnTo, setReturnTo] = useState('/')
  useEffect(() => {
    setReturnTo(`${window.location.pathname}${window.location.search}`)
  }, [pathname])

  const onEnableDrafts = useCallback(async () => {
    setStatus('working')

    const token = readStudioToken(window.localStorage, SANITY_PROJECT_ID)
    if (!token) {
      setStatus('error')
      return
    }

    try {
      const response = await fetch(ENABLE_DRAFT_MODE_PATH, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!response.ok) {
        setStatus('error')
        return
      }
    } catch {
      setStatus('error')
      return
    }

    setStatus('idle')
    router.refresh()
  }, [router])

  if (!shouldShowPreviewSwitcher({ isDraft, hasStudioToken: true, isPresentationTool })) {
    return null
  }

  return (
    <PreviewSwitcherView
      isDraft={isDraft}
      returnTo={returnTo}
      status={status}
      onEnableDrafts={() => void onEnableDrafts()}
    />
  )
}
