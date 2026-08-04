import { describe, expect, it } from 'vitest'

import { ASSET_DIR, lockedAssets, resolvedAssets, validateAssetManifest } from './asset-manifest'
import { listSeedAssets, readAssetManifest } from './paths'

import type { AssetEntry, AssetManifest } from './types'

/**
 * Two halves (#80). The first runs the validator against literals — no
 * filesystem, no token, no network — and the second runs it against the
 * committed manifest and the real assets directory, which is the claim the
 * manifest actually makes: *every seed asset knows where it came from*.
 */

const entry = (over: Partial<AssetEntry> = {}): AssetEntry => ({
  path: `${ASSET_DIR}/live-healthcare.png`,
  nodeId: '1751:2010',
  figmaName: 'Case study cards',
  format: 'png',
  scale: 1,
  export: 'imageFill',
  locked: false,
  ...over,
})

const manifestOf = (...assets: AssetEntry[]): AssetManifest => ({
  fileKey: 'RvraLJaZ0zWm8UaD5AJf43',
  assets,
})

/** Just the messages, so a test reads as the complaint it expects. */
const check = (manifest: AssetManifest, filesOnDisk: readonly string[]): string[] =>
  validateAssetManifest(manifest, filesOnDisk).map((problem) => problem.message)

describe('validateAssetManifest', () => {
  it('passes a resolved entry whose file is on disk', () => {
    const asset = entry()
    expect(check(manifestOf(asset), [asset.path])).toEqual([])
  })

  it('passes an unresolved entry that says why', () => {
    const asset = entry({
      path: `${ASSET_DIR}/work-city.png`,
      nodeId: undefined,
      figmaName: undefined,
      scale: undefined,
      export: undefined,
      unresolved: true,
      note: 'Byte-identical to prototype/assets/work-city.png — never in Figma.',
    })
    expect(check(manifestOf(asset), [asset.path])).toEqual([])
  })

  it('reports every problem, not just the first', () => {
    const asset = entry({ nodeId: '1751-2010', figmaName: '', export: undefined })
    expect(check(manifestOf(asset), [asset.path])).toHaveLength(3)
  })

  describe('coverage — the two questions that are one walk', () => {
    it('names an entry whose file is gone', () => {
      const asset = entry()
      expect(check(manifestOf(asset), [])).toContain('no such file — moved or deleted?')
    })

    it('names a committed asset nobody recorded', () => {
      const asset = entry()
      const problems = validateAssetManifest(manifestOf(asset), [
        asset.path,
        `${ASSET_DIR}/new-photo.png`,
      ])
      expect(problems).toEqual([
        { path: `${ASSET_DIR}/new-photo.png`, message: 'committed asset with no manifest entry' },
      ])
    })

    it('catches the same file listed twice', () => {
      // The way a locked asset acquires an unlocked twin.
      const asset = entry()
      expect(check(manifestOf(asset, entry({ locked: false })), [asset.path])).toContain(
        'listed twice',
      )
    })
  })

  describe('a claim about Figma is whole or it is not made', () => {
    it('rejects a share-URL node id', () => {
      expect(check(manifestOf(entry({ nodeId: '1751-2010' })), [entry().path])).toContain(
        'nodeId "1751-2010" is not a `:`-separated node id',
      )
    })

    it('rejects an entry with neither a node nor an unresolved marker', () => {
      const asset = entry({ nodeId: undefined })
      expect(check(manifestOf(asset), [asset.path])).toContain(
        'no nodeId and not marked unresolved',
      )
    })

    it('rejects an unresolved entry that still names a node', () => {
      const asset = entry({ unresolved: true, note: 'a hedge' })
      expect(check(manifestOf(asset), [asset.path])).toContain(
        'unresolved but still names a nodeId',
      )
    })

    it('demands the Figma layer name', () => {
      const asset = entry({ figmaName: undefined })
      expect(check(manifestOf(asset), [asset.path])).toContain(
        'resolved without the Figma layer name',
      )
    })
  })

  describe('format and scale have to describe a re-export #81 could run', () => {
    it('rejects a format the file extension contradicts', () => {
      const asset = entry({ path: `${ASSET_DIR}/eng-squad.svg` })
      expect(check(manifestOf(asset), [asset.path])).toContain(
        'format "png" does not match the file extension',
      )
    })

    it('demands a positive scale on a resolved png', () => {
      const asset = entry({ export: 'render', scale: 0 })
      expect(check(manifestOf(asset), [asset.path])).toContain(
        'a resolved png needs a positive scale',
      )
    })

    it('keeps an imageFill at scale 1 — it is the uploaded original', () => {
      const asset = entry({ export: 'imageFill', scale: 3 })
      expect(check(manifestOf(asset), [asset.path])).toContain(
        'an imageFill is the uploaded original, so its scale is 1',
      )
    })

    it('accepts a render at any positive scale', () => {
      const asset = entry({ nodeId: '1927:6432', export: 'render', scale: 1.5 })
      expect(check(manifestOf(asset), [asset.path])).toEqual([])
    })
  })

  describe('a standing decision carries its reason', () => {
    it('rejects a locked entry with no note', () => {
      const asset = entry({ locked: true })
      expect(check(manifestOf(asset), [asset.path])).toContain('locked without a note saying why')
    })

    it('rejects an unresolved entry with no note', () => {
      const asset = entry({
        nodeId: undefined,
        figmaName: undefined,
        scale: undefined,
        export: undefined,
        unresolved: true,
      })
      expect(check(manifestOf(asset), [asset.path])).toContain(
        'unresolved without a note saying why',
      )
    })
  })

  it('rejects a path outside the seed assets directory', () => {
    const asset = entry({ path: 'apps/web/public/logo.png' })
    expect(check(manifestOf(asset), [asset.path])).toContain(`path is not under ${ASSET_DIR}/`)
  })
})

/**
 * The committed manifest, against the real directory. This is the acceptance
 * criterion from #80 as a test: no seed asset is unaccounted for, and nothing
 * was recorded for a file that has since moved.
 */
describe('asset-manifest.json', () => {
  const manifest = readAssetManifest()
  const onDisk = listSeedAssets()

  it('points at the design source of record', () => {
    expect(manifest.fileKey).toBe('RvraLJaZ0zWm8UaD5AJf43')
  })

  it('accounts for every committed seed asset, and only those', () => {
    expect(validateAssetManifest(manifest, onDisk)).toEqual([])
  })

  it('locks the hand-authored animated SVGs', () => {
    // They were drawn by hand — CSS keyframes, a prefers-reduced-motion
    // freeze, brand red inlined because an SVG in an `<img>` cannot see the
    // page stylesheet. No Figma export carries any of that, so a re-export
    // would destroy them.
    const locked = new Set(lockedAssets(manifest).map((asset) => asset.path))
    for (const name of [
      'eng-embedded.svg',
      'eng-ownership.svg',
      'eng-squad.svg',
      'perspective-process-frontier.svg',
      'perspective-process-hero.svg',
      'perspective-process-pipeline.svg',
      'perspective-process-sources.svg',
    ]) {
      expect(locked.has(`${ASSET_DIR}/${name}`), name).toBe(true)
    }
  })

  it('never resolves an SVG to a node — none of them came out of Figma', () => {
    for (const asset of resolvedAssets(manifest)) expect(asset.format, asset.path).toBe('png')
  })
})
