import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'

import { StatsSection } from './StatsSection'

/**
 * Figures as a band — the two shapes the `layout` knob names.
 *
 * **The story is the test for this band** (AGENTS.md → Testing): there is no
 * frame to check against, so what the stories hold honest is the pair of
 * layouts and the fact that a figure and its label stay together.
 *
 * The figures are the committed Vertex case study's, so a reader comparing the
 * band to `/work/vertex` sees the same numbers.
 */
const stats = (...pairs: [string, string][]) =>
  pairs.map(([value, label], index) => ({
    _key: `stat-${index}`,
    _type: 'stat' as const,
    value,
    label,
  }))

const meta = {
  title: 'Content/Sections/StatsSection',
  component: StatsSection,
  parameters: { layout: 'fullscreen' },
  args: {
    surface: 'white' as const,
    stats: stats(
      ['3X', 'improvement across key conversion points'],
      ['200+', "Customers and internal stakeholders we've interviewed"],
      ['10+', 'Years working together as partners'],
    ),
  },
} satisfies Meta<typeof StatsSection>

export default meta
type Story = StoryObj<typeof meta>

/**
 * `columns` — the knob's default. The figures divide the 1248 measure between
 * them, so three stats draw three columns and four draw four.
 */
export const Columns: Story = {
  args: { layout: 'columns' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('3X')).toBeVisible()
    await expect(canvas.getByText('improvement across key conversion points')).toBeVisible()
  },
}

/**
 * `stacked` — the ruled column on the 822 article measure, which is the shape
 * the case-study detail carried before the band was a block. Hung on the prose
 * measure so a narrative keeps one spine through it.
 */
export const Stacked: Story = {
  args: { layout: 'stacked' },
}

/** Four is the columns layout's width — the point at which it stops dividing. */
export const FourAcross: Story = {
  args: {
    layout: 'columns',
    stats: stats(
      ['75 days', 'From start to delivery of the Pro-Series experience'],
      ['40K', 'New users on Pro Series site on launch day'],
      ['up 33%', 'y/y actions taken'],
      ['up 9%', 'y/y user engagement'],
    ),
  },
}

/** On ink, where the label takes its inverse tone from the band's surface. */
export const OnInk: Story = {
  args: { layout: 'columns', surface: 'ink' },
}
