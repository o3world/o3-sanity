/**
 * The scoring, characterised on committed crops, and the plan, on fixtures
 * (#338). No Storybook build, no browser, no Figma token: the six PNGs beside
 * this file are 320px crops of the shape the real comparison meets, described
 * in `__fixtures__/frame-score/README.md`.
 *
 * These are characterisation tests, so they pin ranges rather than numbers.
 * The claim under test is the one #339's ledger rests on: a pair that matches
 * scores near zero, and a pair carrying the drift that shipped in #325 scores
 * far enough past it that a tolerance can sit between the two.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { PNG } from 'pngjs'
import { afterAll, describe, expect, it } from 'vitest'

import type { Shot } from './capture'
import {
  formatScoring,
  frameViewport,
  planFrameScoring,
  scoreFrame,
  type FrameExport,
} from './frame-score'
import type { PairingRow } from './pairing'
import type { StoryEntry } from './storybook'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '__fixtures__/frame-score')
const diffDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-frame-score-'))
afterAll(() => fs.rmSync(diffDir, { recursive: true, force: true }))

function fixture(name: string): FrameExport {
  const file = path.join(FIXTURES, `${name}.frame.png`)
  const image = PNG.sync.read(fs.readFileSync(file))
  return { brand: 'o3', nodeId: '1:1', file, width: image.width, height: image.height }
}

function capture(name: string): Shot {
  return {
    storyId: 'content-blocks-section-band--as-seeded',
    title: 'Content/Blocks/Section/Band',
    name: 'As Seeded',
    viewport: 'frame-320',
    file: path.join(FIXTURES, `${name}.capture.png`),
  }
}

function score(name: string) {
  return scoreFrame({
    capture: capture(name),
    frame: fixture(name),
    nodeId: '1:1',
    brand: 'o3',
    diffDir,
    threshold: 0.1,
  })
}

describe('scoreFrame', () => {
  it('scores a pair that matches near zero, whatever the two rasterisers did to the edges', () => {
    // The two files are not identical — the capture carries blended edge
    // pixels the frame does not. pixelmatch's own antialiasing detection is
    // what absorbs them, which is the property that makes a cross-renderer
    // score readable at all: an edge drawn slightly differently is not drift.
    const result = score('near-match')
    expect(result.ratio).toBeLessThan(0.01)
    expect(result.heightDelta).toBe(0)
  })

  it('scores the #325 padding miss far past any tolerance the match would need', () => {
    const drifted = score('padding-drift')
    const matched = score('near-match')
    expect(drifted.ratio).toBeGreaterThan(0.02)
    // The gap is the point: a tolerance can sit between the two by an order of
    // magnitude, which is what makes the scalar worth recording.
    expect(drifted.ratio).toBeGreaterThan(matched.ratio * 10)
  })

  it('reports a height difference as its own number rather than folding it into the score', () => {
    const result = score('height-drift')
    expect(result.heightDelta).toBe(40)
    expect(result.widthDelta).toBe(0)
    // Padded to the union, not cropped to the shorter: the 40 rows the capture
    // has and the frame does not are counted as the difference they are.
    expect(result.changedPixels).toBeGreaterThanOrEqual(320 * 40)
  })

  it('writes a diff image for every pair, including one that matches', () => {
    const result = score('near-match')
    expect(result.comparison.files.diff).toBeDefined()
    expect(fs.existsSync(result.comparison.files.diff as string)).toBe(true)
  })

  it('is stable: the same pair scored twice is the same number', () => {
    expect(score('padding-drift').ratio).toBe(score('padding-drift').ratio)
  })
})

describe('frameViewport', () => {
  it('captures at the frame’s own width, so nothing is resampled between the sides', () => {
    expect(frameViewport(1440)).toEqual({ name: 'frame-1440', width: 1440, height: 900 })
    expect(frameViewport(402)).toEqual({ name: 'frame-402', width: 402, height: 844 })
  })

  it('floors the capture at the narrowest width the layout answers for', () => {
    // An icon set exports at 24px. A 24px-wide browser renders a story no
    // design ever described; the width delta is where that pairing shows up.
    expect(frameViewport(24)).toEqual({ name: 'frame-320', width: 320, height: 844 })
  })

  it('takes its height from vr’s own pair, not from the frame', () => {
    // A 10,000px page frame is a scroll, not a window that tall — and the
    // shutter is full-page, so only `100vh` can see this number.
    expect(frameViewport(776).height).toBe(844)
    expect(frameViewport(1024).height).toBe(900)
  })
})

function story(id: string, title = 'Content/Blocks/Section/Band'): StoryEntry {
  return {
    id,
    title,
    name: 'As Seeded',
    importPath: `./${id}.stories.tsx`,
    type: 'story',
    tags: [],
  }
}

function pairing(overrides: Partial<PairingRow> & { storyId: string; nodeId: string }): PairingRow {
  return {
    title: 'Content/Blocks/Section/Band',
    exportName: 'AsSeeded',
    fileKeyRef: 'FIGMA_FILE_KEY',
    file: 'packages/content-ui/src/Band.stories.tsx',
    declaredOn: 'story',
    hosts: ['o3'],
    designBrand: 'o3',
    match: 'componentSet',
    trackedName: 'Band',
    route: null,
    ...overrides,
  }
}

function exported(nodeId: string, width = 1440, height = 900): FrameExport {
  return { brand: 'o3', nodeId, file: `/exports/${nodeId}.png`, width, height }
}

describe('planFrameScoring', () => {
  const exports = new Map([['o3/1:1', exported('1:1', 402)]])

  it('scores a paired story whose node has an export, at the frame’s width', () => {
    const plan = planFrameScoring({
      stories: [story('band--seeded')],
      pairings: [pairing({ storyId: 'band--seeded', nodeId: '1:1' })],
      exports,
    })
    expect(plan.targets).toHaveLength(1)
    expect(plan.targets[0]?.nodeId).toBe('1:1')
    expect(plan.targets[0]?.viewport.width).toBe(402)
    expect(plan.unpaired).toEqual([])
    expect(plan.unkeyed).toEqual([])
  })

  it('lists a story with no pairing as unpaired rather than failing it', () => {
    const plan = planFrameScoring({
      stories: [story('button--primary', 'UI/Button')],
      pairings: [],
      exports,
    })
    expect(plan.unpaired.map((entry) => entry.id)).toEqual(['button--primary'])
    expect(plan.targets).toEqual([])
  })

  it('lists a pairing the baseline could not key as unkeyed, with the reason it was given', () => {
    const plan = planFrameScoring({
      stories: [story('band--seeded')],
      pairings: [pairing({ storyId: 'band--seeded', nodeId: '9:9' })],
      exports,
      reasons: new Map([['o3/9:9', 'not tracked by figma:sync']]),
    })
    expect(plan.unkeyed).toEqual([
      {
        storyId: 'band--seeded',
        nodeId: '9:9',
        brand: 'o3',
        why: 'not tracked by figma:sync',
      },
    ])
    expect(plan.targets).toEqual([])
  })

  it('gives every story citing one frame its own comparison', () => {
    const plan = planFrameScoring({
      stories: [story('band--seeded'), story('band--mobile')],
      pairings: [
        pairing({ storyId: 'band--seeded', nodeId: '1:1' }),
        pairing({ storyId: 'band--mobile', nodeId: '1:1' }),
      ],
      exports,
    })
    expect(plan.targets.map((target) => target.story.id)).toEqual(['band--mobile', 'band--seeded'])
  })

  it('takes a story that cites two nodes as two comparisons', () => {
    const plan = planFrameScoring({
      stories: [story('band--seeded')],
      pairings: [
        pairing({ storyId: 'band--seeded', nodeId: '1:1' }),
        pairing({ storyId: 'band--seeded', nodeId: '2:2' }),
      ],
      exports: new Map([
        ['o3/1:1', exported('1:1', 402)],
        ['o3/2:2', exported('2:2', 1440)],
      ]),
    })
    expect(plan.targets.map((target) => target.viewport.name)).toEqual(['frame-402', 'frame-1440'])
  })

  it('does not score a pairing whose design file nothing in the repo owns', () => {
    const plan = planFrameScoring({
      stories: [story('band--seeded')],
      pairings: [pairing({ storyId: 'band--seeded', nodeId: '1:1', designBrand: null })],
      exports,
    })
    expect(plan.targets).toEqual([])
    expect(plan.unkeyed.map((row) => row.brand)).toEqual([null])
  })
})

describe('formatScoring', () => {
  it('names every unpaired and unkeyed row rather than capping the lists', () => {
    const plan = planFrameScoring({
      stories: [story('band--seeded'), story('button--primary', 'UI/Button')],
      pairings: [pairing({ storyId: 'band--seeded', nodeId: '9:9' })],
      exports: new Map(),
    })
    const text = formatScoring(plan, [])
    expect(text).toContain('Unkeyed (1)')
    expect(text).toContain('band--seeded')
    expect(text).toContain('Unpaired (1)')
    expect(text).toContain('button--primary')
  })

  it('prints the score and the height delta for each pair', () => {
    const plan = planFrameScoring({ stories: [], pairings: [], exports: new Map() })
    const text = formatScoring(plan, [score('height-drift')])
    expect(text).toMatch(/Scored against Figma \(1\)/)
    expect(text).toContain('+40px')
  })
})
