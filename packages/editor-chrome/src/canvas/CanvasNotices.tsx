'use client'

import { useEffect, useSyncExternalStore } from 'react'

import { CanvasNoticesView } from './CanvasNoticesView'
import { canvasNotices } from './notices'

/**
 * THE NOTICE SURFACE'S MOUNT (#124) — a sibling of `<VisualEditing />`, and it
 * has to be one.
 *
 *     <VisualEditing components={createCanvasComponents({blockKnobs})} />
 *     <CanvasNotices />
 *
 * The toolbar cannot render this itself. A custom overlay component exists only
 * while its element is hovered (`ElementOverlay.tsx:594`), so a notice drawn
 * from inside the toolbar disappears the moment the editor moves the pointer to
 * read it. Mounted here it belongs to the page rather than to a hover, and the
 * queue in `notices.ts` is what carries a failure across the gap.
 *
 * It renders nothing until something fails, so the cost of the mount is the
 * subscription.
 *
 * ESCAPE DISMISSES, ON THE BUBBLE PHASE — deliberately, and this is the whole
 * reason the phase is stated. `CanvasToolbarView` registers its own Escape
 * handler on the window in the CAPTURE phase and calls `stopPropagation` when
 * one of its menus is open, which stops the event before any bubble-phase
 * listener sees it. So an Escape with the knob menu open closes the menu and
 * leaves the notices alone; an Escape with nothing open reaches here. Register
 * this one at capture and the precedence inverts: one keystroke would clear a
 * notice the editor was still reading and close the menu they meant to close.
 */
export function CanvasNotices() {
  const notices = useSyncExternalStore(
    canvasNotices.subscribe,
    canvasNotices.notices,
    // The server snapshot is the same empty queue: nothing can have failed
    // before the page has been rendered, and returning a fresh array here is
    // the classic hydration mismatch.
    canvasNotices.notices,
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') canvasNotices.clear()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <CanvasNoticesView
      notices={notices}
      onDismiss={canvasNotices.dismiss}
      onDismissAll={canvasNotices.clear}
    />
  )
}
