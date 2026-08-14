'use client'

import { disableDraftModeHref } from './draftPreview'

/**
 * The editor toolbar's pixels (#60, #99) — a pure function of props, with no
 * hooks and no imports beyond the href helper.
 *
 * Kept apart from `EditorToolbarChip` on purpose: the chip's presentation
 * detection reaches for `next-sanity/hooks`, which pulls the whole visual
 * editing runtime in behind it. Splitting the view off means the render layer
 * can mount every state (ADR 0004) without loading any of that.
 *
 * **This is editor chrome, not site UI**, so it takes no design language from
 * the Figma frames — there is no frame for it. It borrows only what it must to
 * sit over the page without arguing with it: `SiteNav`'s `z-50`, the ink
 * surface, and the `on-ink` type ramp. It is `fixed`, so it cannot move the
 * page or cost a layout shift.
 */

export type EditorToolbarStatus = 'idle' | 'working' | 'error'

export interface EditorToolbarViewProps {
  /** Next.js draft mode is on — the page is showing drafts. */
  isDraft: boolean
  /** The path to come back to after leaving draft mode. */
  returnTo: string
  /** Where `GET`ting turns draft mode off. */
  disablePath: string
  /** Presentation, opened on this page — `presentationHref`. */
  editHref: string
  status: EditorToolbarStatus
  onEnableDrafts: () => void
}

const SEGMENT = 'px-2 py-1 transition-opacity duration-(--duration-hover) ease-out'
const CURRENT = `${SEGMENT} bg-white/10 text-on-ink`
const ACTION = `${SEGMENT} text-on-ink-subtle hover:text-on-ink focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50`

export function EditorToolbarView({
  isDraft,
  returnTo,
  disablePath,
  editHref,
  status,
  onEnableDrafts,
}: EditorToolbarViewProps) {
  return (
    <aside
      aria-label="Editor toolbar"
      // bottom-right, by editorial preference (#60). This sat bottom-left to
      // leave room for a "back to top" affordance that was never built and is
      // not planned; reserving a corner for a hypothesis cost the real toolbar
      // the corner an editor looks in.
      className="text-legal border-on-ink-line bg-ink/95 fixed bottom-4 right-4 z-50 flex items-center gap-1 border p-1 font-sans shadow-lg print:hidden"
    >
      <span className="text-on-ink-subtle px-2 uppercase tracking-[0.1em]">Preview</span>

      {isDraft ? (
        <a className={ACTION} href={disableDraftModeHref(disablePath, returnTo)}>
          Published
        </a>
      ) : (
        <span className={CURRENT} aria-current="true">
          Published
        </span>
      )}

      {isDraft ? (
        <span className={CURRENT} aria-current="true">
          Drafts
        </span>
      ) : (
        <button
          className={ACTION}
          type="button"
          onClick={onEnableDrafts}
          disabled={status === 'working'}
        >
          {status === 'working' ? 'Checking…' : 'Drafts'}
        </button>
      )}

      {/* The whole point of the toolbar growing past the switcher: one hop
          from the page to the tool that edits it, on the page you are on.
          Same tab — Presentation loads this page back into its own frame, so
          nothing is lost by leaving. */}
      <span aria-hidden="true" className="bg-on-ink-line mx-1 h-4 w-px" />
      <a className={ACTION} href={editHref}>
        Edit this page
      </a>

      {status === 'error' ? (
        // A literal, not a token: this toolbar takes no design language from
        // the frames. #FF6A5A rather than the brand red because the string is
        // 12px on near-black, where #EB1000 lands under 4.5:1.
        <span className="px-2 text-[#ff6a5a]" role="status">
          Sign in at /studio
        </span>
      ) : null}
    </aside>
  )
}
