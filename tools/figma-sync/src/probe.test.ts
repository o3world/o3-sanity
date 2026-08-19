import { describe, expect, it } from 'vitest'

import { findUntrackedFrames } from './probe'

import type { SectionChild } from './probe'
import type { TrackedManifest } from './types'

/**
 * The new-frame probe (#79). It answers one question — *is there design work
 * in the Design Concept section that the manifest has never heard of?* — and
 * it is deliberately the **only** thing in this package that looks outside the
 * manifest. It surfaces candidates; a human promotes them (the two-generations
 * distinction, `docs/agents/figma.md`).
 *
 * Fixtures, not the live section: what the section holds changes with every
 * design session, and a test that reads it would fail on someone else's work.
 */

const manifest: TrackedManifest = {
  fileKey: 'RvraLJaZ0zWm8UaD5AJf43',
  sectionNodeIds: ['1632:1510'],
  entries: [
    { nodeId: '1680:2134', kind: 'pageFrame', name: 'Home', route: '/', variant: 'desktop' },
    { nodeId: '1814:1618', kind: 'pageFrame', name: 'Home', route: '/', variant: 'mobile' },
    {
      nodeId: '1710:2271',
      kind: 'componentSet',
      name: 'NavBar',
      codeComponent: 'apps/web/src/ui/SiteNav.tsx#SiteNav',
    },
  ],
  ignoredNodeIds: [{ nodeId: '1799:1607', name: 'Intro section', note: 'A study, not a page.' }],
}

const child = (over: Partial<SectionChild> & Pick<SectionChild, 'id'>): SectionChild => ({
  name: 'Frame',
  type: 'FRAME',
  absoluteBoundingBox: { width: 1440 },
  ...over,
})

describe('findUntrackedFrames', () => {
  it('flags a frame the manifest has never heard of', () => {
    const untracked = findUntrackedFrames(
      [child({ id: '2050:891', name: 'Contact', absoluteBoundingBox: { width: 1440 } })],
      manifest,
    )
    expect(untracked).toEqual([{ nodeId: '2050:891', name: 'Contact', width: 1440 }])
  })

  it('says nothing about the frames the manifest already tracks', () => {
    expect(
      findUntrackedFrames(
        [
          child({ id: '1680:2134', name: 'Home' }),
          child({ id: '1814:1618', name: 'Home - Mobile' }),
        ],
        manifest,
      ),
    ).toEqual([])
  })

  it('stays quiet about known noise on the ignore list', () => {
    expect(
      findUntrackedFrames([child({ id: '1799:1607', name: 'Intro section' })], manifest),
    ).toEqual([])
  })

  it('ignores children that are not frames — components live in the section too', () => {
    expect(
      findUntrackedFrames(
        [
          child({ id: '9:1', name: 'NavBar', type: 'COMPONENT' }),
          child({ id: '9:2', name: 'Notes', type: 'TEXT' }),
          child({ id: '9:3', name: 'Group 8', type: 'GROUP' }),
        ],
        manifest,
      ),
    ).toEqual([])
  })

  it('reports the width, so a 1440/402 page frame is told from a section study', () => {
    const untracked = findUntrackedFrames(
      [
        child({ id: '9:1', name: 'Contact', absoluteBoundingBox: { width: 1440.4 } }),
        child({ id: '9:2', name: 'Contact - Mobile', absoluteBoundingBox: { width: 402 } }),
      ],
      manifest,
    )
    expect(untracked.map((frame) => frame.width)).toEqual([1440, 402])
  })

  it('survives a child the API gives no bounding box', () => {
    expect(
      findUntrackedFrames([child({ id: '9:1', absoluteBoundingBox: null })], manifest),
    ).toEqual([{ nodeId: '9:1', name: 'Frame', width: null }])
  })

  it('keeps the section order and reports every stray, duplicates included', () => {
    const untracked = findUntrackedFrames(
      [
        child({ id: '2117:800', name: 'Blog Post' }),
        child({ id: '1680:2134', name: 'Home' }),
        child({ id: '2118:858', name: 'Blog Post' }),
      ],
      manifest,
    )
    expect(untracked.map((frame) => frame.nodeId)).toEqual(['2117:800', '2118:858'])
  })

  it('needs no ignore list — the manifest may not carry one', () => {
    const bare: TrackedManifest = { ...manifest, ignoredNodeIds: undefined }
    expect(findUntrackedFrames([child({ id: '1799:1607' })], bare)).toHaveLength(1)
  })
})
