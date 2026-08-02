import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PortraitTile } from './portrait-tile'

const meta = {
  title: 'UI/PortraitTile',
  component: PortraitTile,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PortraitTile>

export default meta
type Story = StoryObj<typeof meta>

/**
 * With no portrait the tile is the treatment on its own — black with the red
 * arc. All 12 migrated `person` documents have a headshot today (the two that
 * didn't were WP accounts standing in as bylines, retired in #32), so this is
 * the state a hand-added person reaches before anyone uploads their picture.
 */
export const Empty: Story = {
  args: { className: 'w-[394px]' },
}

/**
 * With a rectangular photo — the shape every migrated headshot has today. The
 * arc is behind it and therefore hidden; cut-out portraits are what reveal it.
 */
export const WithPortrait: Story = {
  args: {
    className: 'w-[394px]',
    children: (
      <img
        src="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23888%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22160%22%20r%3D%2270%22%20fill%3D%22%23ddd%22%2F%3E%3Cpath%20d%3D%22M60%20400c0-90%2060-140%20140-140s140%2050%20140%20140z%22%20fill%3D%22%23ddd%22%2F%3E%3C%2Fsvg%3E"
        alt="A team member"
        className="h-full w-full object-cover"
      />
    ),
  },
}
