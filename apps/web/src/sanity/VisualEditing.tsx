'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { VisualEditing as NextSanityVisualEditing } from 'next-sanity/visual-editing'
import type { HistoryRefresh } from '@sanity/visual-editing'
import { CanvasNotices, createCanvasComponents } from '@o3/editor-chrome/canvas'
import { BLOCK_KNOBS } from '@o3/sanity/knobs'
import { BLOCK_ARRAYS } from '@o3/sanity/schemas/registry'

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
 *
 * `components` is the canvas toolbar (#108, #109), and it is deliberately the
 * only thing this mount says about it: the resolver and everything it reaches
 * live in `@o3/editor-chrome/canvas`, so removing the feature is deleting one
 * prop. It is an `@alpha` API on `@sanity/visual-editing` and the one unstable
 * surface the site depends on — worth keeping to a single line.
 *
 * `BLOCK_KNOBS` and `BLOCK_ARRAYS` are what the site has to supply: the overlay
 * package knows the knob vocabulary and none of our blocks' declarations
 * (ADR 0020), so both registries are handed in here rather than imported over
 * there. The second is what the insert menu offers (#112) — which arrays hold
 * blocks and which blocks each holds, derived from the same registry the
 * schema's own `of:` is built from, so the menu and the form cannot disagree
 * about what a page accepts.
 *
 * `<CanvasNotices />` is a SIBLING and cannot be anything else (#124). An
 * overlay component renders only while its element is hovered, so a refused
 * mutation reported from inside the toolbar is gone the instant the editor
 * looks away from the thing that refused it. Mounted here the notice belongs to
 * the page; the toolbar feeds it through a queue in the same package. It
 * renders nothing until something fails.
 */
const canvasComponents = createCanvasComponents({
  blockKnobs: BLOCK_KNOBS,
  blockArrays: BLOCK_ARRAYS,
})

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

  return (
    <>
      <NextSanityVisualEditing refresh={refresh} components={canvasComponents} />
      <CanvasNotices />
    </>
  )
}
