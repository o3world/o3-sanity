import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readManifest, REPO_ROOT } from './paths'

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
const pageFrames = entries.filter((entry) => entry.kind === 'pageFrame')
const componentSets = entries.filter((entry) => entry.kind === 'componentSet')

describe('tracked-nodes.json', () => {
  it('points at the design source of record', () => {
    expect(manifest.fileKey).toBe('RvraLJaZ0zWm8UaD5AJf43')
    // The Design Concept section — canonical frames live inside it (#34).
    expect(manifest.sectionNodeId).toBe('1632:1510')
  })

  it('tracks at least the nine canonical page layers', () => {
    const names = new Set(pageFrames.map((entry) => entry.name))
    expect([...names].sort()).toEqual([
      'About',
      'Case Study detail',
      'Home',
      'Insight detail',
      'Insight index',
      'Live',
      'Sanity partnership',
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

  it('gives every page frame a route and a breakpoint', () => {
    for (const entry of pageFrames) {
      expect(entry.route, entry.name).toMatch(/^\//)
      expect(entry.variant, entry.name).toMatch(/^(desktop|mobile)$/)
    }
  })

  it('names one frame per route per breakpoint', () => {
    const keys = pageFrames.map((entry) => `${entry.route}@${entry.variant}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('uses this project’s language for names, not Figma’s', () => {
    // Four frames are *named* "Insights" in Figma and only one is the
    // Insight index (`2336:4310`, tracked 2026-08-13) — one of them is About,
    // which is simply mislabelled in the file. That is the failure this
    // guards, and it is unchanged by ADR 0017.
    //
    // Most now agree with `name` because the project adopted the word Figma
    // was already using. That coincidence is a decision, not a reason to
    // collapse the two fields: `figmaName` still records what the file says,
    // and the About row is the standing proof it can be wrong.
    const insights = entries.filter((entry) => entry.figmaName?.startsWith('Insights'))
    expect(insights.map((entry) => entry.name).sort()).toEqual([
      'About',
      'Insight detail',
      'Insight detail',
      'Insight index',
    ])
  })

  it('records the Figma layer name for every entry', () => {
    for (const entry of entries) expect(entry.figmaName, entry.nodeId).toBeTruthy()
  })
})

/**
 * Component sets (#79). The manifest is the machine-readable half of
 * `docs/figma-components.md`, so the invariants here are that document's rules:
 * every set says what code it maps to, and a set that maps to **nothing** says
 * so out loud rather than by omission — an absent `codeComponent` would be
 * indistinguishable from a forgotten one.
 */
describe('tracked component sets', () => {
  it('carries the whole component→code map, canonical and not', () => {
    // docs/figma-components.md: 11 canonical rows and 13 non-canonical ones —
    // 26 nodes, because `Case study cards` is three competing sets.
    // (`Cover status` 134:343 was deleted from the file, and `Utility Nav`
    // 2250:1445 arrived with the 2026-08 nav rebuild — both seen 2026-08-13.
    // The eleventh canonical row is the redesign's `Icon` set 2177:1556, whose
    // curated three fill the button's icon slot — tracked with #151.)
    expect(componentSets.length).toBe(26)
  })

  it('states a code target for every set, `null` included', () => {
    for (const entry of componentSets) {
      expect(Object.hasOwn(entry, 'codeComponent'), entry.name).toBe(true)
      expect(typeof entry.codeComponent === 'string' || entry.codeComponent === null).toBe(true)
    }
  })

  it('explains every set that deliberately maps to nothing', () => {
    for (const entry of componentSets.filter((set) => set.codeComponent === null)) {
      expect(entry.note, entry.name).toBeTruthy()
    }
  })

  it('points at a file that exists, when it points at one', () => {
    for (const entry of componentSets) {
      if (!entry.codeComponent) continue
      const path = entry.codeComponent.split('#')[0] ?? ''
      expect(existsSync(join(REPO_ROOT, path)), entry.codeComponent).toBe(true)
    }
  })

  it('gives a component set no route and no breakpoint — it is neither', () => {
    for (const entry of componentSets) {
      expect(entry.route, entry.name).toBeUndefined()
      expect(entry.variant, entry.name).toBeUndefined()
    }
  })
})

/**
 * The probe's mute button (#79). Every id on it is a standing decision — "we
 * looked, it is not canonical" — so it has to carry the reason, and it may
 * never mute something the manifest tracks.
 */
describe('ignoredNodeIds', () => {
  const ignored = manifest.ignoredNodeIds ?? []

  it('gives a reason for every muted node', () => {
    expect(ignored.length).toBeGreaterThan(0)
    for (const entry of ignored) {
      expect(entry.nodeId).toMatch(/^\d+:\d+$/)
      expect(entry.note, entry.nodeId).toBeTruthy()
    }
  })

  it('never mutes a node the manifest tracks', () => {
    const tracked = new Set(entries.map((entry) => entry.nodeId))
    for (const entry of ignored) expect(tracked.has(entry.nodeId), entry.nodeId).toBe(false)
  })
})
