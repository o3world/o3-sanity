import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { hashSubtree, stableStringify } from './hash'
import { normalizeNode } from './normalize'

/**
 * Normalization is the correctness-critical seam (#78): if a no-op read of the
 * file produces a different hash, every run reports a phantom diff and the
 * report stops meaning anything. These fixtures are the two cases that matter
 * — the same frame seen from a different place on the canvas (must hash equal)
 * and the same frame with one word rewritten (must not).
 */

const FIXTURES = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures')
const load = (name: string): unknown => JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'))

const frame = load('frame.json')
const volatileFrame = load('frame-volatile.json')
const editedFrame = load('frame-edited.json')

describe('hashSubtree', () => {
  it('is stable across two reads of the same tree', () => {
    expect(hashSubtree(frame)).toBe(hashSubtree(load('frame.json')))
  })

  it('ignores volatile differences — canvas position, prototype wiring, sub-pixel jitter', () => {
    expect(hashSubtree(volatileFrame)).toBe(hashSubtree(frame))
  })

  it('reports a real content change', () => {
    expect(hashSubtree(editedFrame)).not.toBe(hashSubtree(frame))
  })

  it('is a sha256 hex digest', () => {
    expect(hashSubtree(frame)).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('normalizeNode', () => {
  it('strips absolute canvas coordinates but keeps size, rounded to whole pixels', () => {
    const node = normalizeNode({
      absoluteBoundingBox: { x: 1200.4, y: -480.2, width: 1439.6, height: 3200.2 },
    }) as { absoluteBoundingBox: Record<string, number> }
    expect(node.absoluteBoundingBox).toEqual({ height: 3200, width: 1440 })
  })

  it('strips volatile and workflow-only keys', () => {
    expect(
      normalizeNode({
        name: 'Hero',
        scrollBehavior: 'SCROLLS',
        layoutVersion: 4,
        devStatus: { type: 'READY_FOR_DEV' },
        interactions: [{ trigger: { type: 'ON_CLICK' } }],
        transitionNodeID: '1:2',
      }),
    ).toEqual({ name: 'Hero' })
  })

  it('drops empty collections and nullish values, which the API includes inconsistently', () => {
    expect(normalizeNode({ name: 'Hero', effects: [], boundVariables: {}, styles: null })).toEqual({
      name: 'Hero',
    })
  })

  it('keeps relativeTransform — position within the parent is a real change', () => {
    const moved = normalizeNode({
      relativeTransform: [
        [1, 0, 0],
        [0, 1, 120],
      ],
    })
    const still = normalizeNode({
      relativeTransform: [
        [1, 0, 0],
        [0, 1, 0],
      ],
    })
    expect(stableStringify(moved)).not.toBe(stableStringify(still))
  })

  it('preserves child order — z-order is meaningful', () => {
    const a = normalizeNode({ children: [{ name: 'Hero' }, { name: 'Footer' }] })
    const b = normalizeNode({ children: [{ name: 'Footer' }, { name: 'Hero' }] })
    expect(stableStringify(a)).not.toBe(stableStringify(b))
  })
})

describe('stableStringify', () => {
  it('sorts object keys, so key order out of the API cannot move the hash', () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(
      stableStringify({ a: { c: 3, d: 2 }, b: 1 }),
    )
  })

  it('does not sort arrays', () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]))
  })
})
