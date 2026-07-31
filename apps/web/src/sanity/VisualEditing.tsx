'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { VisualEditing as NextSanityVisualEditing } from 'next-sanity/visual-editing'
import type { HistoryRefresh } from '@sanity/visual-editing'

/**
 * The one VisualEditing mount for the site (issue #15).
 *
 * next-sanity v13's built-in refresh handler DECLINES `source: "mutation"`
 * refreshes, assuming the Live Content API delivers draft updates. That
 * assumption only holds when `defineLive` has a `browserToken`. This wrapper
 * restores the mutation fallback: if no live-preview connection is active
 * (`livePreviewEnabled === false`), a Studio edit triggers a server
 * re-render, so Presentation keeps updating even when the token is missing
 * or revoked in an environment. With the token present, live events handle
 * updates and this handler stays out of the way.
 *
 * The returned promise throttles refreshes to one per second while typing.
 */
export function VisualEditing() {
  const router = useRouter()

  const refresh = useCallback(
    (payload: HistoryRefresh): false | Promise<void> => {
      if (payload.source === 'mutation' && payload.livePreviewEnabled) {
        // A live-drafts subscription (SanityLive + browserToken) is
        // connected and will deliver this update — don't double-refresh.
        return false
      }
      router.refresh()
      return new Promise((resolve) => setTimeout(resolve, 1000))
    },
    [router],
  )

  return <NextSanityVisualEditing refresh={refresh} />
}
