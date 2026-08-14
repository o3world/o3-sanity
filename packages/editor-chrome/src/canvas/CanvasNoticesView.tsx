import { noticeHeadline, type CanvasNotice } from './notices'

/**
 * THE CANVAS NOTICE'S PIXELS — what an editor sees when the draft refuses an
 * edit the canvas already repainted (#124).
 *
 *     ┌──────────────────────────────────┐
 *     │ Could not remove sections[…]  ×2 │
 *     │ Document not found            ✕  │
 *     └──────────────────────────────────┘
 *     ┌──────────────────────────────────┐
 *     │ Could not set variant on …       │
 *     └──────────────────────────────────┘
 *      Dismiss all
 *
 * BOTTOM LEFT, and the corner is not arbitrary. Bottom right belongs to the
 * editor toolbar, which is on screen in Presentation too; the top corners
 * belong to the canvas toolbar (band, top right) and Presentation's own element
 * tab (top left). Left is the corner nothing else claims.
 *
 * ABOVE THE OVERLAY. `Overlays.tsx:62` paints the visual-editing root at
 * `z-index: 9999999` in a portal on `<html>`, so anything that means to be
 * readable while an element overlay is on screen has to beat it. This is
 * `fixed` in the page's own tree with nothing between it and `<body>`, so one
 * z-index is the whole of the stacking argument.
 *
 * THE REGION MOUNTS WITH THE PAGE and is empty until something fails, which is
 * the one thing here that is not obvious from the pixels — see the comment on
 * `aria-live` below. Empty, it is zero pixels tall and has nothing to hit.
 *
 * WHY IT DOES NOT TIME OUT. A notice that dismisses itself is a notice an
 * editor can miss, and missing it is the bug — "the patch vanished" is the
 * support shape this whole ticket exists to end. It stays until it is
 * dismissed; the limit in `notices.ts` is what keeps that from becoming a wall.
 *
 * WHY LITERAL COLOURS. Same reason the toolbar gives: this is Studio chrome
 * painted over the page, not page content, and a brand token here would
 * camouflage the notice against any band that used the same token.
 *
 * Split from `CanvasNotices` for the reason `CanvasToolbarView` is split from
 * `CanvasToolbar`: this repo's render layer mounts client components through
 * `react-dom/server`, which runs no effects and provides no store. Everything
 * here is props.
 */

/** Red, because this is the one canvas surface that reports a refusal. */
const NOTICE_COLOR = '#b91c1c'

export interface CanvasNoticesViewProps {
  /** Oldest first — the newest sits nearest the corner (see below). */
  notices?: readonly CanvasNotice[]
  onDismiss?: (id: string) => void
  onDismissAll?: () => void
}

export function CanvasNoticesView({
  notices = [],
  onDismiss,
  onDismissAll,
}: CanvasNoticesViewProps) {
  return (
    <aside
      aria-label="Canvas notices"
      // Polite, never assertive: the mutation has already failed and the page
      // has already repainted, so interrupting whatever a screen reader is
      // saying buys nothing an editor can act on any sooner.
      aria-live="polite"
      data-testid="canvas-notices"
      // THE REGION IS ALWAYS HERE, EMPTY OR NOT — the one thing about this
      // surface that is not obvious from looking at it. A screen reader
      // announces a change INSIDE a live region it was already watching; a
      // region that arrives carrying its first notice usually announces
      // nothing, because there was no region to watch when the content
      // appeared. So the box mounts with the page and stays empty, which costs
      // it no size and nothing to hit: an empty flex column is zero pixels
      // tall.
      className="fixed bottom-4 left-4 z-[10000000] flex max-w-sm flex-col items-start gap-1 font-sans print:hidden"
    >
      {/* The list itself is conditional even though the region is not: an
          empty `<ul>` is a list with no items, which is a thing to explain to
          anyone reading the accessibility tree. */}
      {notices.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {notices.map((notice) => (
            <li
              key={notice.id}
              data-testid="canvas-notice"
              style={{ background: NOTICE_COLOR }}
              className="flex items-start gap-2 rounded-[3px] px-2 py-1.5 text-white shadow-lg"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold">{noticeHeadline(notice.what)}</p>
                {notice.detail ? <p className="text-[11px] opacity-80">{notice.detail}</p> : null}
              </div>
              {notice.count > 1 ? (
                // The count is the difference between "it failed" and "it has
                // failed every time you tried", which is the difference between
                // waiting and going to find someone.
                <span
                  data-testid="canvas-notice-count"
                  aria-label={`Reported ${notice.count} times`}
                  className="shrink-0 rounded-[2px] bg-white/20 px-1 text-[10px] font-semibold"
                >
                  ×{notice.count}
                </span>
              ) : null}
              <button
                type="button"
                aria-label="Dismiss notice"
                onClick={() => onDismiss?.(notice.id)}
                className="shrink-0 text-[11px] leading-4 opacity-70 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {notices.length > 1 ? (
        <button
          type="button"
          onClick={() => onDismissAll?.()}
          className="rounded-[3px] bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white/80 shadow-sm hover:text-white focus-visible:text-white focus-visible:outline-none"
        >
          Dismiss all
        </button>
      ) : null}
    </aside>
  )
}
