import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { SITE_SETTINGS } from '@/stories/seedContent'

import { SiteFooter } from './SiteFooter'

/**
 * The footer, built to the canonical Home frame's `Footer` (`1680:2096`,
 * mobile `1814:1784`) — **not** to the `Footer` component on the Local
 * Components canvas (`1280:1885`), which #38 found stale: `#141414` against
 * the frame's `#030303`, and 64px of top padding against 96.
 *
 * Rendered from the real committed Site Settings document. Every string comes
 * from data (#19); the component decides only the year and the arrangement —
 * so the stories that matter are the ones where a group is missing, because
 * that is the only thing the component gets to have an opinion about.
 *
 * Figma draws three peer columns — Company, Socials, Everything else. Socials
 * is a separate schema field rather than a `footerGroup` (its links are
 * external and need `rel="noreferrer"`), so it is spliced into the frame's
 * position rather than appended after the authored groups. `OneGroup` is where
 * that splice is visible.
 */
const meta = {
  title: 'Chrome/SiteFooter',
  component: SiteFooter,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1680:2096'),
  },
  args: { settings: SITE_SETTINGS },
  globals: { backgrounds: { value: 'ink' } },
} satisfies Meta<typeof SiteFooter>

export default meta
type Story = StoryObj<typeof meta>

export const AsAuthored: Story = {}

/** `1814:1784` — the 402 arrangement. */
export const Mobile: Story = {
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'mobile' } },
}

/** One authored group: Socials still has to land in the frame's middle column. */
export const OneGroup: Story = {
  args: {
    settings: SITE_SETTINGS
      ? { ...SITE_SETTINGS, footerGroups: (SITE_SETTINGS.footerGroups ?? []).slice(0, 1) }
      : SITE_SETTINGS,
  },
}

/** No social links — the middle column has nothing to fill it. */
export const NoSocials: Story = {
  args: { settings: SITE_SETTINGS ? { ...SITE_SETTINGS, socialLinks: [] } : SITE_SETTINGS },
}

/** No tagline — the block above the columns must close rather than hang. */
export const NoTagline: Story = {
  args: { settings: SITE_SETTINGS ? { ...SITE_SETTINGS, footerTagline: null } : SITE_SETTINGS },
}

/**
 * Nothing authored at all — a fresh dataset. The legal line falls back to the
 * site title, and the footer must remain a footer rather than a black strip.
 */
export const Unauthored: Story = {
  args: {
    settings: SITE_SETTINGS
      ? {
          ...SITE_SETTINGS,
          footerTagline: null,
          footerGroups: [],
          socialLinks: [],
          legalLinks: [],
        }
      : SITE_SETTINGS,
  },
}
