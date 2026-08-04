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
      codeComponent: 'apps/web/src/ui/SiteNav.tsx#SiteNav',
    },
    {
      nodeId: '734:1073',
      kind: 'componentSet',
      name: 'Shapes',
      codeComponent: null,
      note: 'Decorative quarter-circles — a background treatment, not a component.',
    },
  ],
  ignoredNodeIds: [{ nodeId: '1799:1607', name: 'Intro section', note: 'A study, not a page.' }],
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
    // The set carries the code it routes to — that is what makes "this set
    // changed" actionable instead of just localised (#79).
    expect(report.changedComponentSets).toEqual([
      {
        nodeId: '1710:2271',
        name: 'NavBar',
        route: null,
        variant: null,
        codeComponent: 'apps/web/src/ui/SiteNav.tsx#SiteNav',
        change: 'modified',
      },
    ])
  })

  it('says a set maps to nothing rather than leaving the reader to guess', () => {
    const report = buildReport({
      ...base,
      shortCircuited: false,
      diff: { added: [], modified: ['734:1073'], removed: [] },
    })
    expect(report.changedComponentSets).toEqual([
      {
        nodeId: '734:1073',
        name: 'Shapes',
        route: null,
        variant: null,
        codeComponent: null,
        change: 'modified',
      },
    ])
  })

  it('carries the probe’s untracked frames through untouched', () => {
    const report = buildReport({
      ...base,
      shortCircuited: false,
      untrackedFrames: [{ nodeId: '2050:891', name: 'Contact', width: 1440 }],
    })
    expect(report.untrackedFrames).toEqual([{ nodeId: '2050:891', name: 'Contact', width: 1440 }])
    // The probe never promotes: nothing about it touches the tracked sections.
    expect(report.changedFrames).toEqual([])
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

  it('carries the asset stage through into the section that was always there', () => {
    const report = buildReport({
      ...base,
      shortCircuited: false,
      assets: {
        regenerated: [
          {
            path: 'tools/migration/data/seed/assets/live-healthcare.png',
            nodeId: '1751:2010',
            export: 'imageFill',
            reason: 'node-changed',
          },
        ],
        lockedConflicts: [],
        failures: [{ path: 'x.png', nodeId: '9:9', error: 'no image URL' }],
      },
    })
    expect(report.assets.regenerated).toHaveLength(1)
    expect(report.assets.lockedConflicts).toEqual([])
    expect(report.assets.failures).toHaveLength(1)
    // The top-level shape is the same one #78 fixed.
    expect(Object.keys(report.assets)).toEqual(['regenerated', 'lockedConflicts', 'failures'])
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

  it('names the code a changed set routes to', () => {
    const md = renderReportMarkdown(
      buildReport({
        ...base,
        shortCircuited: false,
        diff: { added: [], modified: ['1710:2271'], removed: [] },
      }),
    )
    expect(md).toContain('NavBar')
    expect(md).toContain('apps/web/src/ui/SiteNav.tsx#SiteNav')
  })

  it('separates what it rewrote from what it refused to touch', () => {
    const md = renderReportMarkdown(
      buildReport({
        ...base,
        shortCircuited: false,
        assets: {
          regenerated: [
            {
              path: 'tools/migration/data/seed/assets/live-healthcare.png',
              nodeId: '1751:2010',
              export: 'imageFill',
              reason: 'node-changed',
            },
          ],
          lockedConflicts: [
            {
              path: 'tools/migration/data/seed/assets/live-fintech.png',
              nodeId: '1751:2003',
              reason: 'node-changed',
              note: 'Hand-cropped 527×544 out of the 791×544 original.',
            },
          ],
          failures: [
            {
              path: 'tools/migration/data/seed/assets/work-city.png',
              nodeId: '9:9',
              error: 'gone',
            },
          ],
        },
      }),
    )
    expect(md).toContain('live-healthcare.png')
    // The lock has to read as a decision to reconcile, not as a failure.
    expect(md).toContain('reconcile by hand')
    expect(md).toContain('Hand-cropped')
    expect(md).toContain('gone')
  })

  it('says nothing about assets when the stage did nothing', () => {
    const md = renderReportMarkdown(buildReport({ ...base, shortCircuited: false }))
    expect(md).not.toContain('## Assets')
  })

  it('lists untracked frames with the triage the reader has to do', () => {
    const md = renderReportMarkdown(
      buildReport({
        ...base,
        shortCircuited: false,
        untrackedFrames: [{ nodeId: '2050:891', name: 'Contact', width: 1440 }],
      }),
    )
    expect(md).toContain('Contact')
    expect(md).toContain('2050:891')
    expect(md).toContain('1440')
    // Two ways out, and the report has to say both — otherwise it reads as a
    // failure rather than a decision.
    expect(md).toMatch(/tracked-nodes\.json/)
    expect(md).toMatch(/ignoredNodeIds/)
  })
})
