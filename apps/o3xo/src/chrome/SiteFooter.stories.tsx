import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SiteFooter } from './SiteFooter'
import { chromeSettings } from './SiteNav.stories'
import type { Settings } from './navItems'

/**
 * O3XO's footer — the kit's `Footer` (`4404:4148`).
 *
 * The one thing to look at is that it is **light**. O3's footer is a black
 * band with an orbital arc and three link columns; this is `bone`, four lines
 * long, and the wordmark on it is type rather than the lockup — which is what
 * both the kit and o3xo.ai draw.
 */
const meta = {
  title: 'Chrome/SiteFooter',
  component: SiteFooter,
  globals: { brand: 'o3xo' },
  parameters: {
    layout: 'fullscreen',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/G6M2gu5qKFvhGxwj3W365b?node-id=4404-4148',
    },
  },
} satisfies Meta<typeof SiteFooter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { settings: chromeSettings, year: 2026 },
}

/**
 * The row is `utilityNavItems` plus `legalLinks`, and a brand that authors
 * neither still gets a footer — the tagline and the copyright are the band.
 */
export const NoLinkRow: Story = {
  args: {
    settings: { ...chromeSettings, utilityNavItems: [], legalLinks: [] } as unknown as Settings,
    year: 2026,
  },
}
