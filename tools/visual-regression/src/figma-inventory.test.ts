/**
 * The reader over the repo's own files — no Storybook build, no browser, no
 * network, so it runs in the `unit` project beside the engine's fixtures.
 *
 * These assert the join holds on real data, not any particular count: the
 * numbers move every time a story is written, and a test that pins them is a
 * test that fails for the wrong reason.
 */
import { describe, expect, it } from 'vitest'

import {
  readDeclaredPairings,
  readDesignFiles,
  readInventory,
  storyFilesByHost,
} from './figma-inventory'

describe('storyFilesByHost', () => {
  const hosts = storyFilesByHost(['o3', 'o3xo'])

  it('gives a shared story both hosts', () => {
    expect(hosts.get('packages/content-ui/src/chrome/SiteNav.stories.tsx')).toEqual(['o3', 'o3xo'])
  })

  it('gives an app story only its own host', () => {
    expect(hosts.get('apps/o3xo/src/components/brand/O3xoMark.stories.tsx')).toEqual(['o3xo'])
    expect(hosts.get('apps/web/src/stories/pages/Home.stories.tsx')).toEqual(['o3'])
  })
})

describe('readDeclaredPairings', () => {
  const pairings = readDeclaredPairings(['o3', 'o3xo'])

  it('reads the meta pairing NextCaseBand declares once for both its stories', () => {
    const band = pairings.filter((p) => p.title === 'Content/Documents/CaseStudy/NextCaseBand')
    expect(band.map((p) => [p.storyId, p.nodeId, p.declaredOn])).toEqual([
      ['content-documents-casestudy-nextcaseband--desktop', '1710:2609', 'meta'],
      ['content-documents-casestudy-nextcaseband--mobile', '1906:1039', 'story'],
    ])
  })

  it('reads the O3XO file key the Pager names', () => {
    const pager = pairings.find((p) => p.storyId === 'content-pager--default')
    expect(pager).toMatchObject({ nodeId: '4404:1821', fileKeyRef: 'O3XO_FIGMA_FILE_KEY' })
  })

  it('gives every pairing a story id — nothing in the repo autotitles', () => {
    expect(pairings.filter((p) => p.storyId === null)).toEqual([])
  })
})

describe('readInventory', () => {
  it('joins each brands stories against that brands manifest', () => {
    const inventory = readInventory(['o3', 'o3xo'])
    expect(inventory.coverage.map((row) => row.brand)).toEqual(['o3', 'o3xo'])
    expect(inventory.pairings.find((row) => row.storyId === 'brand-o3xomark--black')).toMatchObject(
      { designBrand: 'o3xo', match: 'componentSet', trackedName: 'O3XO mark' },
    )
  })

  it('flags the page-frame pairings the page mockups declare', () => {
    const inventory = readInventory(['o3'])
    expect(inventory.pageLevel.map((row) => row.storyId)).toContain('pages-home--desktop')
  })

  it('reports only the asked-for brand, and resolves every pairing it keeps', () => {
    const inventory = readInventory(['o3xo'])
    expect(readDesignFiles(['o3xo']).map((file) => file.brand)).toEqual(['o3xo'])
    expect(inventory.uncovered.every((row) => row.brand === 'o3xo')).toBe(true)
    expect(inventory.pairings.every((row) => row.designBrand === 'o3xo')).toBe(true)
  })
})
