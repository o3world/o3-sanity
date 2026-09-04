import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { SITE_SETTINGS } from '../testing/seedContent'

import { MobileNavMenu } from './MobileNavMenu'

/**
 * The 402 nav's menu, behind the "Open menu" affordance (`1814:1636`) — the
 * **only interactive part of the chrome**, and so the one client component in
 * it.
 *
 * ⚠️ **The opened panel has no Figma frame.** The mobile frames draw the
 * closed hamburger and stop; ADR 0006 records that as a genuine coverage gap.
 * Nothing in the panel invents visual language — it reuses the bar's own
 * `ink-deep` surface and the `text-button` treatment the 1440 pill gives its
 * links. Only the vertical stack is a code decision. The Design tab here
 * points at the **closed** affordance, which is all the file actually has.
 *
 * App navigation dismisses the portal immediately; manual closure keeps its
 * exit cadence. The production navigation contract covers that router-owned
 * handoff, including a rapid touch reopening the menu during page arrival.
 */
const meta = {
  title: 'Chrome/MobileNavMenu',
  component: MobileNavMenu,
  parameters: {
    layout: 'centered',
    design: figmaDesign('1814:1636'),
  },
  args: {
    items: SITE_SETTINGS?.navItems ?? [],
    button: SITE_SETTINGS?.primaryButton ?? null,
  },
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'mobile' } },
} satisfies Meta<typeof MobileNavMenu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Closed — the two-bar glyph at 85% of the bar's ink. Click it to open the
 * panel; that is the whole interaction, and there is no separate "open" story
 * because a Radix sheet's open state lives in a portal outside the story root.
 */
export const Closed: Story = {}

/** Over a light band, where the bar's ink flip reaches the glyph. */
export const Flipped: Story = {
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
  render: (args) => (
    <div className="text-fg">
      <MobileNavMenu {...args} />
    </div>
  ),
}

/** No button — the panel is links only, and must not leave the 16px gap. */
export const WithoutButton: Story = {
  args: { button: null },
}

/** No nav items: the trigger still has to open onto something, not a void. */
export const WithoutItems: Story = {
  args: { items: [] },
}
