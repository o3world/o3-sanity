import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { seededSectionArgs } from '@/stories/seedContent'

import { LayoutSection } from './LayoutSection'

/**
 * The one true two-tier block (ADR 0001): 1–3 columns of **base-tier** blocks,
 * dispatched through the base registry. It is the band an editor reaches for
 * when no bespoke block fits, so what it does with an awkward mix is more
 * interesting than what it does with a tidy one.
 *
 * Its header follows the About frame's interior bands (`1924:5344`): a neutral
 * eyebrow, the 48px heading, and a set-back subheading.
 *
 * The base tier never contains sections, so nothing here can nest — the
 * columns hold `richText`, `figure`, `embed`, `cta` and `statGroup`, and that
 * is the whole vocabulary. Each of those has its own story under
 * `Content/Blocks/Base`.
 */
const meta = {
  title: 'Content/Blocks/Section/LayoutSection',
  component: LayoutSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LayoutSection>

export default meta
type Story = StoryObj<typeof meta>

/** The About page's opening prose band. */
export const AsSeeded: Story = {
  args: seededSectionArgs('about', 'layoutSection', 0),
}

/** A second real instance, with a different column count and item mix. */
export const AboutSecondBand: Story = {
  args: seededSectionArgs('about', 'layoutSection', 1),
}

/** The 1682 page's bands — the block carrying figures rather than prose. */
export const WithFigures: Story = {
  args: seededSectionArgs('1682-conference-ai-innovation', 'layoutSection', 1),
}

/** Forced to one column: the measure, not the grid, is what has to hold. */
export const SingleColumn: Story = {
  args: { ...seededSectionArgs('about', 'layoutSection', 0), columns: 1 },
}

/** Three columns of the same items — the tightest measure the block allows. */
export const ThreeColumns: Story = {
  args: { ...seededSectionArgs('about', 'layoutSection', 0), columns: 3 },
}

/** Header dropped — items only, which is how most interior bands are authored. */
export const NoHeader: Story = {
  args: {
    ...seededSectionArgs('about', 'layoutSection', 0),
    eyebrow: undefined,
    heading: undefined,
    subheading: undefined,
  },
}

/** Empty. A band with a header and no items should not draw an empty grid. */
export const NoItems: Story = {
  args: { ...seededSectionArgs('about', 'layoutSection', 0), items: [] },
}

export const Mobile: Story = {
  args: seededSectionArgs('about', 'layoutSection', 0),
  globals: { viewport: { value: 'mobile' } },
}

/** On ink — base blocks inherit the band's ink, so this is the readability check. */
export const OnInk: Story = {
  args: { ...seededSectionArgs('about', 'layoutSection', 0), surface: 'ink' },
  globals: { backgrounds: { value: 'ink' } },
}
