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

/** Theme=White (`3739:71112`) — a category the index is not filtered to. */
export const Default: Story = {
  // `Default`, `Selected` and `Bar` are the chips and the row `BarScrolling`
  // mounts at 402 with its scroll region; it alone carries the stories run.
  tags: ['!test'],
  args: { children: 'Design' },
}

/** Theme=Black (`3739:71111`) — the chip for the feed on screen. */
export const Selected: Story = {
  tags: ['!test'],
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
 * The bar as the Insights frame draws it (`3739:71110`): All selected, the
 * categories beside it, 10px apart, wrapping when the collection outgrows the
 * row.
 */
export const Bar: Story = {
  tags: ['!test'],
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
