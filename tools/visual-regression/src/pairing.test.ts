import { describe, expect, it } from 'vitest'

import {
  buildInventory,
  extractPairings,
  formatInventory,
  type BrandDesignFile,
  type DeclaredPairing,
} from './pairing'

const O3_REF = 'FIGMA_FILE_KEY'
const O3XO_REF = 'O3XO_FIGMA_FILE_KEY'

function o3File(entries: BrandDesignFile['entries']): BrandDesignFile {
  return { brand: 'o3', fileKeyRef: O3_REF, fileKey: 'RvraLJaZ', entries }
}

function o3xoFile(entries: BrandDesignFile['entries']): BrandDesignFile {
  return { brand: 'o3xo', fileKeyRef: O3XO_REF, fileKey: 'G6M2gu5q', entries }
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
    hosts: ['o3', 'o3xo'],
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
import { figmaDesign } from '@o3/story-kit'
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
import { figmaDesign } from '@o3/story-kit'
const meta = { title: 'Content/Pager' }
export default meta

export const Default: Story = { parameters: { design: figmaDesign('4404:1821', O3XO_FIGMA_FILE_KEY) } }
export const O3Variant: Story = { parameters: { design: figmaDesign('136:14') } }
`
    const declared = extractPairings(file, source, ['o3xo'])
    expect(declared.map((p) => [p.exportName, p.fileKeyRef])).toEqual([
      ['Default', O3XO_REF],
      ['O3Variant', O3_REF],
    ])
  })

  it('yields nothing for a story file that declares no pairing', () => {
    const source = `
import { figmaDesign } from '@o3/story-kit'
const meta = { title: 'Content/HeaderPill' }
export default meta
export const Default: Story = {}
`
    expect(extractPairings(file, source, ['o3'])).toEqual([])
  })

  it('ignores a figmaDesign call inside a comment', () => {
    const source = `
import { figmaDesign } from '@o3/story-kit'
/**
 * There is no Design tab: figmaDesign('9999:1') is pinned to O3's file.
 */
const meta = { title: 'O3XO/HeaderPill' }
export default meta
// export const Old: Story = { parameters: { design: figmaDesign('8888:2') } }
export const Default: Story = {}
`
    expect(extractPairings(file, source, ['o3xo'])).toEqual([])
  })

  it('leaves the story id null when the file names no title', () => {
    const source = `
import { figmaDesign } from '@o3/story-kit'
const meta = { component: Thing, parameters: { design: figmaDesign('1:2') } }
export default meta
export const Default: Story = {}
`
    const [declared] = extractPairings(file, source, ['o3'])
    expect(declared).toMatchObject({ title: null, storyId: null, nodeId: '1:2' })
  })

  it('reads a node id written in the dash form a Figma URL uses', () => {
    const source = `
import { figmaDesign } from '@o3/story-kit'
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
      [o3File([{ nodeId: '2748:4767', kind: 'componentSet', name: 'Quote band' }]), o3xoFile([])],
    )
    expect(inventory.pairings).toEqual([
      expect.objectContaining({
        storyId: 'content-blocks-section-quotesection--desktop',
        nodeId: '2748:4767',
        designBrand: 'o3',
        hosts: ['o3', 'o3xo'],
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
        ]),
        o3xoFile([{ nodeId: '4212:374', kind: 'componentSet', name: 'O3XO mark' }]),
      ],
    )
    expect(inventory.uncovered).toEqual([
      { brand: 'o3', nodeId: '778:1862', name: 'Carousel control', codeComponent: 'x' },
      { brand: 'o3xo', nodeId: '4212:374', name: 'O3XO mark', codeComponent: null },
    ])
  })

  it('joins on the design file the story named, not on the host it renders in', () => {
    const inventory = buildInventory(
      [pairing({ nodeId: '4212:374', fileKeyRef: O3XO_REF, hosts: ['o3', 'o3xo'] })],
      [
        o3File([{ nodeId: '4212:374', kind: 'componentSet', name: 'A node of the same id' }]),
        o3xoFile([{ nodeId: '4212:374', kind: 'componentSet', name: 'O3XO mark' }]),
      ],
    )
    expect(inventory.pairings[0]).toMatchObject({ designBrand: 'o3xo', trackedName: 'O3XO mark' })
    expect(inventory.uncovered.map((row) => row.brand)).toEqual(['o3'])
  })

  it('keeps a pairing whose named design file is nothing it was given', () => {
    const inventory = buildInventory([pairing({ fileKeyRef: 'TYPO_FILE_KEY' })], [o3File([])])
    expect(inventory.pairings[0]).toMatchObject({ designBrand: null, match: 'untracked' })
  })

  it('reports one brand while still joining against the other brands file', () => {
    const inventory = buildInventory(
      [
        pairing({ nodeId: '4212:374', fileKeyRef: O3XO_REF }),
        pairing({ nodeId: '2748:4767', exportName: 'O3Story' }),
      ],
      [
        o3File([{ nodeId: '2748:4767', kind: 'componentSet', name: 'Quote band' }]),
        o3xoFile([{ nodeId: '4212:374', kind: 'componentSet', name: 'O3XO mark' }]),
      ],
      ['o3xo'],
    )
    expect(inventory.pairings.map((row) => row.nodeId)).toEqual(['4212:374'])
    expect(inventory.coverage).toEqual([{ brand: 'o3xo', tracked: 1, paired: 1 }])
    expect(inventory.uncovered).toEqual([])
  })

  it('counts coverage per brand', () => {
    const inventory = buildInventory(
      [pairing({ nodeId: '2748:4767' })],
      [
        o3File([
          { nodeId: '2748:4767', kind: 'componentSet', name: 'Quote band' },
          { nodeId: '778:1862', kind: 'componentSet', name: 'Carousel control' },
        ]),
        o3xoFile([{ nodeId: '4212:374', kind: 'componentSet', name: 'O3XO mark' }]),
      ],
    )
    expect(inventory.coverage).toEqual([
      { brand: 'o3', tracked: 2, paired: 1 },
      { brand: 'o3xo', tracked: 1, paired: 0 },
    ])
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
    expect(text).toContain('1710:2609')
    expect(text).toContain('o3+o3xo')
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

it('does not turn an unused helper call or a documentation string into a design pairing', () => {
  const source = `const unused = figmaDesign('1:1'); const meta = { title: 'UI/Card', parameters: {docs: 'figmaDesign("2:2")'} }; export default meta;
export const Default = {}`
  expect(extractPairings('Card.stories.tsx', source, ['o3'])).toEqual([])
})

it('does not inherit a meta design that a story explicitly clears or replaces', () => {
  const source = `
import { figmaDesign as design } from '@o3/story-kit'
export default { title: 'UI/Card', parameters: { design: design('1:1') } }
export const Inherited = {}
export const Null = { parameters: { design: null } }
export const Undefined = { parameters: { design: undefined } }
export const Different = { parameters: { design: { type: 'link', url: 'example' } } }
`
  expect(extractPairings('card.stories.tsx', source, ['o3']).map((row) => row.exportName)).toEqual([
    'Inherited',
  ])
})

it('requires figmaDesign to come from the story-kit contract', () => {
  for (const declaration of [
    "import { figmaDesign } from 'unrelated'",
    'function figmaDesign() {}',
  ]) {
    expect(
      extractPairings(
        'card.stories.tsx',
        `${declaration}
export default { title: 'UI/Card', parameters: { design: figmaDesign('1:1') } }
export const Default = {}
`,
        ['o3'],
      ),
    ).toEqual([])
  }
})
