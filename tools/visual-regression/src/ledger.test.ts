/**
 * The ledger and the verdicts, on fixtures (#339). No browser, no network, no
 * Figma token and no filesystem: whether a run is red is a question about four
 * plain objects, and this file is the proof.
 */
import { describe, expect, it } from 'vitest'

import type { BrandBaseline, MissingNode } from './export-cache'
import type { FrameScore, UnkeyedPairing } from './frame-score'
import {
  DEFAULT_TOLERANCE,
  EMPTY_LEDGER,
  acceptScores,
  formatVerdicts,
  isFailing,
  ledgerKey,
  parseLedger,
  planVerdicts,
  serializeLedger,
  type Ledger,
  type LedgerEntry,
} from './ledger'
import type { StoryEntry } from './storybook'

const HOME = 'pages-home--desktop'
const NODE = '1680:2134'
const VIEWPORT = 'frame-1440'
const KEY = `o3/${HOME}/o3/${NODE}/${VIEWPORT}`

const baselines: BrandBaseline[] = [
  {
    brand: 'o3',
    fileKey: 'RvraLJaZ',
    version: '2391349966960467923',
    hashes: { [NODE]: 'aaaa1111', '2:2': 'bbbb2222' },
  },
]

function score(overrides: Partial<FrameScore> = {}): FrameScore {
  return {
    storyId: HOME,
    nodeId: NODE,
    brand: 'o3',
    viewport: VIEWPORT,
    ratio: 0.2574,
    changedPixels: 4160422,
    heightDelta: 57,
    widthDelta: 118,
    comparison: {
      storyId: HOME,
      title: 'Pages/Home',
      name: 'Desktop',
      viewport: VIEWPORT,
      verdict: 'changed',
      ratio: 0.2574,
      changedPixels: 4160422,
      resized: true,
      files: {},
    },
    ...overrides,
  }
}

function story(id: string): StoryEntry {
  return {
    id,
    name: 'Default',
    title: 'UI/Thing',
    importPath: './thing.stories.tsx',
    type: 'story',
  }
}

function entry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    score: 0.2574,
    tolerance: DEFAULT_TOLERANCE,
    nodeHash: 'aaaa1111',
    fileVersion: '2391349966960467923',
    acceptedAt: '2026-08-24',
    ...overrides,
  }
}

function ledger(overrides: Partial<Ledger> = {}): Ledger {
  return { pairs: { [KEY]: entry() }, unpairable: {}, ...overrides }
}

function plan(input: {
  ledger?: Ledger
  scores?: readonly FrameScore[]
  unkeyed?: readonly UnkeyedPairing[]
  missing?: readonly MissingNode[]
  unpaired?: readonly StoryEntry[]
}) {
  return planVerdicts({
    host: 'o3',
    ledger: input.ledger ?? EMPTY_LEDGER,
    baselines,
    scores: input.scores ?? [],
    unkeyed: input.unkeyed ?? [],
    missing: input.missing ?? [],
    unpaired: input.unpaired ?? [],
  })
}

describe('ledgerKey', () => {
  it('names the host as well as the story, because two hosts share a story id', () => {
    const shared = { storyId: 'ui-stat--default', designBrand: 'o3' as const, nodeId: '9:9' }
    expect(ledgerKey({ host: 'o3', viewport: VIEWPORT, ...shared })).not.toBe(
      ledgerKey({ host: 'o3xo', viewport: VIEWPORT, ...shared }),
    )
  })

  it('names the design file as well as the node, and the viewport as well as the pair', () => {
    expect(
      ledgerKey({ host: 'o3', storyId: HOME, designBrand: 'o3', nodeId: NODE, viewport: VIEWPORT }),
    ).toBe(KEY)
  })
})

describe('the four reds', () => {
  it('(a) reds a score that worsened past its tolerance, naming the pair', () => {
    const verdicts = plan({ ledger: ledger(), scores: [score({ ratio: 0.2574 + 0.02 })] })
    expect(verdicts.red).toHaveLength(1)
    expect(verdicts.red[0]).toMatchObject({ kind: 'worsened', key: KEY, storyId: HOME })
    expect(verdicts.red[0]!.detail).toContain('27.74%')
  })

  it('(a) passes a score inside its tolerance, worse or better', () => {
    const worse = plan({ ledger: ledger(), scores: [score({ ratio: 0.2574 + 0.004 })] })
    expect(worse.red).toHaveLength(0)
    expect(worse.passed).toHaveLength(1)

    const better = plan({ ledger: ledger(), scores: [score({ ratio: 0.1 })] })
    expect(better.red).toHaveLength(0)
    expect(better.passed[0]!.detail).toContain('improved')
  })

  it('(b) reds a node that changed since acceptance even when the score passes', () => {
    const verdicts = plan({
      ledger: ledger({ pairs: { [KEY]: entry({ nodeHash: 'oldoldold' }) } }),
      scores: [score({ ratio: 0.1 })],
    })
    expect(verdicts.red).toHaveLength(1)
    expect(verdicts.red[0]).toMatchObject({ kind: 'unaccepted-change', key: KEY })
    expect(verdicts.red[0]!.detail).toContain('re-accept')
  })

  it('(b) says nothing about a pair accepted when nothing tracked its node', () => {
    // No hash was recorded, so no hash can have changed. The score rules.
    const verdicts = plan({
      ledger: ledger({ pairs: { [KEY]: entry({ nodeHash: null }) } }),
      scores: [score()],
    })
    expect(verdicts.red).toHaveLength(0)
  })

  it('(c) reds a paired node the Figma file no longer has', () => {
    const verdicts = plan({
      ledger: ledger(),
      unkeyed: [
        { storyId: HOME, nodeId: NODE, brand: 'o3', why: 'the Figma file would not draw it' },
      ],
      missing: [{ brand: 'o3', nodeId: NODE, stories: [HOME] }],
    })
    expect(verdicts.red).toHaveLength(1)
    expect(verdicts.red[0]).toMatchObject({ kind: 'orphaned', storyId: HOME, nodeId: NODE })
  })

  it('(d) reds a changed node whose export this run could not obtain', () => {
    const verdicts = plan({
      ledger: ledger({ pairs: { [KEY]: entry({ nodeHash: 'oldoldold' }) } }),
      unkeyed: [
        { storyId: HOME, nodeId: NODE, brand: 'o3', why: 'no export cached for this node' },
      ],
    })
    expect(verdicts.red).toHaveLength(1)
    expect(verdicts.red[0]).toMatchObject({ kind: 'no-export', storyId: HOME })
  })

  it('(d) does not red an unexportable node nobody accepted, or one that did not change', () => {
    const unaccepted = plan({
      unkeyed: [
        { storyId: HOME, nodeId: NODE, brand: 'o3', why: 'no export cached for this node' },
      ],
    })
    expect(unaccepted.red).toHaveLength(0)

    const unchanged = plan({
      ledger: ledger(),
      unkeyed: [
        { storyId: HOME, nodeId: NODE, brand: 'o3', why: 'no export cached for this node' },
      ],
    })
    expect(unchanged.red).toHaveLength(0)
  })

  it('reds nothing else: every other state is a row on a list', () => {
    const verdicts = plan({
      scores: [score()],
      unkeyed: [
        { storyId: 'a--b', nodeId: '7:7', brand: 'o3', why: 'not tracked by figma:sync' },
        { storyId: 'c--d', nodeId: '8:8', brand: null, why: 'names no known design file' },
      ],
      unpaired: [story('e--f')],
    })
    expect(verdicts.red).toHaveLength(0)
    expect(verdicts.listed.map((row) => row.kind).sort()).toEqual([
      'new',
      'unpaired',
      'untracked',
      'untracked',
    ])
  })
})

describe('a pairing nobody has accepted', () => {
  it('is listed as new rather than red, so an unmeasured pair is never called drift', () => {
    const verdicts = plan({ scores: [score()] })
    expect(verdicts.red).toHaveLength(0)
    expect(verdicts.listed[0]).toMatchObject({ kind: 'new', key: KEY })
    expect(isFailing(verdicts, { strict: false })).toBe(false)
  })

  it('fails the run under --strict, which is what CI runs', () => {
    const verdicts = plan({ scores: [score()] })
    expect(isFailing(verdicts, { strict: true })).toBe(true)
  })
})

describe('unpairable', () => {
  it('lists a marked node and never scores or reds it', () => {
    const marked = ledger({
      pairs: {},
      unpairable: { 'o3/1680:2134': { reason: 'pasted capture, cursor pixels (#308 ruling 9)' } },
    })
    const verdicts = plan({ ledger: marked, scores: [score()] })
    expect(verdicts.red).toHaveLength(0)
    expect(verdicts.passed).toHaveLength(0)
    expect(verdicts.listed[0]).toMatchObject({ kind: 'unpairable' })
    expect(verdicts.listed[0]!.detail).toContain('cursor pixels')
  })

  it('outranks a node the file would not draw, so debris cannot orphan a run', () => {
    const marked = ledger({
      pairs: {},
      unpairable: { 'o3/1680:2134': { reason: 'ClaudeTest frame' } },
    })
    const verdicts = plan({
      ledger: marked,
      unkeyed: [
        { storyId: HOME, nodeId: NODE, brand: 'o3', why: 'the Figma file would not draw it' },
      ],
      missing: [{ brand: 'o3', nodeId: NODE, stories: [HOME] }],
    })
    expect(verdicts.red).toHaveLength(0)
  })
})

describe('isFailing', () => {
  it('is red when any red exists and green otherwise', () => {
    expect(isFailing(plan({ ledger: ledger(), scores: [score()] }), { strict: true })).toBe(false)
    expect(
      isFailing(plan({ ledger: ledger(), scores: [score({ ratio: 0.9 })] }), { strict: false }),
    ).toBe(true)
  })
})

describe('serializeLedger', () => {
  it('sorts every key and ends with a newline, so a diff reads and a merge lands', () => {
    const text = serializeLedger({
      pairs: { 'o3/z--z/o3/9:9/frame-402': entry(), 'o3/a--a/o3/1:1/frame-1440': entry() },
      unpairable: { 'o3xo/5:5': { reason: 'debris' }, 'o3/4:4': { reason: 'debris' } },
    })
    expect(text.endsWith('\n')).toBe(true)
    expect(text.indexOf('a--a')).toBeLessThan(text.indexOf('z--z'))
    expect(text.indexOf('"o3/4:4"')).toBeLessThan(text.indexOf('"o3xo/5:5"'))
  })

  it('is byte-stable under insertion order and round-trips through parseLedger', () => {
    const one = serializeLedger({
      pairs: { [KEY]: { ...entry(), reason: 'a retuned scrim' } },
      unpairable: {},
    })
    // The same entry built field-by-field in a different order.
    const other: LedgerEntry = {
      reason: 'a retuned scrim',
      acceptedAt: '2026-08-24',
      fileVersion: '2391349966960467923',
      nodeHash: 'aaaa1111',
      tolerance: DEFAULT_TOLERANCE,
      score: 0.2574,
    }
    expect(serializeLedger({ pairs: { [KEY]: other }, unpairable: {} })).toBe(one)
    expect(serializeLedger(parseLedger(one))).toBe(one)
  })

  it('reads a missing file as an empty ledger rather than an error', () => {
    expect(parseLedger('')).toEqual(EMPTY_LEDGER)
    expect(serializeLedger(EMPTY_LEDGER)).toBe('{\n  "pairs": {},\n  "unpairable": {}\n}\n')
  })
})

describe('acceptScores', () => {
  it('writes the score, the tolerance, the node hash and the file version', () => {
    const result = acceptScores({
      ledger: EMPTY_LEDGER,
      host: 'o3',
      scores: [score()],
      baselines,
      at: '2026-08-25',
    })
    expect(result.added).toEqual([KEY])
    expect(result.ledger.pairs[KEY]).toEqual({
      score: 0.2574,
      tolerance: DEFAULT_TOLERANCE,
      nodeHash: 'aaaa1111',
      fileVersion: '2391349966960467923',
      acceptedAt: '2026-08-25',
    })
  })

  it('rounds the score to five places, so the ledger reads as a number a person can hold', () => {
    const result = acceptScores({
      ledger: EMPTY_LEDGER,
      host: 'o3',
      scores: [score({ ratio: 0.257412345678 })],
      baselines,
      at: '2026-08-25',
    })
    expect(result.ledger.pairs[KEY]!.score).toBe(0.25741)
  })

  it('is a no-op diff when nothing changed — the same bytes, the same accepted date', () => {
    const before = ledger()
    const result = acceptScores({
      ledger: before,
      host: 'o3',
      scores: [score()],
      baselines,
      at: '2026-09-01',
    })
    expect(result.unchanged).toEqual([KEY])
    expect(result.added).toEqual([])
    expect(serializeLedger(result.ledger)).toBe(serializeLedger(before))
  })

  it('re-accepts a changed pair, keeping a tolerance and a reason someone edited in', () => {
    const before = ledger({
      pairs: { [KEY]: entry({ tolerance: 0.02, reason: 'a retuned scrim' }) },
    })
    const result = acceptScores({
      ledger: before,
      host: 'o3',
      scores: [score({ ratio: 0.3 })],
      baselines,
      at: '2026-09-01',
    })
    expect(result.updated).toEqual([KEY])
    expect(result.ledger.pairs[KEY]).toMatchObject({
      score: 0.3,
      tolerance: 0.02,
      reason: 'a retuned scrim',
      acceptedAt: '2026-09-01',
    })
  })

  it('never accepts an unpairable node or a score that errored', () => {
    const marked: Ledger = {
      pairs: {},
      unpairable: { 'o3/1680:2134': { reason: 'debris' } },
    }
    expect(
      acceptScores({ ledger: marked, host: 'o3', scores: [score()], baselines, at: '2026-09-01' })
        .added,
    ).toEqual([])
    expect(
      acceptScores({
        ledger: EMPTY_LEDGER,
        host: 'o3',
        scores: [score({ error: 'the story did not render' })],
        baselines,
        at: '2026-09-01',
      }).added,
    ).toEqual([])
  })
})

describe('formatVerdicts', () => {
  it('names every red with its reason, and says what is only listed', () => {
    const verdicts = plan({
      ledger: ledger(),
      scores: [score({ ratio: 0.9 }), score({ storyId: 'other--x' })],
      unpaired: [story('e--f')],
    })
    const text = formatVerdicts(verdicts, { strict: false })
    expect(text).toContain('Red (1)')
    expect(text).toContain(HOME)
    expect(text).toContain('worsened')
    expect(text).toContain('new')
    expect(text).toContain('e--f')
  })

  it('says the run is green when it is', () => {
    expect(
      formatVerdicts(plan({ ledger: ledger(), scores: [score()] }), { strict: false }),
    ).toContain('no reds')
  })
})
