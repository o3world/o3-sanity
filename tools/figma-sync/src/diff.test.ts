import { describe, expect, it } from 'vitest'

import { diffHashes, isBaselineFresh } from './diff'

import type { Baseline } from './types'

const baseline: Baseline = {
  fileKey: 'RvraLJaZ0zWm8UaD5AJf43',
  version: '1000',
  lastModified: '2026-08-01T00:00:00Z',
  syncedAt: '2026-08-01T00:05:00Z',
  hashes: { '1:1': 'aaa', '1:2': 'bbb' },
}

describe('diffHashes', () => {
  it('reports nothing when every hash matches', () => {
    expect(diffHashes(baseline.hashes, { '1:1': 'aaa', '1:2': 'bbb' })).toEqual({
      added: [],
      modified: [],
      removed: [],
    })
  })

  it('reports only the node whose hash moved', () => {
    expect(diffHashes(baseline.hashes, { '1:1': 'aaa', '1:2': 'ccc' })).toEqual({
      added: [],
      modified: ['1:2'],
      removed: [],
    })
  })

  it('treats a newly tracked node as added, not modified', () => {
    expect(diffHashes(baseline.hashes, { '1:1': 'aaa', '1:2': 'bbb', '1:3': 'ddd' })).toEqual({
      added: ['1:3'],
      modified: [],
      removed: [],
    })
  })

  it('treats every node as added against an empty baseline (the first run)', () => {
    expect(diffHashes({}, { '1:1': 'aaa', '1:2': 'bbb' })).toEqual({
      added: ['1:1', '1:2'],
      modified: [],
      removed: [],
    })
  })

  it('reports a node the manifest no longer tracks as removed', () => {
    expect(diffHashes(baseline.hashes, { '1:1': 'aaa' })).toEqual({
      added: [],
      modified: [],
      removed: ['1:2'],
    })
  })
})

describe('isBaselineFresh', () => {
  const meta = { version: '1000', lastModified: '2026-08-01T00:00:00Z' }
  const tracked = ['1:1', '1:2']

  it('is fresh when version, lastModified and tracked coverage all match', () => {
    expect(isBaselineFresh(baseline, meta, tracked)).toBe(true)
  })

  it('is stale when the file version moved', () => {
    expect(isBaselineFresh(baseline, { ...meta, version: '1001' }, tracked)).toBe(false)
  })

  it('is stale when lastModified moved even if the version string did not', () => {
    expect(
      isBaselineFresh(baseline, { ...meta, lastModified: '2026-08-02T00:00:00Z' }, tracked),
    ).toBe(false)
  })

  it('is stale when the manifest gained a node the baseline has never hashed', () => {
    expect(isBaselineFresh(baseline, meta, ['1:1', '1:2', '1:3'])).toBe(false)
  })

  it('is stale when the manifest dropped a node the baseline still carries', () => {
    expect(isBaselineFresh(baseline, meta, ['1:1'])).toBe(false)
  })

  it('is stale when there is no baseline at all', () => {
    expect(isBaselineFresh(null, meta, tracked)).toBe(false)
  })
})
