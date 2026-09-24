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
  const hosts = storyFilesByHost()

  it('serves a shared package story on the host', () => {
    expect(hosts.get('packages/content-ui/src/chrome/SiteNav.stories.tsx')).toEqual(['o3'])
  })

  it('serves an app story on the host', () => {
    expect(hosts.get('apps/web/src/stories/pages/Home.stories.tsx')).toEqual(['o3'])
  })
})

describe('readDeclaredPairings', () => {
  const pairings = readDeclaredPairings()

  it('reads the meta pairing NextCaseBand declares once for both its stories', () => {
    const band = pairings.filter((p) => p.title === 'Content/Documents/CaseStudy/NextCaseBand')
    expect(band.map((p) => [p.storyId, p.nodeId, p.declaredOn])).toEqual([
      ['content-documents-casestudy-nextcaseband--desktop', '1710:2609', 'meta'],
      ['content-documents-casestudy-nextcaseband--mobile', '1906:1039', 'story'],
    ])
  })

  it('names the O3 file key on every pairing', () => {
    expect(pairings.filter((p) => p.fileKeyRef !== 'FIGMA_FILE_KEY')).toEqual([])
  })

  it('gives every pairing a story id — nothing in the repo autotitles', () => {
    expect(pairings.filter((p) => p.storyId === null)).toEqual([])
  })
})

describe('readInventory', () => {
  const inventory = readInventory()

  it('joins the stories against the tracked-nodes manifest', () => {
    expect(readDesignFiles().map((file) => file.brand)).toEqual(['o3'])
    expect(inventory.coverage.map((row) => row.brand)).toEqual(['o3'])
    expect(
      inventory.pairings.find(
        (row) => row.storyId === 'content-documents-casestudy-nextcaseband--desktop',
      ),
    ).toMatchObject({ designBrand: 'o3', nodeId: '1710:2609' })
  })

  it('flags the page-frame pairings the page mockups declare', () => {
    expect(inventory.pageLevel.map((row) => row.storyId)).toContain('pages-home--desktop')
  })

  it('resolves every pairing to the design file', () => {
    expect(inventory.pairings.every((row) => row.designBrand === 'o3')).toBe(true)
  })
})
