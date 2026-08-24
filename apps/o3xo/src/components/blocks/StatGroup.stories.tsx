import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import type { BaseProps } from '@o3/content-runtime/blocks'

import { StatGroup } from './StatGroup'

/**
 * O3XO's stat row: the kit's `Key Metric Card Group` (`4404:3960`), three
 * plates across and a fourth wrapping under them.
 *
 * **The brand is pinned**, and the story is this app's rather than the shared
 * package's, because `statGroup` is app-first (`APP_FIRST_RENDERERS`): the two
 * brands draw the row as different compositions, so there is no shared
 * renderer for a Brand toolbar to flip.
 *
 * What this covers that `KeyMetricCard.stories.tsx` does not is the block —
 * the mapping from a `statGroup`'s keyed `stats` to the row's items, including
 * the counts an editor can author and the empty array.
 */
const meta = {
  title: 'Content/Blocks/Base/StatGroup',
  component: StatGroup,
  globals: { brand: 'o3xo' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof StatGroup>

export default meta
type Story = StoryObj<typeof meta>

type Stats = NonNullable<BaseProps<'statGroup'>['stats']>

const stats = (...pairs: [string, string][]) =>
  pairs.map(([value, label], i) => ({
    _key: `stat-${i}`,
    _type: 'stat' as const,
    value,
    label,
  })) as unknown as Stats

/** Three — the homepage's "Key metrics across accounts" band, as the kit draws it. */
export const Three: Story = {
  args: {
    stats: stats(
      ['50%+', 'Average efficiency gains'],
      ['10x', 'Faster information access'],
      ['<90 days', 'Average time to prove ROI'],
    ),
  },
}

/** Four in a three-across row — the fourth wraps rather than squeezing the plates. */
export const Four: Story = {
  args: {
    stats: stats(
      ['50%+', 'Average efficiency gains'],
      ['10x', 'Faster information access'],
      ['<90 days', 'Average time to prove ROI'],
      ['3', 'Industries served'],
    ),
  },
}

export const Two: Story = {
  args: {
    stats: stats(['50%+', 'Average efficiency gains'], ['10x', 'Faster information access']),
  },
}

/** One plate. It must read as a figure, not as a row that failed to fill. */
export const One: Story = {
  args: { stats: stats(['50%+', 'Average efficiency gains']) },
}

/** Stacked at 402 — each plate is full width and the figure keeps its step. */
export const Mobile: Story = {
  args: {
    stats: stats(
      ['50%+', 'Average efficiency gains'],
      ['10x', 'Faster information access'],
      ['<90 days', 'Average time to prove ROI'],
    ),
  },
  globals: { brand: 'o3xo', viewport: { value: 'mobile' } },
}

/** Empty — the block returns null rather than an empty list. */
export const Empty: Story = {
  args: { stats: [] as unknown as Stats },
}

/** On ink — the surface the homepage band declares, which is where the row sits. */
export const OnInk: Story = {
  args: {
    stats: stats(
      ['50%+', 'Average efficiency gains'],
      ['10x', 'Faster information access'],
      ['<90 days', 'Average time to prove ROI'],
    ),
  },
  globals: { brand: 'o3xo', backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink p-12 text-white" data-surface="ink">
      <StatGroup {...args} />
    </div>
  ),
}
