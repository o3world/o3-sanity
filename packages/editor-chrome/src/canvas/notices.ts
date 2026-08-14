/**
 * WHERE A REJECTED MUTATION GOES (#124) — a queue, read by a surface that
 * outlives the toolbar that filled it.
 *
 * #111 sent canvas failures to `console.error` and said so on the ticket. This
 * is the half that stops that being the whole answer. Two constraints shaped
 * it, and neither is about the message:
 *
 *   - **There is no toast to raise.** Sanity's `useToast` is a Studio-side
 *     context, and our chrome mounts inside the preview iframe under
 *     `<VisualEditing />`'s own portal rather than under Studio's providers.
 *     Nothing to call from where the toolbar stands.
 *   - **A notice has to outlive the hover.** A custom overlay component renders
 *     only while its element is hovered (`ElementOverlay.tsx:594` renders
 *     `hovered ? <ElementOverlayInner/> : null`), so a notice drawn from inside
 *     the toolbar is gone the instant the editor moves the pointer to look at
 *     what happened — which is the same instant, every time.
 *
 * So the notice cannot be React state anywhere in the toolbar's tree. It is a
 * module-level queue: the toolbar writes to it through `reportCanvasFailure`,
 * and `CanvasNotices` — mounted beside `<VisualEditing />`, in the page's own
 * tree — reads it. One module, imported by both sides from the same file that
 * mounts them, so there is one queue by construction rather than by luck.
 *
 * Everything with a rule in it is here, in `.ts`, so it is unit-tested rather
 * than argued about: what counts as a repeat, how many notices a corner holds,
 * what order they arrive in, and what the surface reads. `CanvasNotices.tsx` is
 * a subscription and `CanvasNoticesView.tsx` is markup.
 */

/** One failure an editor should see. */
export interface CanvasNotice {
  /** Stable for this notice's life. Unique even across identical messages. */
  id: string
  /**
   * What failed, in `reportCanvasFailure`'s own words — the action and the
   * GROQ path ("could not remove sections[_key==\"a\"]"), never "a patch
   * failed". It is the half of the message a support report can act on.
   */
  what: string
  /** The reason the rejection carried, when it carried a readable one. */
  detail?: string | undefined
  /** How many times this same failure has been reported since it was raised. */
  count: number
}

export interface CanvasNoticeQueue {
  /**
   * The queue, oldest first. Reference-stable between changes, because
   * `useSyncExternalStore` re-renders forever on a snapshot that is a new array
   * every call.
   */
  notices: () => readonly CanvasNotice[]
  publish: (what: string, error: unknown) => void
  dismiss: (id: string) => void
  /** Every notice at once — the Escape key and the "Dismiss all" row. */
  clear: () => void
  subscribe: (listener: () => void) => () => void
}

/**
 * HOW MANY A CORNER HOLDS. Three, and the oldest drops.
 *
 * A rejected mutation is usually one of a run — an editor clicks Remove, sees
 * nothing happen, and clicks again. Repeats collapse (below), so reaching this
 * limit means three genuinely different failures are outstanding, and a fourth
 * stacked on top would cover the page rather than explain it. The oldest goes
 * because the newest is the one the editor's last click produced.
 */
export const CANVAS_NOTICE_LIMIT = 3

/** One frozen array, so an empty queue is `===` to itself across reads. */
const NONE: readonly CanvasNotice[] = Object.freeze([])

/**
 * The readable reason inside a rejection, or nothing.
 *
 * Deliberately narrow. `String(error)` on an object gives "[object Object]",
 * which is worse than silence: it fills the one line an editor reads with
 * noise and hides that there was no reason to give. The console line
 * `reportCanvasFailure` still writes keeps the whole object for whoever opens
 * the drawer.
 */
export function failureDetail(error: unknown): string | undefined {
  const message =
    typeof error === 'string'
      ? error
      : typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: unknown }).message
        : undefined
  if (typeof message !== 'string') return undefined
  const trimmed = message.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * The notice's first line, as a sentence.
 *
 * `what` is written as a fragment for a console line — "could not remove
 * sections[_key==\"a\"]" — because that is what reads well after a `[canvas]`
 * tag. On a surface an editor reads it is the whole sentence, so it starts
 * like one. Only the first character is touched: the rest is a GROQ path and a
 * field name, and both are case-sensitive facts about the document.
 */
export function noticeHeadline(what: string): string {
  return what.charAt(0).toUpperCase() + what.slice(1)
}

/**
 * A queue. Exported as a factory so a test gets its own — the module singleton
 * below is shared by construction, which is exactly what makes it useless to
 * assert against twice in one file.
 */
export function createCanvasNoticeQueue({
  limit = CANVAS_NOTICE_LIMIT,
}: { limit?: number } = {}): CanvasNoticeQueue {
  let current: readonly CanvasNotice[] = NONE
  let issued = 0
  const listeners = new Set<() => void>()

  const commit = (next: readonly CanvasNotice[]) => {
    current = next.length === 0 ? NONE : next
    // A copy, so a listener that unsubscribes itself does not truncate the walk.
    for (const listener of [...listeners]) listener()
  }

  return {
    notices: () => current,

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    /**
     * REPEATS COLLAPSE, AND KEEP THEIR PLACE. The same failure reported again
     * is the same failure: an editor clicking Remove three times against a dead
     * mutator has one problem, not three, and three identical cards say so
     * three times while pushing everything else off the corner.
     *
     * It keeps its position rather than jumping to the newest slot, because a
     * stack that reorders under a pointer reaching for a dismiss button is a
     * stack that dismisses the wrong thing.
     *
     * Identity is the message AND the reason. Two rejections of the same action
     * for different reasons are two things to know.
     */
    publish(what, error) {
      const detail = failureDetail(error)
      const at = current.findIndex((notice) => notice.what === what && notice.detail === detail)
      if (at !== -1) {
        const repeated = current.slice()
        repeated[at] = { ...current[at]!, count: current[at]!.count + 1 }
        commit(repeated)
        return
      }
      issued += 1
      commit([...current, { id: `canvas-notice-${issued}`, what, detail, count: 1 }].slice(-limit))
    },

    dismiss(id) {
      const next = current.filter((notice) => notice.id !== id)
      // No notification when nothing moved: a subscriber re-rendering for a
      // dismissal of something already gone is a render nobody asked for.
      if (next.length === current.length) return
      commit(next)
    },

    clear() {
      if (current.length === 0) return
      commit(NONE)
    },
  }
}

/**
 * THE ONE QUEUE. `reportCanvasFailure` writes here and `CanvasNotices` reads
 * here; they are two files in one package, imported by one app file, so this is
 * a shared module instance rather than a global anyone has to keep in step.
 */
export const canvasNotices: CanvasNoticeQueue = createCanvasNoticeQueue()
