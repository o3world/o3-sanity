import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Skeleton } from './skeleton'

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

/** One bar. Every other shape is this one with a different box. */
export const Default: Story = {
  args: { className: 'h-6 w-64' },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * What a streamed index draws while its feed is in flight — a square figure
 * over a meta line and a title, three across, as `/insights` lays its cards
 * out at `lg`.
 */
export const CardGrid: Story = {
  globals: { backgrounds: { value: 'bone' } },
  render: () => (
    <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-4">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-6 w-full" />
        </div>
      ))}
    </div>
  ),
}
