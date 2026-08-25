/**
 * The cache, exercised end to end against a stub client and a temp directory —
 * the acceptance criteria of #337 stated as assertions: a second run calls
 * nothing, a moved hash invalidates one node, and a node the file will not draw
 * is named.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { planExports, type BrandBaseline } from './export-cache'
import { ensureExports, readCachedExports } from './figma-exports'
import type { PairingRow } from './pairing'

import type { FigmaClient } from '@o3/figma-sync/figma-api'

const dirs: string[] = []
function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-figma-'))
  dirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

/** Counts what it was asked for, and draws every node but the ones named. */
function stubClient(undrawable: readonly string[] = []) {
  const calls: string[][] = []
  const client = {
    async getRenderUrls(_fileKey: string, nodeIds: readonly string[]) {
      calls.push([...nodeIds])
      return new Map(
        nodeIds.map((nodeId) => [
          nodeId,
          undrawable.includes(nodeId) ? null : `https://figma.test/${nodeId}.png`,
        ]),
      )
    },
    async downloadBinary(url: string) {
      return new TextEncoder().encode(url)
    },
  } as unknown as FigmaClient
  return { client, calls }
}

function pairing(nodeId: string, storyId: string): PairingRow {
  return {
    storyId,
    title: 'Content/Blocks/Thing',
    exportName: 'Desktop',
    nodeId,
    fileKeyRef: 'FIGMA_FILE_KEY',
    file: 'packages/content-ui/src/Thing.stories.tsx',
    declaredOn: 'story',
    hosts: ['o3'],
    designBrand: 'o3',
    match: 'componentSet',
    trackedName: 'Thing',
    route: null,
  }
}

const pairings = [pairing('1:1', 'thing--one'), pairing('2:2', 'thing--two')]
const baseline: BrandBaseline = {
  brand: 'o3',
  fileKey: 'FILEKEY',
  hashes: { '1:1': 'a'.repeat(64), '2:2': 'b'.repeat(64) },
}

const plan = (base: BrandBaseline, dir: string) =>
  planExports(pairings, [base], readCachedExports(dir, ['o3']))

describe('ensureExports', () => {
  it('fetches every node once, then nothing at all', async () => {
    const dir = tempDir()
    const first = stubClient()
    expect(await ensureExports({ dir, plan: plan(baseline, dir), client: first.client })).toEqual({
      fetched: 2,
      missing: [],
    })
    expect(first.calls.flat()).toEqual(['1:1', '2:2'])

    const second = stubClient()
    const warm = plan(baseline, dir)
    expect(warm.fetch).toEqual([])
    expect(warm.fresh).toHaveLength(2)
    expect(await ensureExports({ dir, plan: warm, client: second.client })).toEqual({
      fetched: 0,
      missing: [],
    })
    expect(second.calls).toEqual([])
  })

  it('re-fetches exactly the node whose baseline hash moved', async () => {
    const dir = tempDir()
    await ensureExports({ dir, plan: plan(baseline, dir), client: stubClient().client })

    const moved: BrandBaseline = {
      ...baseline,
      hashes: { ...baseline.hashes, '2:2': 'c'.repeat(64) },
    }
    const next = stubClient()
    const second = plan(moved, dir)
    expect(await ensureExports({ dir, plan: second, client: next.client })).toMatchObject({
      fetched: 1,
    })
    expect(next.calls.flat()).toEqual(['2:2'])

    // The superseded file is swept and the untouched node keeps its own.
    const cached = readCachedExports(dir, ['o3']).map((entry) => `${entry.nodeId}@${entry.hash}`)
    expect(cached.sort()).toEqual(['1:1@aaaaaaaaaaaa', '2:2@cccccccccccc'])
  })

  it('names a node the file will not draw instead of skipping it', async () => {
    const dir = tempDir()
    const stub = stubClient(['2:2'])
    const outcome = await ensureExports({ dir, plan: plan(baseline, dir), client: stub.client })
    expect(outcome.fetched).toBe(1)
    expect(outcome.missing).toEqual([{ brand: 'o3', nodeId: '2:2', stories: ['thing--two'] }])
    // …and nothing was written under its key, so the next run asks again.
    expect(readCachedExports(dir, ['o3']).map((entry) => entry.nodeId)).toEqual(['1:1'])
  })

  it('keeps what a failed run got, and asks only for the rest next time', async () => {
    const dir = tempDir()
    const dying = {
      async getRenderUrls(_fileKey: string, nodeIds: readonly string[]) {
        return new Map(nodeIds.map((nodeId) => [nodeId, `https://figma.test/${nodeId}.png`]))
      },
      async downloadBinary(url: string) {
        if (url.includes('2:2')) throw new Error('Figma API 429 Too Many Requests')
        return new TextEncoder().encode(url)
      },
    } as unknown as FigmaClient

    await expect(ensureExports({ dir, plan: plan(baseline, dir), client: dying })).rejects.toThrow(
      '429',
    )

    const resumed = stubClient()
    const rest = plan(baseline, dir)
    expect(rest.fetch.map((request) => request.nodeId)).toEqual(['2:2'])
    await ensureExports({ dir, plan: rest, client: resumed.client })
    expect(resumed.calls.flat()).toEqual(['2:2'])
  })
})
