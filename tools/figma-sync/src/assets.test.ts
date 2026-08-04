import { describe, expect, it } from 'vitest'

import { ASSET_DIR } from './asset-manifest'
import { applyAssetDecisions, assetSourceNodeIds, decideAssetAction, planAssetSync } from './assets'
import { createFigmaClient } from './figma-api'

import type { AssetEntry, AssetManifest } from './types'

/**
 * The re-export stage (#81). Two halves, and the seam between them is the
 * point: **the decision is a pure function** of (manifest entry × node-hash
 * state), and the executor is the only thing that touches the network or the
 * disk. So the matrix below is literals, and every export case runs against an
 * injected `fetch` that also proves *how many* calls were made — "unchanged →
 * no export call at all" is an acceptance criterion, not an optimisation.
 */

const FILE_KEY = 'RvraLJaZ0zWm8UaD5AJf43'

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

const rendered = (over: Partial<AssetEntry> = {}): AssetEntry =>
  entry({
    path: `${ASSET_DIR}/about-beyond-community.png`,
    nodeId: '1928:6505',
    export: 'render',
    scale: 3,
    ...over,
  })

const handAuthored = entry({
  path: `${ASSET_DIR}/eng-squad.svg`,
  nodeId: undefined,
  figmaName: undefined,
  format: 'svg',
  scale: undefined,
  export: undefined,
  locked: true,
  unresolved: true,
  note: 'Hand-authored, never in Figma.',
})

const manifestOf = (...assets: AssetEntry[]): AssetManifest => ({ fileKey: FILE_KEY, assets })

describe('decideAssetAction', () => {
  it('skips an unresolved entry — there is no node to watch', () => {
    // It cannot participate: nothing to hash, nothing to export from. Not a
    // failure, and not a conflict either.
    expect(decideAssetAction(handAuthored, undefined, undefined).action).toBe('skip')
  })

  it('does nothing when the source node hashes the same', () => {
    expect(decideAssetAction(entry(), 'abc', 'abc').action).toBe('nothing')
  })

  it('exports an unlocked asset whose source node changed', () => {
    expect(decideAssetAction(entry(), 'abc', 'def')).toMatchObject({
      action: 'export',
      reason: 'node-changed',
    })
  })

  it('exports an unlocked asset whose node the baseline has never hashed', () => {
    expect(decideAssetAction(entry(), undefined, 'def')).toMatchObject({
      action: 'export',
      reason: 'new-to-baseline',
    })
  })

  it('reports a conflict rather than overwriting a locked asset', () => {
    const locked = entry({ locked: true, note: 'Hand-cropped after export.' })
    expect(decideAssetAction(locked, 'abc', 'def')).toMatchObject({
      action: 'conflict',
      reason: 'node-changed',
    })
  })

  it('reports a locked asset new to the baseline as a conflict too', () => {
    // The lock is the standing decision; a first hash of its node does not
    // get to overwrite the file on the way past.
    const locked = entry({ locked: true, note: 'The source moved.' })
    expect(decideAssetAction(locked, undefined, 'def')).toMatchObject({
      action: 'conflict',
      reason: 'new-to-baseline',
    })
  })

  it('fails — loudly — when the file no longer has the node', () => {
    const decision = decideAssetAction(entry(), 'abc', undefined)
    expect(decision.action).toBe('fail')
    expect(decision.error).toContain('1751:2010')
  })

  it('fails a locked entry whose node is gone as well: the manifest is wrong either way', () => {
    const locked = entry({ locked: true, note: 'Hand-cropped after export.' })
    expect(decideAssetAction(locked, 'abc', undefined).action).toBe('fail')
  })
})

describe('assetSourceNodeIds', () => {
  it('lists the nodes to hash — resolved entries only, deduped', () => {
    const manifest = manifestOf(
      entry(),
      handAuthored,
      rendered(),
      entry({ path: `${ASSET_DIR}/x.png` }),
    )
    expect(assetSourceNodeIds(manifest)).toEqual(['1751:2010', '1928:6505'])
  })
})

describe('planAssetSync', () => {
  it('decides every entry, in manifest order', () => {
    const manifest = manifestOf(entry(), handAuthored, rendered())
    const plan = planAssetSync(
      manifest,
      { '1751:2010': 'abc' },
      { '1751:2010': 'abc', '1928:6505': 'z' },
    )
    expect(plan.map((decision) => decision.action)).toEqual(['nothing', 'skip', 'export'])
  })
})

/** The API shapes the executor speaks, and a fetch that counts what it was asked. */
const json = (value: unknown) =>
  new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

const RENDER_URL = 'https://figma-alpha-api.s3.example/render.png'
const FILL_URL = 'https://figma-alpha-api.s3.example/fill.png'
const RENDERED_BYTES = new Uint8Array([137, 80, 78, 71, 1])
const FILL_BYTES = new Uint8Array([137, 80, 78, 71, 2])

/** A node document as `/v1/files/:key/nodes` returns it, fill and all. */
const documentWithFill = (imageRef: string) => ({
  id: '1751:2010',
  name: 'Case study cards',
  type: 'RECTANGLE',
  fills: [{ type: 'IMAGE', scaleMode: 'FILL', imageRef }],
})

interface Recorder {
  readonly calls: string[]
  readonly fetchImpl: (url: string) => Promise<Response>
}

function recordingFetch(handler: (url: string) => Response): Recorder {
  const calls: string[] = []
  return {
    calls,
    fetchImpl: async (url: string) => {
      calls.push(url)
      return handler(url)
    },
  }
}

const happyPath = (url: string): Response => {
  if (url.startsWith('https://api.figma.com/v1/images/')) {
    return json({ err: null, images: { '1928:6505': RENDER_URL } })
  }
  if (url.endsWith(`/files/${FILE_KEY}/images`)) {
    return json({ error: false, status: 200, meta: { images: { 'sha-1-of-the-bytes': FILL_URL } } })
  }
  if (url === RENDER_URL) return new Response(RENDERED_BYTES)
  if (url === FILL_URL) return new Response(FILL_BYTES)
  return new Response(`unexpected ${url}`, { status: 404 })
}

interface Written {
  readonly path: string
  readonly bytes: Uint8Array
}

async function run(
  manifest: AssetManifest,
  previous: Record<string, string>,
  current: Record<string, string>,
  handler: (url: string) => Response = happyPath,
  documents: Iterable<[string, unknown]> = [
    ['1751:2010', documentWithFill('sha-1-of-the-bytes')],
    ['1928:6505', { id: '1928:6505', name: 'image 21', type: 'FRAME' }],
  ],
) {
  const written: Written[] = []
  const { calls, fetchImpl } = recordingFetch(handler)
  const result = await applyAssetDecisions(planAssetSync(manifest, previous, current), current, {
    fileKey: FILE_KEY,
    client: createFigmaClient('token', fetchImpl),
    documents: new Map(documents),
    writeAsset: (path, bytes) => written.push({ path, bytes }),
  })
  return { result, written, calls }
}

describe('applyAssetDecisions', () => {
  it('makes no call and writes nothing when no source node moved', async () => {
    const manifest = manifestOf(entry(), rendered(), handAuthored)
    const hashes = { '1751:2010': 'abc', '1928:6505': 'def' }
    const { result, written, calls } = await run(manifest, hashes, hashes)

    expect(calls).toEqual([])
    expect(written).toEqual([])
    expect(result.regenerated).toEqual([])
    // The unchanged hashes are carried forward, or the next run re-exports.
    expect(result.hashes).toEqual(hashes)
  })

  it('re-renders a changed unlocked asset at its recorded format and scale', async () => {
    const { result, written, calls } = await run(
      manifestOf(rendered()),
      { '1928:6505': 'before' },
      { '1928:6505': 'after' },
    )

    expect(calls[0]).toContain(`/images/${FILE_KEY}?ids=1928%3A6505`)
    expect(calls[0]).toContain('format=png')
    expect(calls[0]).toContain('scale=3')
    expect(calls[1]).toBe(RENDER_URL)
    expect(written).toEqual([
      { path: `${ASSET_DIR}/about-beyond-community.png`, bytes: RENDERED_BYTES },
    ])
    expect(result.regenerated).toEqual([
      {
        path: `${ASSET_DIR}/about-beyond-community.png`,
        nodeId: '1928:6505',
        export: 'render',
        reason: 'node-changed',
      },
    ])
    expect(result.hashes).toEqual({ '1928:6505': 'after' })
  })

  it('downloads the fill original for an imageFill asset, resolved through the node’s own fills', async () => {
    const { result, written, calls } = await run(manifestOf(entry()), {}, { '1751:2010': 'after' })

    expect(calls).toEqual([`https://api.figma.com/v1/files/${FILE_KEY}/images`, FILL_URL])
    expect(written).toEqual([{ path: `${ASSET_DIR}/live-healthcare.png`, bytes: FILL_BYTES }])
    expect(result.regenerated[0]).toMatchObject({ export: 'imageFill', reason: 'new-to-baseline' })
  })

  it('finds an image fill on a descendant when the named node is a wrapper', async () => {
    const wrapper = {
      id: '1751:2010',
      type: 'FRAME',
      children: [
        {
          id: '1751:2011',
          type: 'RECTANGLE',
          fills: [{ type: 'IMAGE', imageRef: 'sha-1-of-the-bytes' }],
        },
      ],
    }
    const { written } = await run(manifestOf(entry()), {}, { '1751:2010': 'after' }, happyPath, [
      ['1751:2010', wrapper],
    ])
    expect(written).toEqual([{ path: `${ASSET_DIR}/live-healthcare.png`, bytes: FILL_BYTES }])
  })

  it('never touches a locked file, and says what to reconcile against', async () => {
    const locked = entry({
      locked: true,
      note: 'Hand-cropped 527×544 out of the 791×544 original.',
    })
    const { result, written, calls } = await run(
      manifestOf(locked),
      { '1751:2010': 'a' },
      { '1751:2010': 'b' },
    )

    expect(written).toEqual([])
    expect(calls).toEqual([])
    expect(result.lockedConflicts).toEqual([
      {
        path: `${ASSET_DIR}/live-healthcare.png`,
        nodeId: '1751:2010',
        reason: 'node-changed',
        note: 'Hand-cropped 527×544 out of the 791×544 original.',
      },
    ])
    expect(result.regenerated).toEqual([])
    // The conflict is reported by the run that saw it and the baseline moves
    // on: the alternative is a report that repeats itself for ever and a
    // short-circuit that never fires again.
    expect(result.hashes).toEqual({ '1751:2010': 'b' })
  })

  it('fails an id Figma will not export — a null URL is not a file', async () => {
    const nulled = (url: string) =>
      url.startsWith('https://api.figma.com/v1/images/')
        ? json({ err: null, images: { '1928:6505': null } })
        : happyPath(url)
    const { result, written } = await run(
      manifestOf(rendered()),
      { '1928:6505': 'before' },
      { '1928:6505': 'after' },
      nulled,
    )

    expect(written).toEqual([])
    expect(result.failures).toHaveLength(1)
    expect(result.failures[0]?.path).toBe(`${ASSET_DIR}/about-beyond-community.png`)
    // No hash: the next run has to try again rather than call it done.
    expect(result.hashes).toEqual({})
  })

  it('fails on an API error without writing a partial file', async () => {
    const broken = (url: string) =>
      url.startsWith('https://api.figma.com/v1/images/')
        ? new Response('rate limited', { status: 429 })
        : happyPath(url)
    const { result, written } = await run(
      manifestOf(rendered()),
      { '1928:6505': 'before' },
      { '1928:6505': 'after' },
      broken,
    )

    expect(written).toEqual([])
    expect(result.failures[0]?.error).toContain('429')
    expect(result.hashes).toEqual({})
  })

  it('fails when the download itself dies', async () => {
    const broken = (url: string) =>
      url === RENDER_URL ? new Response('gone', { status: 403 }) : happyPath(url)
    const { result, written } = await run(
      manifestOf(rendered()),
      { '1928:6505': 'before' },
      { '1928:6505': 'after' },
      broken,
    )

    expect(written).toEqual([])
    expect(result.failures[0]?.error).toContain('403')
  })

  it('fails an imageFill whose node carries no image fill any more', async () => {
    const { result, written } = await run(
      manifestOf(entry()),
      {},
      { '1751:2010': 'after' },
      happyPath,
      [['1751:2010', { id: '1751:2010', type: 'RECTANGLE', fills: [{ type: 'SOLID' }] }]],
    )

    expect(written).toEqual([])
    expect(result.failures[0]?.error).toMatch(/image fill/i)
  })

  it('fails an imageFill whose imageRef is not in the file’s image library', async () => {
    const { result, written } = await run(
      manifestOf(entry()),
      {},
      { '1751:2010': 'after' },
      happyPath,
      [['1751:2010', documentWithFill('a-ref-nobody-has')]],
    )

    expect(written).toEqual([])
    expect(result.failures[0]?.error).toContain('a-ref-nobody-has')
  })

  it('reports the node the file no longer has as a failure, not a skip', async () => {
    const { result, written, calls } = await run(
      manifestOf(rendered()),
      { '1928:6505': 'before' },
      {},
    )

    expect(calls).toEqual([])
    expect(written).toEqual([])
    expect(result.failures[0]?.error).toContain('1928:6505')
  })

  it('batches one images call per format and scale', async () => {
    const manifest = manifestOf(
      rendered(),
      rendered({ path: `${ASSET_DIR}/about-culture-team.png`, nodeId: '1927:6432', scale: 1.5 }),
      rendered({ path: `${ASSET_DIR}/about-beyond-1682.png`, nodeId: '1928:6501' }),
    )
    const current = { '1928:6505': 'a', '1927:6432': 'b', '1928:6501': 'c' }
    const withAll = (url: string) =>
      url.startsWith('https://api.figma.com/v1/images/')
        ? json({
            err: null,
            images: { '1928:6505': RENDER_URL, '1927:6432': RENDER_URL, '1928:6501': RENDER_URL },
          })
        : happyPath(url)
    const { calls } = await run(manifest, {}, current, withAll, [
      ['1928:6505', {}],
      ['1927:6432', {}],
      ['1928:6501', {}],
    ])

    const imageCalls = calls.filter((url) => url.startsWith('https://api.figma.com/v1/images/'))
    // scale=3 twice and scale=1.5 once: two calls, not three.
    expect(imageCalls).toHaveLength(2)
  })
})
