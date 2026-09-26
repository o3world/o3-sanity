import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { stegaEncodeSourceMap } from '@sanity/client/stega'
import { expect } from 'storybook/test'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '../../../testing/seedContent'

import { QuoteSection } from './QuoteSection'

/** Current Quote set (2748:4672), including Home's Small composition. */
const meta = {
  title: 'Content/Blocks/Section/QuoteSection',
  component: QuoteSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('2748:4672'),
  },
} satisfies Meta<typeof QuoteSection>

export default meta
type Story = StoryObj<typeof meta>

/** Authored quote and attribution. */
export const AsSeeded: Story = {
  args: seededSectionArgs('index', 'quoteSection'),
  globals: { backgrounds: { value: 'bone' } },
}

/** Default quote at mobile, with the shared 48px attribution gap. */
export const Mobile: Story = {
  args: seededSectionArgs('index', 'quoteSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('2748:4804') },
}

/** Short authored copy keeps the same composition. */
export const Short: Story = {
  args: {
    ...seededSectionArgs('index', 'quoteSection'),
    quote: 'They found the problem behind the problem.',
    attribution: 'CTO, Global Health Brand',
  },
  globals: { backgrounds: { value: 'bone' } },
}

/** No attribution — the gap under the quote must close, not hang. */
export const Unattributed: Story = {
  args: { ...seededSectionArgs('index', 'quoteSection'), attribution: undefined },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * `decoration: 'molecule'` — what Home's instances draw: the same column with
 * the 776px mark at 10% hung off the bottom-left corner instead of the two
 * spheres, clipped by the band. The one decoration that survives 402.
 */
export const Molecule: Story = {
  args: { ...seededSectionArgs('index', 'quoteSection'), decoration: 'molecule' },
  globals: { backgrounds: { value: 'bone' } },
  parameters: { design: figmaDesign('2748:4672') },
}

/** No decoration; the quote composition is unchanged. */
export const NoDecoration: Story = {
  args: { ...seededSectionArgs('index', 'quoteSection'), decoration: 'none' },
  globals: { backgrounds: { value: 'bone' } },
}

/** Text roles follow the authored ink surface. */
export const OnInk: Story = {
  args: { ...seededSectionArgs('index', 'quoteSection'), surface: 'ink' },
  globals: { backgrounds: { value: 'ink' } },
}

/** Current homepage instance I3720:60563;3265:2244. */
export const Small: Story = {
  args: { ...seededSectionArgs('index', 'quoteSection'), size: 'small' },
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'desktop' } },
  parameters: { design: figmaDesign('3720:60563') },
  play: async ({ canvasElement }) => {
    const quote = canvasElement.querySelector('blockquote p')!
    await expect(getComputedStyle(quote).fontFamily).toContain('Figtree')
    await expect(getComputedStyle(quote).fontSize).toBe('36px')
    await expect(getComputedStyle(quote).lineHeight).toBe('44px')
    const band = quote.closest('section')!
    await expect(getComputedStyle(band).paddingTop).toBe('128px')
    await expect(getComputedStyle(band).paddingBottom).toBe('128px')
    await expect(quote.parentElement!.getBoundingClientRect().width).toBe(822)
    await expect(getComputedStyle(quote.parentElement!).gap).toBe('48px')
  },
}

export const SmallMobile: Story = {
  ...Small,
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('3265:2256') },
  play: async ({ canvasElement }) => {
    const quote = canvasElement.querySelector('blockquote p')!
    await expect(getComputedStyle(quote).fontSize).toBe('28px')
    await expect(getComputedStyle(quote).lineHeight).toBe('34px')
    const band = quote.closest('section')!
    await expect(getComputedStyle(band).paddingTop).toBe('64px')
    await expect(getComputedStyle(band).paddingBottom).toBe('64px')
    await expect(getComputedStyle(quote.parentElement!).gap).toBe('48px')
    await expect(quote.getBoundingClientRect().width).toBeLessThanOrEqual(band.clientWidth)
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
  },
}

const encodedSmall = stegaEncodeSourceMap(
  { size: 'small' as const },
  {
    documents: [{ _id: 'quote-preview-fixture', _type: 'page' }],
    paths: ["$['sections'][0]['size']"],
    mappings: {
      "$['size']": {
        type: 'value',
        source: { type: 'documentValue', document: 0, path: 0 },
      },
    },
  },
  { enabled: true, studioUrl: '/studio' },
).size

/** Presentation metadata must not change the selected size or text wrapping. */
export const EditorPreview: Story = {
  ...Small,
  render: (args) => (
    <>
      <QuoteSection {...args} size="small" decoration="none" />
      <QuoteSection {...args} size={encodedSmall} decoration="none" />
    </>
  ),
  play: async ({ canvasElement }) => {
    await document.fonts.ready
    await expect(encodedSmall).not.toBe('small')
    const [plain, encoded] = Array.from(canvasElement.querySelectorAll('section'))
    const plainQuote = plain!.querySelector('blockquote')!
    const encodedQuote = encoded!.querySelector('blockquote')!
    const text = getComputedStyle(encodedQuote.querySelector('p')!)
    await expect(text.fontFamily).toContain('Figtree')
    await expect(text.fontSize).toBe('36px')
    await expect(text.lineHeight).toBe('44px')
    await expect(text.fontWeight).toBe('300')
    for (const property of ['paddingTop', 'paddingBottom'] as const) {
      await expect(getComputedStyle(encoded!)[property]).toBe(getComputedStyle(plain!)[property])
    }
    await expect(getComputedStyle(encodedQuote).gap).toBe(getComputedStyle(plainQuote).gap)
    await expect(encodedQuote.getBoundingClientRect().width).toBe(
      plainQuote.getBoundingClientRect().width,
    )
    await expect(encodedQuote.getBoundingClientRect().height).toBeCloseTo(
      plainQuote.getBoundingClientRect().height,
      0,
    )
    await expect(encoded!.getBoundingClientRect().height).toBeCloseTo(
      plain!.getBoundingClientRect().height,
      0,
    )
    for (const band of [plain!, encoded!]) await expect(band.scrollWidth).toBe(band.clientWidth)
  },
}
