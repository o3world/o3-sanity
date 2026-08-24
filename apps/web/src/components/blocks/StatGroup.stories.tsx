import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import type { BaseProps } from '@o3/content-runtime/blocks'

import { StatGroup } from './StatGroup'

/**
 * O3's stat row: 1–4 stats bare — two up on a phone, four across from `lg`.
 *
 * **The brand is pinned**, and the story is this app's rather than the shared
 * package's, because `statGroup` is app-first (`APP_FIRST_RENDERERS`): the two
 * brands draw the row as different compositions, so there is no shared
 * renderer for a Brand toolbar to flip. O3XO's row is its own story beside its
 * own renderer.
 *
 * The count is the editor's, so every count between one and four has a story:
 * three stats in a four-column grid is the arrangement that looks wrong first,
 * and two-up on mobile is where a long value collides with its neighbour.
 */
const meta = {
  title: 'Content/Blocks/Base/StatGroup',
  component: StatGroup,
  globals: { brand: 'o3' },
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

/** Four — the full row the grid is designed around. */
export const Four: Story = {
  args: {
    stats: stats(
      ['272', 'posts migrated'],
      ['69', 'commits'],
      ['1', 'weekend'],
      ['0', 'content freezes'],
    ),
  },
}

/** Three in a four-column grid — the last cell is empty, not stretched. */
export const Three: Story = {
  args: {
    stats: stats(['3x', 'faster to publish'], ['40%', 'less time in the CMS'], ['12', 'templates']),
  },
}

export const Two: Story = {
  args: { stats: stats(['98', 'Lighthouse'], ['1.2s', 'LCP']) },
}

/** One stat. It must read as a figure, not as a row that failed to fill. */
export const One: Story = {
  args: { stats: stats(['272', 'posts migrated']) },
}

/** Two up on a phone — where a long value and a long label collide. */
export const Mobile: Story = {
  args: {
    stats: stats(
      ['272', 'posts migrated off WordPress'],
      ['69', 'commits'],
      ['1', 'weekend'],
      ['0', 'content freezes'],
    ),
  },
  globals: { brand: 'o3', viewport: { value: 'mobile' } },
}

/** Empty — the block returns null rather than an empty list. */
export const Empty: Story = {
  args: { stats: [] as unknown as Stats },
}

export const OnInk: Story = {
  args: {
    stats: stats(['272', 'posts migrated'], ['69', 'commits'], ['1', 'weekend']),
  },
  globals: { brand: 'o3', backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink p-12 text-white">
      <StatGroup {...args} />
    </div>
  ),
}
