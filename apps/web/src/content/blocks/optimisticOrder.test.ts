import { describe, expect, it } from 'vitest'
import type { SanityBlock } from '@o3/sanity/types'

import { reconcileOptimisticOrder } from './optimisticOrder'

/**
 * The optimistic-reorder reducer behind an on-canvas drag in Presentation.
 *
 * Two things are worth pinning here, and neither is visible in a browser: the
 * payload's ordering stubs must come back as the RICH blocks the renderer
 * already holds, and a run that holds only part of an interleaved field
 * (`caseStudy.story`, ADR 0018) must refuse to draw a picture the editor did
 * not ask for.
 */
const DOC = 'caseStudy-wp-1'

/** A rich block, as the GROQ projection hands it over. */
function block(key: string, extra: Record<string, unknown> = {}): SanityBlock {
  return { _key: key, _type: 'mediaSection', media: { alt: key }, ...extra } as SanityBlock
}

/** An ordering stub, as the overlay's mutated document carries it. */
function stub(key: string, type = 'mediaSection', extra: Record<string, unknown> = {}) {
  return { _key: key, _type: type, ...extra }
}

function reorder(current: SanityBlock[], story: unknown[]) {
  return reconcileOptimisticOrder(current, { id: DOC, document: { story } }, DOC, 'story')
}

const keysOf = (blocks: SanityBlock[]) => blocks.map((b) => b._key)

describe('reconcileOptimisticOrder', () => {
  it('reorders the run it holds and keeps the rich block behind each key', () => {
    const current = [block('a'), block('b'), block('c')]
    const next = reorder(current, [stub('ch1', 'chapter'), stub('b'), stub('a'), stub('c')])

    expect(keysOf(next)).toEqual(['b', 'a', 'c'])
    // The payload's stubs carry no `media`; the projection's blocks do.
    expect((next[0] as unknown as { media?: unknown }).media).toEqual({ alt: 'b' })
  })

  it('overlays the plain-JSON knobs a Studio field can patch', () => {
    const current = [block('a', { surface: 'white' })]
    const next = reorder(current, [stub('a', 'mediaSection', { surface: 'ink' })])

    expect(next[0]).toMatchObject({ _key: 'a', surface: 'ink', media: { alt: 'a' } })
  })

  it('is a no-op for another document, an unknown id, or a field it cannot find', () => {
    const current = [block('a'), block('b')]
    const payload = [stub('b'), stub('a')]

    expect(
      reconcileOptimisticOrder(
        current,
        { id: 'someone-else', document: { story: payload } },
        DOC,
        'story',
      ),
    ).toBe(current)
    expect(
      reconcileOptimisticOrder(
        current,
        { id: DOC, document: { story: payload } },
        undefined,
        'story',
      ),
    ).toBe(current)
    expect(reconcileOptimisticOrder(current, { id: DOC, document: {} }, DOC, 'story')).toBe(current)
  })

  it('follows the draft id when the overlay reports the published one', () => {
    const current = [block('a'), block('b')]
    const next = reconcileOptimisticOrder(
      current,
      { id: `drafts.${DOC}`, originalId: DOC, document: { story: [stub('b'), stub('a')] } },
      DOC,
      'story',
    )

    expect(keysOf(next)).toEqual(['b', 'a'])
  })

  describe('the contiguity gate', () => {
    // `story` is `[ch1, a, b, c, ch2, d]`; this run is the `[a, b, c]` between
    // the two chapters, and `d` belongs to the run after `ch2`.
    const run = [block('a'), block('b'), block('c')]

    it('holds still when a drag carries a member across a chapter boundary', () => {
      // `a` dragged to the end of the document. Filtering the payload would
      // render `[b, c, a]` — `a` under the FIRST chapter, which is a slot the
      // editor never chose. The band waits for the mutation instead.
      const next = reorder(run, [
        stub('ch1', 'chapter'),
        stub('b'),
        stub('c'),
        stub('ch2', 'chapter'),
        stub('d'),
        stub('a'),
      ])

      expect(next).toBe(run)
    })

    it('holds still when a foreign member is dropped into the middle of the run', () => {
      const next = reorder(run, [
        stub('ch1', 'chapter'),
        stub('a'),
        stub('ch2', 'chapter'),
        stub('b'),
        stub('c'),
        stub('d'),
      ])

      expect(next).toBe(run)
    })

    it('holds still when a member the run holds is not in the payload at all', () => {
      const next = reorder(run, [stub('ch1', 'chapter'), stub('b'), stub('c')])

      expect(next).toBe(run)
    })

    it('still reorders inside the run, which is the drag that has to feel instant', () => {
      const next = reorder(run, [
        stub('ch1', 'chapter'),
        stub('c'),
        stub('a'),
        stub('b'),
        stub('ch2', 'chapter'),
        stub('d'),
      ])

      expect(keysOf(next)).toEqual(['c', 'a', 'b'])
    })
  })
})
