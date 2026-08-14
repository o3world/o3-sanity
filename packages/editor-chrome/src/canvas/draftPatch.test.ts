import { describe, expect, it, vi } from 'vitest'
import type { NodePatchList } from '@sanity/mutate'

import { commitPatch, initialDraftSnapshot, tryGetDocument, type PatchTarget } from './draftPatch'

const patches = [] as unknown as NodePatchList

const handlers = () => ({ onSettle: vi.fn(), onError: vi.fn() })

describe('commitPatch', () => {
  it('commits, then settles', async () => {
    const target: PatchTarget = { patch: vi.fn(() => Promise.resolve()) }
    const h = handlers()

    await commitPatch(target, patches, h)

    expect(target.patch).toHaveBeenCalledWith(patches, { commit: true })
    expect(h.onSettle).toHaveBeenCalledOnce()
    expect(h.onError).not.toHaveBeenCalled()
  })

  // The regression the ordering exists for: settling beside the commit re-read
  // the draft before the mutation landed, so the highlight showed the OLD value.
  it('settles only after the commit resolves', async () => {
    let release!: () => void
    const target: PatchTarget = {
      patch: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            release = resolve
          }),
      ),
    }
    const h = handlers()

    const done = commitPatch(target, patches, h)
    expect(h.onSettle).not.toHaveBeenCalled()

    release()
    await done
    expect(h.onSettle).toHaveBeenCalledOnce()
  })

  it('surfaces a rejected patch and does NOT settle', async () => {
    const boom = new Error('Document not found')
    const target: PatchTarget = { patch: vi.fn(() => Promise.reject(boom)) }
    const h = handlers()

    await commitPatch(target, patches, h)

    expect(h.onError).toHaveBeenCalledWith(boom)
    expect(h.onSettle).not.toHaveBeenCalled()
  })

  // A stopped mutator actor throws on the call itself. Without the try/catch
  // that escapes into the click handler — the one failure shape the promise
  // chain cannot see.
  it('surfaces a synchronous throw rather than letting it escape', async () => {
    const boom = new Error("Event 'mutate' was sent to stopped actor")
    const target: PatchTarget = {
      patch: vi.fn(() => {
        throw boom
      }),
    }
    const h = handlers()

    await expect(commitPatch(target, patches, h)).resolves.toBeUndefined()
    expect(h.onError).toHaveBeenCalledWith(boom)
    expect(h.onSettle).not.toHaveBeenCalled()
  })

  // The published types declare `patch()` as void; the implementation is async.
  it('tolerates a target whose patch really does return void', async () => {
    const target: PatchTarget = { patch: vi.fn(() => undefined) }
    const h = handlers()

    await commitPatch(target, patches, h)

    expect(h.onSettle).toHaveBeenCalledOnce()
    expect(h.onError).not.toHaveBeenCalled()
  })
})

describe('initialDraftSnapshot', () => {
  it('returns the snapshot when the sync getter has one', () => {
    const snapshot = { _id: 'page-index', _type: 'page' }
    expect(initialDraftSnapshot({ get: () => snapshot })).toBe(snapshot)
  })

  // THE crash this exists for: `doc.get()` reads visual-editing's deprecated
  // sync snapshot getter, which THROWS ("Snapshot for document … not found")
  // until the mutator machine has fetched the doc — it does not return
  // undefined. Mounting the toolbar during that window (the first hover on a
  // heavy page) took the whole preview tree down with it.
  it('returns undefined while the mutator machine has no snapshot yet', () => {
    expect(
      initialDraftSnapshot({
        get: () => {
          throw new Error('Snapshot for document "page-index" not found')
        },
      }),
    ).toBeUndefined()
  })

  it('returns undefined for a document the store has not seen at all', () => {
    expect(
      initialDraftSnapshot({
        get: () => {
          throw new Error('Document "page-index" not found')
        },
      }),
    ).toBeUndefined()
  })
})

describe('tryGetDocument', () => {
  it('hands back the document when the store has one', () => {
    const doc = { get: () => undefined }
    expect(tryGetDocument(() => doc, 'page-index')).toBe(doc)
  })

  it('degrades to undefined while the optimistic actor is still the empty one', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(
      tryGetDocument(() => {
        throw new Error("The 'useDocuments' hook cannot be used in this context")
      }, 'page-index'),
    ).toBeUndefined()
    expect(logged).toHaveBeenCalled()
    logged.mockRestore()
  })
})
