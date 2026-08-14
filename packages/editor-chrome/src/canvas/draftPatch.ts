import type { NodePatchList } from '@sanity/mutate'

import { canvasNotices } from './notices'

/**
 * READING AND WRITING THE DRAFT — one path for every canvas surface, so they
 * settle and fail identically rather than each re-deriving the promise
 * handling.
 *
 * Ported close to verbatim from the prior art, because every line of it is a
 * bug that shipped. Three behaviours it exists to hold:
 *
 *   - `doc.get()` and `getDocument()` **throw** before the mutator machine has
 *     the document. Inside a `useState` initialiser that throw takes down the
 *     whole preview tree, which Presentation reports as "Could not connect to
 *     the preview" — a message that names neither the toolbar nor the cause.
 *   - SETTLE AFTER the commit, never beside it. Re-pulling the snapshot
 *     synchronously read the draft before the mutation had landed, so a
 *     current-value highlight showed the OLD value.
 *   - A REJECTED patch must surface. "Document not found" or a dead mutator
 *     actor used to arrive as an unhandled rejection while the bar sat there
 *     looking like it had worked.
 *
 * #108 uses only the reads — the toolbar names things and writes nothing. The
 * writes come with the knobs in #109, and they are here now because they are
 * the same two failure modes seen from the other side.
 */

/** The slice of `useDocuments().getDocument()` a commit needs. */
export interface PatchTarget {
  patch: (patches: NodePatchList, options?: { commit?: boolean }) => unknown
}

/** The slice of `useDocuments().getDocument()` a snapshot read needs. */
export interface SnapshotSource {
  get: (path?: string) => unknown
}

/**
 * First snapshot read at toolbar mount. `doc.get()` reads visual-editing's
 * deprecated sync snapshot getter, which THROWS until the mutator machine has
 * fetched the document — "Snapshot for document … not found" (machine exists,
 * fetch pending) or "Document … not found" (the store has not seen the id).
 * Undefined is the correct degraded value: the settle effect re-pulls via the
 * async `getSnapshot()` as soon as the machine is ready.
 */
export function initialDraftSnapshot(doc: SnapshotSource): Record<string, unknown> | undefined {
  try {
    return doc.get() as Record<string, unknown> | undefined
  } catch {
    return undefined
  }
}

/**
 * `useDocuments().getDocument(id)`, or undefined when the mutator cannot serve
 * it yet — the same defensive read as `initialDraftSnapshot`, one level up.
 *
 * `getDocument()` is EAGER, and it throws two different ways: `Document "…"
 * not found` before the store has seen the id, and `The 'useDocuments' hook
 * cannot be used in this context` while the optimistic actor is still the
 * empty one. The second window is reachable from any surface that renders on
 * a Presentation connection alone — the environment flips true as soon as the
 * comlink is up, but the actor is only set after the async features handshake
 * reports `optimistic`, and never if a Studio version mismatch means it does
 * not.
 *
 * Why a helper rather than a try around `commitPatch`: an argument is
 * evaluated in the CALLER, before the callee's try exists, so
 * `commitPatch(getDocument(id), …)` throws straight through `commitPatch`'s
 * own handling and out of the click handler — exactly the unhandled shape that
 * surfaces as "Could not connect to the preview".
 */
export function tryGetDocument<T>(getDocument: (id: string) => T, id: string): T | undefined {
  try {
    return getDocument(id)
  } catch (error: unknown) {
    console.error(`[canvas] document ${id} is not available yet`, error)
    return undefined
  }
}

/**
 * WHERE A REJECTED MUTATION GOES — to the editor, and to the console (#124).
 *
 * #111 shipped this as a console line and said on the ticket that it was a v1
 * answer. It was, for two reasons that are still true and that neither the
 * message nor this function could fix on its own. There is no toast to raise:
 * Sanity's `useToast` is a Studio-side context and our chrome mounts inside the
 * preview iframe, under `<VisualEditing />`'s own portal rather than under
 * Studio's providers. And a notice has to OUTLIVE the hover, while a custom
 * overlay component is unmounted the moment the pointer leaves the element
 * (#108, constraint 1) — which is exactly when an editor moves it to see what
 * happened.
 *
 * So the surface is not in the toolbar's tree at all. `canvasNotices` is a
 * module-level queue and `<CanvasNotices />` mounts beside `<VisualEditing />`
 * to read it. This function is the seam #111 left for it: ONE place every
 * canvas failure passes through, with a message that names the action and the
 * GROQ path rather than saying a patch failed.
 *
 * THE CONSOLE LINE STAYS. The queue carries what an editor can act on — the
 * action, the path, the reason. The console keeps the error OBJECT, stack and
 * all, which is what whoever they report it to needs. Two audiences, two
 * lines; dropping either would cost one of them.
 *
 * WHAT DOES NOT COME HERE. `tryGetDocument` above logs without raising a
 * notice, and that is the boundary: an unresolved snapshot is a state the
 * toolbar recovers from a frame later on its own. A notice is for a mutation
 * an editor has already seen the canvas repaint.
 */
export function reportCanvasFailure(what: string, error: unknown): void {
  console.error(`[canvas] ${what}`, error)
  canvasNotices.publish(what, error)
}

export interface CommitHandlers {
  /** Re-pull the snapshot — runs only after the mutation has landed. */
  onSettle: () => void
  onError: (error: unknown) => void
}

/**
 * `Promise.resolve` around the call rather than `.then` on it: the published
 * types declare `patch()` as returning void even though the implementation is
 * an `async function`, so this handles the real promise without an unsound
 * cast — and still works if the typing is ever corrected.
 *
 * The try/catch covers the same failure arriving SYNCHRONOUSLY (a mutator that
 * throws on a stopped actor). Without it that throw escapes into the click
 * handler, which is the one shape of "the patch vanished" the promise chain
 * cannot see.
 */
export function commitPatch(
  target: PatchTarget,
  patches: NodePatchList,
  { onSettle, onError }: CommitHandlers,
): Promise<void> {
  let pending: unknown
  try {
    pending = target.patch(patches, { commit: true })
  } catch (error: unknown) {
    onError(error)
    return Promise.resolve()
  }
  return Promise.resolve(pending)
    .then(() => {
      onSettle()
    })
    .catch((error: unknown) => {
      onError(error)
    })
}
