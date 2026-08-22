import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Icon, ICON_NAMES } from './Icon'

/**
 * The kit's icon set — the eighteen glyphs of the `Phosphor Icons` component
 * set (`4404:5589`, Icons canvas `345:2833` of the _O3XO: UI kit_ file), which
 * a feature names one of.
 *
 * **The brand is pinned.** These are O3XO's alone, so there is no question for
 * the Brand toolbar to ask over them and pinning `globals.brand` is what greys
 * the control out. The toolbar stays live on the shared-package stories, where
 * flipping the brand is the standing paint-leak test (ADR 0028).
 *
 * Both surfaces are here because that is the one thing a glyph can get wrong
 * that a single band would hide: every path is `currentColor`, so a set that
 * reads on white and disappears on ink is a fill somebody hard-coded.
 */
const meta = {
  title: 'Icons/Icon',
  component: Icon,
  globals: { brand: 'o3xo' },
  parameters: { layout: 'centered' },
  argTypes: {
    name: { control: 'select', options: ICON_NAMES },
    size: { control: { type: 'number' } },
  },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

function Sheet({ size }: { size: number }) {
  return (
    <ul className="grid grid-cols-3 gap-8 sm:grid-cols-6">
      {ICON_NAMES.map((name) => (
        <li key={name} className="flex flex-col items-center gap-2 text-center">
          <Icon name={name} size={size} />
          <span className="text-fg-muted text-xs">{name}</span>
        </li>
      ))}
    </ul>
  )
}

/** All eighteen at the size the set draws them, on the band they usually sit on. */
export const Set: Story = {
  args: { name: 'sparkle' },
  parameters: { layout: 'padded' },
  render: () => <Sheet size={32} />,
}

/**
 * The same sheet inverted. Nothing about the drawings changes — `currentColor`
 * takes the copy's ink — which is the whole claim this story exists to show.
 */
export const OnInk: Story = {
  args: { name: 'sparkle' },
  parameters: { layout: 'padded' },
  globals: { backgrounds: { value: 'ink' } },
  render: () => (
    <div className="text-white">
      <Sheet size={32} />
    </div>
  ),
}

/**
 * One glyph at the size a feature band gives it. The box comes from the
 * composition and not from the icon (the kit draws no feature band of its own),
 * so a set that only reads at 24 would be the thing to catch here.
 */
export const Large: Story = {
  args: { name: 'lightbulb-filament', size: 138 },
}
