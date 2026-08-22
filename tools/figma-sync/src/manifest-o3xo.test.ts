import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readManifest, REPO_ROOT } from './paths'

import type { TrackedNode } from './types'

/**
 * Invariants over the committed O3XO manifest (#242) — the machine-readable
 * half of `docs/figma-components-o3xo.md`, the same way `tracked-nodes.json`
 * is `docs/figma-components.md`'s.
 *
 * The rules are `manifest.test.ts`'s, minus the ones that only make sense for
 * a file that designs pages. The O3XO file is a **UI kit**: it has canvases
 * rather than one section, library nodes rather than page frames, and no
 * routes at all.
 */

const manifest = readManifest('o3xo')
const entries = manifest.entries as TrackedNode[]

describe('tracked-nodes-o3xo.json', () => {
  it('points at the O3XO UI kit', () => {
    expect(manifest.fileKey).toBe('G6M2gu5qKFvhGxwj3W365b')
  })

  it('watches the eleven Website Components canvases and the four Styles ones', () => {
    // Plus Layouts (the page bands) — sixteen, which is the set #224's
    // inventory called trustworthy. The kit's other canvases are the cover,
    // the archive, the asset dump and the old templates.
    expect(manifest.sectionNodeIds).toHaveLength(16)
    expect(new Set(manifest.sectionNodeIds).size).toBe(16)
  })

  it('probes for library nodes, not just frames', () => {
    // A site file's news is a new page frame. A kit's news is a new component
    // — and its frames are spec sheets and band layouts.
    expect(manifest.probeNodeTypes).toEqual(['FRAME', 'COMPONENT', 'COMPONENT_SET', 'SECTION'])
  })

  it.each(entries)('$name is a `:`-separated node id', (entry) => {
    expect(entry.nodeId).toMatch(/^\d+:\d+$/)
  })

  it('lists no node id twice', () => {
    const ids = entries.map((entry) => entry.nodeId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('tracks no page frame — a kit has no pages', () => {
    // Everything here is a library node, band layouts included. That is what
    // `kind: "componentSet"` means (see the figma-sync README), and it is why
    // an O3XO report's `changedFrames` is always empty.
    for (const entry of entries) expect(entry.kind, entry.name).toBe('componentSet')
    for (const entry of entries) {
      expect(entry.route, entry.name).toBeUndefined()
      expect(entry.variant, entry.name).toBeUndefined()
    }
  })

  it('records the Figma layer name for every entry', () => {
    for (const entry of entries) expect(entry.figmaName, entry.nodeId).toBeTruthy()
  })

  it('states a code target for every node, `null` included', () => {
    for (const entry of entries) {
      expect(Object.hasOwn(entry, 'codeComponent'), entry.name).toBe(true)
      expect(typeof entry.codeComponent === 'string' || entry.codeComponent === null).toBe(true)
    }
  })

  it('explains every node that deliberately maps to nothing', () => {
    for (const entry of entries.filter((node) => node.codeComponent === null)) {
      expect(entry.note, entry.name).toBeTruthy()
    }
  })

  it('points at a file that exists, when it points at one', () => {
    for (const entry of entries) {
      if (!entry.codeComponent) continue
      const path = entry.codeComponent.split('#')[0] ?? ''
      expect(existsSync(join(REPO_ROOT, path)), entry.codeComponent).toBe(true)
    }
  })
})

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
