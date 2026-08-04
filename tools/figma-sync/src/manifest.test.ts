import { describe, expect, it } from 'vitest'

import { readManifest } from './paths'

import type { TrackedNode } from './types'

/**
 * Invariants over the committed manifest (#78). Nothing generates
 * `tracked-nodes.json` — it is promoted by hand from the frame inventory — so
 * these are the gate on the mistakes hand-editing it actually makes: a
 * share-URL node id in `1680-2134` form, a page frame with no route, the same
 * frame listed twice.
 */

const manifest = readManifest()
const entries = manifest.entries as TrackedNode[]

describe('tracked-nodes.json', () => {
  it('points at the design source of record', () => {
    expect(manifest.fileKey).toBe('RvraLJaZ0zWm8UaD5AJf43')
    // The Design Concept section — canonical frames live inside it (#34).
    expect(manifest.sectionNodeId).toBe('1632:1510')
  })

  it('tracks at least the seven canonical page layers', () => {
    const names = new Set(entries.map((entry) => entry.name))
    expect([...names].sort()).toEqual([
      'About',
      'Case Study detail',
      'Home',
      'Live',
      'Perspective detail',
      'Solutions',
      'Work index',
    ])
  })

  it.each(entries)('$name ($variant) is a `:`-separated node id', (entry) => {
    // Share URLs use `-`; the API takes `:`. Committing the URL form is the
    // easy mistake and produces a "node not found" run.
    expect(entry.nodeId).toMatch(/^\d+:\d+$/)
  })

  it('lists no node id twice', () => {
    const ids = entries.map((entry) => entry.nodeId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every page frame a route', () => {
    for (const entry of entries.filter((e) => e.kind === 'pageFrame')) {
      expect(entry.route, entry.name).toMatch(/^\//)
    }
  })

  it('names one frame per route per breakpoint', () => {
    const keys = entries
      .filter((entry) => entry.kind === 'pageFrame')
      .map((entry) => `${entry.route}@${entry.variant}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('uses this project’s language for names, not Figma’s', () => {
    // Two different frames are *named* "Insights" in Figma and neither is the
    // Perspectives index (docs/agents/figma.md). `name` is the page layer;
    // `figmaName` records what the file calls it — verified against the file.
    const insights = entries.filter((entry) => entry.figmaName?.startsWith('Insights'))
    expect(insights.map((entry) => entry.name).sort()).toEqual([
      'About',
      'Perspective detail',
      'Perspective detail',
    ])
  })

  it('records the Figma layer name for every entry', () => {
    for (const entry of entries) expect(entry.figmaName, entry.nodeId).toBeTruthy()
  })
})
