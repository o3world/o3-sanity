/**
 * The cache plan, on fixtures. No token, no network, no filesystem — the
 * whole point of the seam is that "what would this run fetch?" is answerable
 * without asking Figma anything (#337).
 */
import { describe, expect, it } from 'vitest'

import {
  exportFile,
  formatExportReport,
  parseExportFile,
  planExports,
  type BrandBaseline,
  type CachedExport,
} from './export-cache'
import type { PairingRow } from './pairing'

function pairing(overrides: Partial<PairingRow> & { nodeId: string }): PairingRow {
  return {
    storyId: `story--${overrides.nodeId}`,
    title: 'Content/Blocks/Thing',
    exportName: 'Desktop',
    fileKeyRef: 'FIGMA_FILE_KEY',
    file: 'packages/content-ui/src/Thing.stories.tsx',
    declaredOn: 'story',
    hosts: ['o3'],
    designBrand: 'o3',
    match: 'componentSet',
    trackedName: 'Thing',
    route: null,
    ...overrides,
  }
}

const o3: BrandBaseline = {
  brand: 'o3',
  fileKey: 'RvraLJaZ',
  hashes: { '1:1': 'aaaa000000001111', '2:2': 'bbbb000000002222' },
}

describe('exportFile', () => {
  it('names a file by node id and hash, colon-free', () => {
    expect(exportFile('o3', '1710:2609', 'abcdef0123456789ff')).toBe(
      'o3/1710-2609@abcdef012345.png',
    )
  })

  it('round-trips through parseExportFile', () => {
    expect(parseExportFile('o3', '1710-2609@abcdef012345.png')).toEqual({
      brand: 'o3',
      nodeId: '1710:2609',
      hash: 'abcdef012345',
    })
  })

  it('ignores a file that is not an export', () => {
    expect(parseExportFile('o3', 'notes.txt')).toBeNull()
    expect(parseExportFile('o3', '1710-2609.png')).toBeNull()
  })
})

describe('planExports', () => {
  it('plans a fetch for every paired node the baseline knows', () => {
    const plan = planExports([pairing({ nodeId: '1:1' }), pairing({ nodeId: '2:2' })], [o3], [])
    expect(plan.fetch.map((request) => request.nodeId)).toEqual(['1:1', '2:2'])
    expect(plan.fresh).toEqual([])
    expect(plan.fetch[0]).toMatchObject({ fileKey: 'RvraLJaZ', hash: 'aaaa000000001111' })
  })

  it('asks for one export per node, however many stories name it', () => {
    const plan = planExports(
      [
        pairing({ nodeId: '1:1', storyId: 'a--one' }),
        pairing({ nodeId: '1:1', storyId: 'b--two' }),
      ],
      [o3],
      [],
    )
    expect(plan.fetch).toHaveLength(1)
    expect(plan.fetch[0]?.stories).toEqual(['a--one', 'b--two'])
  })

  it('fetches nothing when every node is already cached at its baseline hash', () => {
    const cached: CachedExport[] = [
      { brand: 'o3', nodeId: '1:1', hash: 'aaaa00000000' },
      { brand: 'o3', nodeId: '2:2', hash: 'bbbb00000000' },
    ]
    const plan = planExports([pairing({ nodeId: '1:1' }), pairing({ nodeId: '2:2' })], [o3], cached)
    expect(plan.fetch).toEqual([])
    expect(plan.fresh.map((request) => request.nodeId)).toEqual(['1:1', '2:2'])
    expect(plan.stale).toEqual([])
  })

  it('invalidates exactly the node whose baseline hash moved', () => {
    const moved: BrandBaseline = { ...o3, hashes: { ...o3.hashes, '2:2': 'cccc000000003333' } }
    const cached: CachedExport[] = [
      { brand: 'o3', nodeId: '1:1', hash: 'aaaa00000000' },
      { brand: 'o3', nodeId: '2:2', hash: 'bbbb00000000' },
    ]
    const plan = planExports(
      [pairing({ nodeId: '1:1' }), pairing({ nodeId: '2:2' })],
      [moved],
      cached,
    )
    expect(plan.fetch.map((request) => request.nodeId)).toEqual(['2:2'])
    expect(plan.fresh.map((request) => request.nodeId)).toEqual(['1:1'])
    expect(plan.stale).toEqual([{ brand: 'o3', nodeId: '2:2', hash: 'bbbb00000000' }])
  })

  it('names a node the baseline does not know rather than guessing at it', () => {
    const plan = planExports([pairing({ nodeId: '9:9', storyId: 'lost--one' })], [o3], [])
    expect(plan.fetch).toEqual([])
    expect(plan.unknown).toEqual([
      { brand: 'o3', nodeId: '9:9', reason: 'not-in-baseline', stories: ['lost--one'] },
    ])
  })

  it('names a pairing whose design file nothing owns', () => {
    const plan = planExports(
      [pairing({ nodeId: '9:9', designBrand: null, match: 'untracked', storyId: 'typo--one' })],
      [o3],
      [],
    )
    expect(plan.unknown).toEqual([
      { brand: null, nodeId: '9:9', reason: 'no-design-file', stories: ['typo--one'] },
    ])
  })

  it('names every node of a brand that has never been synced', () => {
    const unsynced: BrandBaseline = { brand: 'o3', fileKey: 'RvraLJaZ', hashes: null }
    const plan = planExports([pairing({ nodeId: '1:1' })], [unsynced], [])
    expect(plan.fetch).toEqual([])
    expect(plan.unknown.map((node) => node.reason)).toEqual(['no-baseline'])
  })

  it('sweeps a cached export no pairing claims any more', () => {
    const cached: CachedExport[] = [{ brand: 'o3', nodeId: '7:7', hash: 'dddd00000000' }]
    const plan = planExports([pairing({ nodeId: '1:1' })], [o3], cached)
    expect(plan.stale).toEqual(cached)
  })

  it('names a node whose brand handed the run no baseline at all', () => {
    const plan = planExports([pairing({ nodeId: '1:1' })], [], [])
    expect(plan.fetch).toEqual([])
    expect(plan.unknown.map((node) => node.reason)).toEqual(['no-baseline'])
  })
})

describe('formatExportReport', () => {
  const plan = planExports(
    [pairing({ nodeId: '1:1' }), pairing({ nodeId: '9:9', storyId: 'lost--one' })],
    [o3],
    [{ brand: 'o3', nodeId: '2:2', hash: 'bbbb00000000' }],
  )

  it('counts what was fetched, what was already there, and what it could not place', () => {
    const report = formatExportReport(plan, { fetched: 1, missing: [] })
    expect(report).toContain('fetched 1 · cache hits 0 · unknown to the baseline 1')
    expect(report).toContain('9:9')
    expect(report).toContain('lost--one')
  })

  it('names a node the Figma file no longer has', () => {
    const report = formatExportReport(plan, {
      fetched: 0,
      missing: [{ brand: 'o3', nodeId: '1:1', stories: ['story--1:1'] }],
    })
    expect(report).toContain('Missing from the Figma file (1)')
    expect(report).toContain('story--1:1')
  })
})
