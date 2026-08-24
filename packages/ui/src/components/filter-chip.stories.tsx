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

const CATEGORIES = ['AI', 'Design', 'Technology', '1682 Conference', 'Life at O3']

/** The row `InsightIndexView` builds: scrolling at 402, wrapping at 1440. */
function Row() {
  return (
    <nav
      aria-label="Filter by category"
      className="flex items-center gap-2.5 overflow-x-auto [scrollbar-width:none] lg:flex-wrap lg:overflow-x-visible [&::-webkit-scrollbar]:hidden"
    >
      <FilterChip href="#" selected className="shrink-0">
        All
      </FilterChip>
      {CATEGORIES.map((label) => (
        <FilterChip key={label} href="#" className="shrink-0">
          {label}
        </FilterChip>
      ))}
    </nav>
  )
}

/**
 * The bar as the Insights frame draws it (`2337:4486`): All selected, the
 * categories beside it, 10px apart, wrapping when the collection outgrows the
 * row.
 */
export const Bar: Story = {
  args: { children: 'All' },
  render: () => <Row />,
}

/**
 * The same bar at 402 (`2975:8656`). The six chips measure 657px against a
 * 370px column, so the row does not wrap — it scrolls sideways, and the chip
 * cut by the right edge is the affordance saying so. Drag it to see the rest.
 * Every chip is a link, so a keyboard reaches them by tabbing and the browser
 * scrolls each into view; the row needs no `tabIndex` of its own.
 */
export const BarScrolling: Story = {
  args: { children: 'All' },
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
  render: () => <Row />,
}
