import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { diffHashes } from './diff'
import { hashSubtree } from './hash'
import { buildReport } from './report'

import type { TrackedManifest } from './types'

/**
 * Component sets in the tracked set (#79) — the whole point of which is
 * *localisation*: a designer reworking `Button / Solid` should read as "that
 * set changed", routed at the code side to its one cva component, rather than
 * as an unexplained diff on every page frame that instances it.
 *
 * The set and the frame are hashed independently, so an edit inside the set
 * moves both hashes. Both must be reported — **alongside**, never instead of.
 * That is what these fixtures overlap to prove: the same label rewritten in
 * the set and in the frame that renders it.
 */

const FIXTURES = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures')
const load = (name: string): unknown => JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'))

const SET = '136:754'
const FRAME = '1680:2134'

const manifest: TrackedManifest = {
  fileKey: 'RvraLJaZ0zWm8UaD5AJf43',
  sectionNodeId: '1632:1510',
  entries: [
    {
      nodeId: FRAME,
      kind: 'pageFrame',
      name: 'Home',
      figmaName: 'Home',
      route: '/',
      variant: 'desktop',
    },
    {
      nodeId: SET,
      kind: 'componentSet',
      name: 'Button / Solid',
      figmaName: 'Button / Solid',
      codeComponent: 'packages/ui/src/components/ui/button.tsx#Button',
    },
  ],
}

const hashesFor = (set: string, frame: string) => ({
  [FRAME]: hashSubtree(load(frame)),
  [SET]: hashSubtree(load(set)),
})

const before = hashesFor('component-set.json', 'frame-with-instance.json')

describe('a component set is hashed like a frame', () => {
  it('is stable when neither the set nor the frame moved', () => {
    expect(diffHashes(before, hashesFor('component-set.json', 'frame-with-instance.json'))).toEqual(
      {
        added: [],
        modified: [],
        removed: [],
      },
    )
  })

  it('reports the set alongside the page frame that instances it', () => {
    const after = hashesFor('component-set-edited.json', 'frame-with-instance-edited.json')
    const diff = diffHashes(before, after)
    expect(diff.modified.sort()).toEqual([FRAME, SET].sort())

    const report = buildReport({
      ranAt: '2026-08-03T12:00:00.000Z',
      fileVersion: '1234567890',
      shortCircuited: false,
      manifest,
      diff,
    })
    // Alongside, not instead of: the set says *what* changed, the frame says
    // *where* it shows.
    expect(report.changedComponentSets).toEqual([
      {
        nodeId: SET,
        name: 'Button / Solid',
        route: null,
        variant: null,
        codeComponent: 'packages/ui/src/components/ui/button.tsx#Button',
        change: 'modified',
      },
    ])
    expect(report.changedFrames).toEqual([
      { nodeId: FRAME, name: 'Home', route: '/', variant: 'desktop', change: 'modified' },
    ])
  })

  it('reports the set on its own when no tracked frame renders the edit', () => {
    const diff = diffHashes(
      before,
      hashesFor('component-set-edited.json', 'frame-with-instance.json'),
    )
    const report = buildReport({
      ranAt: '2026-08-03T12:00:00.000Z',
      fileVersion: '1234567890',
      shortCircuited: false,
      manifest,
      diff,
    })
    expect(report.changedComponentSets.map((entry) => entry.nodeId)).toEqual([SET])
    expect(report.changedFrames).toEqual([])
  })
})
