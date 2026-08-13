import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { FilterChip } from './filter-chip'

const meta = {
  title: 'UI/FilterChip',
  component: FilterChip,
  parameters: { layout: 'padded' },
  args: { href: '#' },
  argTypes: { selected: { control: 'boolean' } },
  globals: { backgrounds: { value: 'bone' } },
} satisfies Meta<typeof FilterChip>

export default meta
type Story = StoryObj<typeof meta>

/** Theme=White (`2337:4551`) — a category the index is not filtered to. */
export const Default: Story = {
  args: { children: 'Design' },
}

/** Theme=Black (`2337:4542`) — the chip for the feed on screen. */
export const Selected: Story = {
  args: { children: 'All', selected: true },
}

/**
 * The bar as the Insights frame draws it (`2337:4486`): All selected, the
 * categories beside it, 10px apart.
 */
export const Bar: Story = {
  args: { children: 'All' },
  render: () => (
    <div className="flex flex-wrap items-center gap-2.5">
      <FilterChip href="#" selected>
        All
      </FilterChip>
      {['AI', 'Design', 'Technology', '1682 Conference', 'Life at O3'].map((label) => (
        <FilterChip key={label} href="#">
          {label}
        </FilterChip>
      ))}
    </div>
  ),
}
