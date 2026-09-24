import { describe, expect, it } from 'vitest'

import {
  buildInventory,
  extractPairings,
  formatInventory,
  type BrandDesignFile,
  type DeclaredPairing,
} from './pairing'

const O3_REF = 'FIGMA_FILE_KEY'

function o3File(entries: BrandDesignFile['entries']): BrandDesignFile {
  return { brand: 'o3', fileKeyRef: O3_REF, fileKey: 'RvraLJaZ', entries }
}

function pairing(over: Partial<DeclaredPairing> = {}): DeclaredPairing {
  return {
    storyId: 'content-blocks-section-quotesection--desktop',
    title: 'Content/Blocks/Section/QuoteSection',
    exportName: 'Desktop',
    nodeId: '2748:4767',
    fileKeyRef: O3_REF,
    file: 'packages/content-ui/src/blocks/section/quoteSection/QuoteSection.stories.tsx',
    declaredOn: 'meta',
    hosts: ['o3'],
    ...over,
  }
}

describe('extractPairings', () => {
  const file = 'packages/content-ui/src/blocks/section/quoteSection/QuoteSection.stories.tsx'

  it('inherits the meta-level pairing onto every story export', () => {
    const source = `
import { figmaDesign } from '@o3/story-kit'

const meta = {
  title: 'Content/Blocks/Section/QuoteSection',
  parameters: { design: figmaDesign('2748:4767') },
} satisfies Meta<typeof QuoteSection>

export default meta

export const Desktop: Story = { args: {} }
export const OnInk: Story = { args: {} }
`
    expect(extractPairings(file, source, ['o3'])).toEqual([
      pairing({ exportName: 'Desktop', hosts: ['o3'] }),
      pairing({
        exportName: 'OnInk',
        storyId: 'content-blocks-section-quotesection--on-ink',
        hosts: ['o3'],
      }),
    ])
  })

  it('lets a story override the meta pairing, and records which it was', () => {
    const source = `
const meta = {
  title: 'Content/Blocks/Section/QuoteSection',
  parameters: { design: figmaDesign('2748:4767') },
}
export default meta

export const Desktop: Story = {}
export const Mobile: Story = { parameters: { design: figmaDesign('2748:4804') } }
`
    const declared = extractPairings(file, source, ['o3'])
    expect(declared.map((p) => [p.exportName, p.nodeId, p.declaredOn])).toEqual([
      ['Desktop', '2748:4767', 'meta'],
      ['Mobile', '2748:4804', 'story'],
    ])
  })

  it('records the design file a second argument names, and defaults to O3s', () => {
    const source = `
const meta = { title: 'Content/Pager' }
export default meta

export const Default: Story = { parameters: { design: figmaDesign('4404:1821', OTHER_FILE_KEY) } }
export const O3Variant: Story = { parameters: { design: figmaDesign('136:14') } }
`
    const declared = extractPairings(file, source, ['o3'])
    expect(declared.map((p) => [p.exportName, p.fileKeyRef])).toEqual([
      ['Default', 'OTHER_FILE_KEY'],
      ['O3Variant', O3_REF],
    ])
  })

  it('yields nothing for a story file that declares no pairing', () => {
    const source = `
const meta = { title: 'Content/HeaderPill' }
export default meta
export const Default: Story = {}
`
    expect(extractPairings(file, source, ['o3'])).toEqual([])
  })

  it('ignores a figmaDesign call inside a comment', () => {
    const source = `
/**
 * There is no Design tab: figmaDesign('9999:1') is pinned to O3's file.
 */
const meta = { title: 'Content/HeaderPill' }
export default meta
// export const Old: Story = { parameters: { design: figmaDesign('8888:2') } }
export const Default: Story = {}
`
    expect(extractPairings(file, source, ['o3'])).toEqual([])
  })

  it('leaves the story id null when the file names no title', () => {
    const source = `
const meta = { component: Thing, parameters: { design: figmaDesign('1:2') } }
export default meta
export const Default: Story = {}
`
    const [declared] = extractPairings(file, source, ['o3'])
    expect(declared).toMatchObject({ title: null, storyId: null, nodeId: '1:2' })
  })

  it('reads a node id written in the dash form a Figma URL uses', () => {
    const source = `
const meta = { title: 'A/B', parameters: { design: figmaDesign('1680-2134') } }
export default meta
export const Default: Story = {}
`
    expect(extractPairings(file, source, ['o3'])[0]!.nodeId).toBe('1680:2134')
  })
})

describe('buildInventory', () => {
  it('lists every pairing with its story id, node id and brand', () => {
    const inventory = buildInventory(
      [pairing({ nodeId: '2748:4767' })],
      [o3File([{ nodeId: '2748:4767', kind: 'componentSet', name: 'Quote band' }])],
    )
    expect(inventory.pairings).toEqual([
      expect.objectContaining({
        storyId: 'content-blocks-section-quotesection--desktop',
        nodeId: '2748:4767',
        designBrand: 'o3',
        hosts: ['o3'],
        match: 'componentSet',
        trackedName: 'Quote band',
      }),
    ])
  })

  it('flags a pairing whose node is a page frame as page-level', () => {
    const inventory = buildInventory(
      [pairing({ nodeId: '1710:2609' }), pairing({ nodeId: '2748:4767', exportName: 'Other' })],
      [
        o3File([
          { nodeId: '1710:2609', kind: 'pageFrame', name: 'Case Study detail', route: '/work/x' },
          { nodeId: '2748:4767', kind: 'componentSet', name: 'Quote band' },
        ]),
      ],
    )
    expect(inventory.pageLevel.map((row) => row.nodeId)).toEqual(['1710:2609'])
    expect(inventory.pairings.find((row) => row.nodeId === '1710:2609')).toMatchObject({
      match: 'pageFrame',
      route: '/work/x',
    })
  })

  it('calls a pairing untracked when the manifest has never heard of its node', () => {
    const inventory = buildInventory([pairing({ nodeId: '9999:1' })], [o3File([])])
    expect(inventory.pairings[0]).toMatchObject({ match: 'untracked', trackedName: null })
  })

  it('lists every component set no story pairs, and never a page frame', () => {
    const inventory = buildInventory(
      [pairing({ nodeId: '2748:4767' })],
      [
        o3File([
          { nodeId: '2748:4767', kind: 'componentSet', name: 'Quote band' },
          {
            nodeId: '778:1862',
            kind: 'componentSet',
            name: 'Carousel control',
            codeComponent: 'x',
          },
          { nodeId: '1680:2134', kind: 'pageFrame', name: 'Home', route: '/' },
          { nodeId: '4212:374', kind: 'componentSet', name: 'Mark' },
        ]),
      ],
    )
    expect(inventory.uncovered).toEqual([
      { brand: 'o3', nodeId: '778:1862', name: 'Carousel control', codeComponent: 'x' },
      { brand: 'o3', nodeId: '4212:374', name: 'Mark', codeComponent: null },
    ])
  })

  it('keeps a pairing whose named design file is nothing it was given', () => {
    const inventory = buildInventory([pairing({ fileKeyRef: 'TYPO_FILE_KEY' })], [o3File([])])
    expect(inventory.pairings[0]).toMatchObject({ designBrand: null, match: 'untracked' })
  })

  it('counts coverage against the manifest', () => {
    const inventory = buildInventory(
      [pairing({ nodeId: '2748:4767' })],
      [
        o3File([
          { nodeId: '2748:4767', kind: 'componentSet', name: 'Quote band' },
          { nodeId: '778:1862', kind: 'componentSet', name: 'Carousel control' },
        ]),
      ],
    )
    expect(inventory.coverage).toEqual([{ brand: 'o3', tracked: 2, paired: 1 }])
  })
})

describe('formatInventory', () => {
  const inventory = buildInventory(
    [pairing({ nodeId: '1710:2609' }), pairing({ nodeId: '2748:4767', exportName: 'Mobile' })],
    [
      o3File([
        { nodeId: '1710:2609', kind: 'pageFrame', name: 'Case Study detail', route: '/work/x' },
        { nodeId: '2748:4767', kind: 'componentSet', name: 'Quote band' },
        { nodeId: '778:1862', kind: 'componentSet', name: 'Carousel control' },
      ]),
    ],
  )

  it('prints a row per pairing with the story id, the node id and the brand', () => {
    const text = formatInventory(inventory)
    expect(text).toContain('content-blocks-section-quotesection--desktop')
    // story, node, hosts, design
    expect(text).toMatch(/quotesection--desktop\s+1710:2609\s+o3\s+o3\s/)
  })

  it('marks the page-frame pairing page-level', () => {
    expect(formatInventory(inventory)).toMatch(/1710:2609.*page-level/)
  })

  it('prints the uncovered list whole', () => {
    const text = formatInventory(inventory)
    expect(text).toContain('Uncovered component sets (1)')
    expect(text).toContain('778:1862')
    expect(text).not.toContain('…')
  })
})
