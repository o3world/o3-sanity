import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { MenuIcon } from './menu-icon'

/**
 * The 402 nav's "Open menu" affordance (`1814:1636`).
 *
 * **Two bars, not three.** ADR 0009 describes it as three in passing; the
 * frame draws two 24×1.5 rules 5px apart, right-aligned in a 42×42 box
 * (`1814:1637`, `1814:1638`). That is the design's, so it is kept — and this
 * story is where that stays visible rather than reading as a missing bar.
 *
 * The frame's `rgba(255,255,255,0.85)` lives on the trigger as an opacity over
 * `currentColor`, not here, so the nav's ink flip reaches the glyph the same
 * way it reaches the links.
 */
const meta = {
  title: 'UI/Icons/MenuIcon',
  component: MenuIcon,
  parameters: {
    layout: 'centered',
    design: figmaDesign('1814:1636'),
  },
} satisfies Meta<typeof MenuIcon>

export default meta
type Story = StoryObj<typeof meta>

/** 42px in its own box, on ink — where the 402 bar actually draws it. */
export const Default: Story = {
  args: { className: 'text-white' },
  globals: { backgrounds: { value: 'ink' } },
}

/** Flipped: the bar over a light band takes `--color-fg`, and so does the glyph. */
export const Flipped: Story = {
  args: { className: 'text-fg' },
  globals: { backgrounds: { value: 'bone' } },
}

/** At the trigger's 85% — the value the frame draws, as the bar applies it. */
export const AtTriggerOpacity: Story = {
  args: { className: 'text-white' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="flex items-center gap-8 text-white">
      <MenuIcon {...args} />
      <span className="opacity-85">
        <MenuIcon className="text-white" />
      </span>
    </div>
  ),
}
