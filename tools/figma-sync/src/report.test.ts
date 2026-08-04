import { describe, expect, it } from 'vitest'

import { buildReport, renderReportMarkdown } from './report'

import type { TrackedManifest } from './types'

const manifest: TrackedManifest = {
  fileKey: 'RvraLJaZ0zWm8UaD5AJf43',
  sectionNodeId: '1632:1510',
  entries: [
    { nodeId: '1680:2134', kind: 'pageFrame', name: 'Home', route: '/', variant: 'desktop' },
    { nodeId: '1814:1618', kind: 'pageFrame', name: 'Home', route: '/', variant: 'mobile' },
    {
      nodeId: '1710:2271',
      kind: 'componentSet',
      name: 'NavBar',
      codeComponent: 'packages/ui/src/NavBar',
      variant: 'desktop',
    },
  ],
}

const base = { ranAt: '2026-08-03T12:00:00.000Z', fileVersion: '1234567890', manifest }

describe('buildReport', () => {
  it('keeps every section present — later tickets fill them, never reshape them', () => {
    const report = buildReport({ ...base, shortCircuited: true })
    expect(report).toEqual({
      schemaVersion: 1,
      ranAt: '2026-08-03T12:00:00.000Z',
      fileVersion: '1234567890',
      shortCircuited: true,
      changedFrames: [],
      changedComponentSets: [],
      untrackedFrames: [],
      assets: { regenerated: [], lockedConflicts: [], failures: [] },
      errors: [],
    })
  })

  it('reports a changed frame by name and route, and leaves untouched frames out', () => {
    const report = buildReport({
      ...base,
      shortCircuited: false,
      diff: { added: [], modified: ['1680:2134'], removed: [] },
    })
    expect(report.changedFrames).toEqual([
      { nodeId: '1680:2134', name: 'Home', route: '/', variant: 'desktop', change: 'modified' },
    ])
    expect(report.changedComponentSets).toEqual([])
  })

  it('files a component set under changedComponentSets, not changedFrames', () => {
    const report = buildReport({
      ...base,
      shortCircuited: false,
      diff: { added: [], modified: ['1710:2271'], removed: [] },
    })
    expect(report.changedFrames).toEqual([])
    expect(report.changedComponentSets).toEqual([
      { nodeId: '1710:2271', name: 'NavBar', route: null, variant: 'desktop', change: 'modified' },
    ])
  })

  it('marks a first-run node as added', () => {
    const report = buildReport({
      ...base,
      shortCircuited: false,
      diff: { added: ['1814:1618'], modified: [], removed: [] },
    })
    expect(report.changedFrames).toEqual([
      { nodeId: '1814:1618', name: 'Home', route: '/', variant: 'mobile', change: 'added' },
    ])
  })

  it('still reports a removed node the manifest no longer describes', () => {
    const report = buildReport({
      ...base,
      shortCircuited: false,
      diff: { added: [], modified: [], removed: ['9:9'] },
    })
    expect(report.changedFrames).toEqual([
      { nodeId: '9:9', name: '9:9', route: null, variant: null, change: 'removed' },
    ])
  })

  it('carries errors through', () => {
    const report = buildReport({ ...base, shortCircuited: false, errors: ['node 9:9 not found'] })
    expect(report.errors).toEqual(['node 9:9 not found'])
  })
})

describe('renderReportMarkdown', () => {
  it('names the changed frame and its route', () => {
    const md = renderReportMarkdown(
      buildReport({
        ...base,
        shortCircuited: false,
        diff: { added: [], modified: ['1680:2134'], removed: [] },
      }),
    )
    expect(md).toContain('Home')
    expect(md).toContain('/')
    expect(md).toContain('1680:2134')
  })

  it('says so plainly when nothing changed', () => {
    const md = renderReportMarkdown(buildReport({ ...base, shortCircuited: true }))
    expect(md).toContain('No changes')
  })
})
