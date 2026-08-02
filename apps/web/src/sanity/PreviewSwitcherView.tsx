'use client'

import { disableDraftModeHref } from './draftPreview'

/**
 * The preview switcher's pixels (#60) — a pure function of props, with no
 * hooks and no imports beyond the href helper.
 *
 * Kept apart from `PreviewSwitcherChip` on purpose: the chip's presentation
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

export type PreviewSwitcherStatus = 'idle' | 'working' | 'error'

export interface PreviewSwitcherViewProps {
  /** Next.js draft mode is on — the page is showing drafts. */
  isDraft: boolean
  /** The path to come back to after leaving draft mode. */
  returnTo: string
  status: PreviewSwitcherStatus
  onEnableDrafts: () => void
}

const SEGMENT = 'px-2 py-1 transition-opacity duration-(--duration-hover) ease-out'
const CURRENT = `${SEGMENT} bg-white/10 text-on-ink`
const ACTION = `${SEGMENT} text-on-ink-subtle hover:text-on-ink focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50`

export function PreviewSwitcherView({
  isDraft,
  returnTo,
  status,
  onEnableDrafts,
}: PreviewSwitcherViewProps) {
  return (
    <aside
      aria-label="Preview mode"
      // bottom-left: the nav owns the top (z-50, fixed) and a "back to top"
      // affordance conventionally owns bottom-right.
      className="text-legal border-on-ink-line bg-ink/95 fixed bottom-4 left-4 z-50 flex items-center gap-1 border p-1 font-sans shadow-lg print:hidden"
    >
      <span className="text-on-ink-subtle px-2 uppercase tracking-[0.1em]">Preview</span>

      {isDraft ? (
        <a className={ACTION} href={disableDraftModeHref(returnTo)}>
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

      {status === 'error' ? (
        <span className="text-brand-tint px-2" role="status">
          Sign in at /studio
        </span>
      ) : null}
    </aside>
  )
}
