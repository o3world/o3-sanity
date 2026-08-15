import { describe, expect, it } from 'vitest'

import type { SanityBlock } from '@o3/sanity/types'

import { sectionAnchors } from './anchors'

/**
 * The seam a jump link lands on. Every consumer — the published render and the
 * draft preview — comes through here, so what a duplicate does is answered once
 * rather than per renderer.
 */
const band = (key: string, anchor?: string | null): SanityBlock =>
  ({ _key: key, _type: 'ctaSection', anchor }) as unknown as SanityBlock

describe('sectionAnchors', () => {
  it('gives a band the id an editor typed, character for character', () => {
    // The button side emits `#` + the stored value, so anything done to it here
    // is a link that resolves to nothing.
    const anchors = sectionAnchors([band('a', 'How_We-Work42')])
    expect(anchors.get('a')).toBe('How_We-Work42')
  })

  it('skips a band with no anchor', () => {
    const anchors = sectionAnchors([band('a'), band('b', null), band('c', '')])
    expect([...anchors]).toEqual([])
  })

  it('gives the name to the first band that claims it, and the loser none', () => {
    // Two elements with one id is invalid HTML that browsers resolve by
    // scrolling to the first. The link lands where it would have anyway, and
    // the page stays valid on the way.
    const anchors = sectionAnchors([band('a', 'pricing'), band('b', 'pricing'), band('c', 'team')])
    expect(anchors.get('a')).toBe('pricing')
    expect(anchors.has('b')).toBe(false)
    expect(anchors.get('c')).toBe('team')
  })

  it('strips the whitespace a paste can carry in', () => {
    expect(sectionAnchors([band('a', '  the-team  ')]).get('a')).toBe('the-team')
  })
})
