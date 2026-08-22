import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'
import { BrandMark } from '@o3/ui'

import { SITE_SETTINGS } from '../testing/seedContent'

import { SiteNav } from './SiteNav'
import { UtilityNav } from './UtilityNav'

/**
 * Figma's `Utility Nav` (`2250:1445`), rendered from the **real committed Site
 * Settings document** — like the rest of the chrome, it is authored entirely in
 * data, so a fixture here would be testing the fixture.
 *
 * Three brand properties, none of them highlighted: the frame gives all three
 * links the same fill, so being on O3 World is not a state the strip draws.
 * Hover takes brand red.
 *
 * The strip is in flow and desktop-only. `WithTheNav` is the story worth
 * looking at — it is the only place the 14px gap between the strip and the
 * pinned pill is visible, and that gap is what fixes the pill at `top: 64px`.
 */
const meta = {
  title: 'Chrome/UtilityNav',
  component: UtilityNav,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('2250:1445'),
  },
  args: { settings: SITE_SETTINGS },
} satisfies Meta<typeof UtilityNav>

export default meta
type Story = StoryObj<typeof meta>

/** The strip alone, over the hero band it sits above on every route. */
export const Default: Story = {
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink h-[240px]">
      <UtilityNav {...args} />
    </div>
  ),
}

/** The chrome as the Home frame draws it: strip, 14px, pill. */
export const WithTheNav: Story = {
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink h-[420px]">
      <UtilityNav {...args} />
      <SiteNav settings={args.settings} brandMark={<BrandMark size={64} />} />
    </div>
  ),
}

/** 402: mobile Home has no strip at all, so there is nothing to see. */
export const Mobile: Story = {
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'mobile' } },
  render: (args) => (
    <div className="bg-ink h-[240px]">
      <UtilityNav {...args} />
      <SiteNav settings={args.settings} brandMark={<BrandMark size={64} />} />
    </div>
  ),
}
