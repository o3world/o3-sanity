import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { figmaDesign } from '@o3/story-kit'
import { INSIGHTS } from '@o3/content-ui/testing/seed'

import { InsightView } from './InsightView'

const paragraph = 'Article prose keeps its own leading, independent of case-study descriptions.'
const quote = 'A pull quote uses the same sans-serif voice at both widths.'

const meta = {
  title: 'Pages/Insight detail',
  component: InsightView,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1710:2823'),
    viewport: {
      options: {
        mobile: { name: 'Figma mobile', styles: { width: '402px', height: '874px' } },
      },
    },
  },
  args: {
    ...INSIGHTS[0],
    title: 'When you trust your design process enough to use it on yourselves.',
    excerpt: 'Go figure, right?',
    categories: [{ title: 'Category', slug: 'category' }],
    author: { name: 'Review Author', title: 'Designer', headshot: null },
    heroMedia: null,
    cardMedia: null,
    related: [],
    latest: [],
    body: [
      {
        _type: 'block',
        _key: 'paragraph',
        style: 'normal',
        markDefs: [],
        children: [{ _type: 'span', _key: 'text', text: paragraph, marks: [] }],
      },
      { _type: 'pullQuote', _key: 'quote', text: quote, attribution: 'Review Author' },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const heading = canvas.getByRole('heading', { level: 1 })
    const desktop = window.innerWidth >= 1440
    const mobile = window.innerWidth <= 402
    if (desktop || mobile) {
      await expect(parseFloat(getComputedStyle(heading).fontSize)).toBeCloseTo(desktop ? 64 : 40, 1)
      await expect(parseFloat(getComputedStyle(heading).lineHeight)).toBeCloseTo(
        desktop ? 76 : 44,
        1,
      )
    }
    if (desktop) await expect(heading.getBoundingClientRect().width).toBe(608)
    const category = canvas.getByText('Category')
    const excerpt = canvas.getByText('Go figure, right?')
    await expect(getComputedStyle(category).color).toBe('rgb(170, 166, 158)')
    await expect(getComputedStyle(excerpt).color).toBe('rgb(170, 166, 158)')
    await expect(
      heading.getBoundingClientRect().top - category.getBoundingClientRect().bottom,
    ).toBeCloseTo(24, 1)
    await expect(
      excerpt.getBoundingClientRect().top - heading.getBoundingClientRect().bottom,
    ).toBeCloseTo(8, 1)
    const prose = canvas.getByText(paragraph)
    await expect(getComputedStyle(prose).fontSize).toBe('20px')
    await expect(getComputedStyle(prose).lineHeight).toBe('32px')
    const pullQuote = canvas.getByText(`“${quote}”`)
    await expect(getComputedStyle(pullQuote).fontSize).toBe('28px')
    await expect(getComputedStyle(pullQuote).lineHeight).toBe('38px')
    await expect(getComputedStyle(pullQuote).fontFamily).toContain('Figtree')
    await expect(getComputedStyle(pullQuote.parentElement!).paddingLeft).toBe('32px')
    await expect(getComputedStyle(pullQuote.parentElement!).paddingTop).toBe('24px')
    await expect(getComputedStyle(pullQuote.parentElement!).gap).toBe('24px')
  },
} satisfies Meta<typeof InsightView>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = { globals: { viewport: { value: 'desktop' } } }
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('1906:1046') },
}
