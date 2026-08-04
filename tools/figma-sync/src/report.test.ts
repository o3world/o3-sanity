import { describe, expect, it } from 'vitest'

import {
  buildReport,
  formatChangedEntry,
  renderReportMarkdown,
  shortCircuitSummary,
} from './report'

import type { Baseline, TrackedManifest } from './types'

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

  // Removal is the one case where the manifest cannot answer "what was this?",
  // so the baseline has to remember. Without that, a deleted component set
  // lands in `changedFrames` and reads as a page that vanished.
  it('files a removed set the manifest still describes under changedComponentSets', () => {
    // The node is gone from Figma but the entry is still in the manifest —
    // `sync.ts` records no hash for it, so it diffs as removed.
    const report = buildReport({
      ...base,
      shortCircuited: false,
      diff: { added: [], modified: [], removed: ['1710:2271'] },
    })
    expect(report.changedFrames).toEqual([])
    expect(report.changedComponentSets).toEqual([
      {
        nodeId: '1710:2271',
        name: 'NavBar',
        route: null,
        variant: null,
        codeComponent: 'apps/web/src/ui/SiteNav.tsx#SiteNav',
        change: 'removed',
      },
    ])
  })

  it('files a set dropped from the manifest under changedComponentSets, per the baseline’s kind', () => {
    const report = buildReport({
      ...base,
      shortCircuited: false,
      diff: { added: [], modified: [], removed: ['136:754'] },
      previousKinds: { '136:754': 'componentSet' },
    })
    expect(report.changedFrames).toEqual([])
    // Nothing describes it any more, so it names itself — but it is still
    // filed as the kind of thing it was, and consumers of
    // `changedComponentSets` still get the `codeComponent` key.
    expect(report.changedComponentSets).toEqual([
      {
        nodeId: '136:754',
        name: '136:754',
        route: null,
        variant: null,
        codeComponent: null,
        change: 'removed',
      },
    ])
  })

  it('files a page frame dropped from the manifest under changedFrames', () => {
    const report = buildReport({
      ...base,
      shortCircuited: false,
      diff: { added: [], modified: [], removed: ['9:9'] },
      previousKinds: { '9:9': 'pageFrame' },
    })
    expect(report.changedComponentSets).toEqual([])
    expect(report.changedFrames).toHaveLength(1)
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
              state: 'firstSeen',
              firstSeenAt: '2026-08-03T12:00:00.000Z',
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

  it('says how long a conflict has gone unreconciled, not just that it exists', () => {
    const md = renderReportMarkdown(
      buildReport({
        ...base,
        shortCircuited: false,
        assets: {
          regenerated: [],
          lockedConflicts: [
            {
              path: 'tools/migration/data/seed/assets/live-fintech.png',
              nodeId: '1751:2003',
              reason: 'node-changed',
              note: 'Hand-cropped 527×544 out of the 791×544 original.',
              state: 'stillOpen',
              firstSeenAt: '2026-07-30T09:00:00.000Z',
            },
          ],
          failures: [],
        },
      }),
    )
    // A conflict nobody has reconciled has to read as a standing debt, not as
    // news that just arrived (#81).
    expect(md).toContain('still open')
    expect(md).toContain('2026-07-30T09:00:00.000Z')
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

describe('formatChangedEntry', () => {
  /**
   * One formatter, two arms. The console summary and the markdown report used
   * to compose the same four optional fragments in two places, which is how
   * they drift.
   */
  const set = {
    nodeId: '1710:2271',
    name: 'NavBar',
    route: null,
    variant: null,
    codeComponent: 'apps/web/src/ui/SiteNav.tsx#SiteNav',
    change: 'modified',
  } as const

  it('renders a page frame for a human reading a terminal', () => {
    const frame = {
      nodeId: '1680:2134',
      name: 'Home',
      route: '/',
      variant: 'desktop',
      change: 'modified',
    } as const
    expect(formatChangedEntry(frame, 'plain')).toBe('  modified Home (desktop) → /  1680:2134')
    expect(formatChangedEntry(frame, 'markdown')).toBe(
      '- **Home** (desktop) → `/` — modified `1680:2134`',
    )
  })

  it('names the code a set routes to in both arms', () => {
    expect(formatChangedEntry(set, 'plain')).toContain('→ apps/web/src/ui/SiteNav.tsx#SiteNav')
    expect(formatChangedEntry(set, 'markdown')).toContain('→ `apps/web/src/ui/SiteNav.tsx#SiteNav`')
  })

  it('spells out a set that routes nowhere, and only for sets', () => {
    expect(formatChangedEntry({ ...set, codeComponent: null }, 'plain')).toContain(
      '→ no code target',
    )
    const frame = { nodeId: '9:9', name: '9:9', route: null, variant: null, change: 'removed' }
    expect(formatChangedEntry(frame as never, 'plain')).not.toContain('code target')
  })
})

describe('shortCircuitSummary', () => {
  /**
   * A short-circuited run writes nothing at all (#81) — the report files on
   * disk still describe the last real run — so the console is the *only* place
   * an unreconciled conflict can surface. It has to.
   */
  const baseline: Baseline = {
    fileKey: 'RvraLJaZ0zWm8UaD5AJf43',
    version: '1000',
    lastModified: '2026-08-01T00:00:00Z',
    syncedAt: '2026-08-01T00:05:00Z',
    hashes: {},
  }

  it('says when the last sync was, and that it wrote nothing', () => {
    const lines = shortCircuitSummary(baseline).join('\n')
    expect(lines).toContain('no changes since 2026-08-01T00:05:00Z')
    expect(lines).toContain('nothing written')
  })

  it('still surfaces the conflicts the baseline is carrying', () => {
    const lines = shortCircuitSummary({
      ...baseline,
      openAssetConflicts: [
        {
          path: 'tools/migration/data/seed/assets/live-fintech.png',
          nodeId: '1751:2003',
          conflictHash: 'deadbeef',
          entryFingerprint: 'fingerprint',
          firstSeenAt: '2026-07-30T09:00:00.000Z',
          reason: 'node-changed',
          note: 'Hand-cropped 527×544 out of the 791×544 original.',
        },
      ],
    }).join('\n')

    expect(lines).toContain('1 unreconciled locked-asset conflict')
    expect(lines).toContain('live-fintech.png')
    expect(lines).toContain('2026-07-30T09:00:00.000Z')
  })

  it('pluralises, because "1 conflicts" reads like a bug in the tool', () => {
    const conflict = {
      nodeId: '1751:2003',
      conflictHash: 'deadbeef',
      entryFingerprint: 'fingerprint',
      firstSeenAt: '2026-07-30T09:00:00.000Z',
      reason: 'node-changed',
      note: 'why',
    } as const
    const lines = shortCircuitSummary({
      ...baseline,
      openAssetConflicts: [
        { ...conflict, path: 'a.png' },
        { ...conflict, path: 'b.png' },
      ],
    }).join('\n')
    expect(lines).toContain('2 unreconciled locked-asset conflicts')
  })
})
