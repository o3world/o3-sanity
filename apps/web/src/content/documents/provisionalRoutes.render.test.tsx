import { describe, expect, it } from 'vitest'

import { caseStudyIndex, insightIndex } from '@/content/documents'
import type { RouteProvenance } from '@/lib/content-routes/types'

/**
 * The route half of the #40 provisional mechanism (ADR 0007).
 *
 * `tools/migration/src/seed.test.ts` holds these rules for **documents**. A
 * collection index has no document (CONTEXT.md), so its marker lives on the
 * route entry — and the rules here are deliberately the same ones, because a
 * marker that behaves differently depending on where it is written is a marker
 * nobody trusts.
 *
 * **Why the render layer for a data assertion.** Only the render project
 * resolves the `@/` alias and the four module stubs, and a route entry's
 * module graph reaches a React renderer. Why this lives here and not in
 * `verify` is ADR 0012.
 */
/**
 * Only the provenance, not the whole entry: `IndexEntry<Q>` is invariant in
 * `Q` (see the design note in `content-routes/types.ts`), so a heterogeneous
 * tuple of concrete entries will not widen to `IndexEntry<string>`.
 */
const INDEX_ROUTES: readonly [name: string, migration: RouteProvenance | undefined][] = [
  ['insightIndex', insightIndex.migration],
  ['caseStudyIndex', caseStudyIndex.migration],
]

describe('collection index provenance', () => {
  it.each(INDEX_ROUTES)('%s uses a real boolean for provisional', (_name, migration) => {
    const { provisional } = migration ?? {}
    if (provisional === undefined) return
    expect(typeof provisional).toBe('boolean')
  })

  it.each(INDEX_ROUTES)('%s says what would clear it when provisional', (_name, migration) => {
    const { provisional, provisionalNote } = migration ?? {}
    if (provisional !== true) return
    expect(provisionalNote?.trim()).toBeTruthy()
  })

  it.each(INDEX_ROUTES)('%s never claims both a frame and provisional', (_name, migration) => {
    // Mutually exclusive by definition: `figmaNode` says the composition was
    // transcribed from a canonical frame, `provisional` says no frame exists.
    // A route setting both is describing two different pages.
    const { provisional, figmaNode } = migration ?? {}
    if (provisional !== true) return
    expect(figmaNode).toBeUndefined()
  })

  /**
   * Pinned by name rather than left to the generic rules above. This was the
   * largest coverage gap on map #33 — 272 articles behind a top-level nav link
   * that no frame drew — and #61 closed it: `2336:4310` was commissioned,
   * ruled canonical on 2026-08-13, and the route is transcribed from it. The
   * assertion inverts rather than disappearing, so the marker cannot come back
   * without someone saying why.
   */
  it('no longer marks /insights provisional — it has a frame now (#61)', () => {
    expect(insightIndex.migration?.provisional).not.toBe(true)
    expect(insightIndex.migration?.figmaNode).toBe('2336:4310')
  })

  it('does not mark /work provisional — it has one (#43)', () => {
    expect(caseStudyIndex.migration?.provisional).not.toBe(true)
    expect(caseStudyIndex.migration?.figmaNode).toBe('1634:1167')
  })
})
