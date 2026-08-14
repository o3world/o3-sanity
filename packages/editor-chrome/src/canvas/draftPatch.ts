import type { NodePatchList } from '@sanity/mutate'

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
 * WHERE A REJECTED MUTATION GOES — the console, for v1, and deliberately so
 * (#111 decides this).
 *
 * There is no toast to raise. Sanity's `useToast` is a Studio-side context and
 * our chrome mounts inside the preview iframe, under `<VisualEditing />`'s own
 * root rather than under Studio's providers, so there is nothing to call. Our
 * own surface is not a line either: a toast has to OUTLIVE the hover to be
 * read, and a custom overlay component is unmounted the moment the pointer
 * leaves the element (#108, constraint 1), so it would have to live beside
 * `<VisualEditing />` with its own mount, stacking, dismissal and geometry.
 * That is a ticket, and #124 is it.
 *
 * What this function buys in the meantime is that there is exactly ONE place to
 * attach that surface when it exists, and that every message names the action
 * and the path rather than saying a patch failed. "The patch vanished" is a
 * recurring support shape in the prior art, and a console line an editor never
 * opens does not fix it — but it is the difference between a report someone can
 * act on and one that starts from nothing.
 */
export function reportCanvasFailure(what: string, error: unknown): void {
  console.error(`[canvas] ${what}`, error)
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
