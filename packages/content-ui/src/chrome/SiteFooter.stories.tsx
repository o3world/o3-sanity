import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { figmaDesign } from '@o3/story-kit'
import { BrandMark } from '@o3/ui'

import { SITE_SETTINGS, STORY_YEAR } from '../testing/seedContent'

import { SiteFooter } from './SiteFooter'

/** Current footer with authored links and app-owned companion-brand marks. */
const meta = {
  title: 'Chrome/SiteFooter',
  component: SiteFooter,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('3720:62172'),
  },
  // The mark comes from the app (#228) — O3's here, tight-bounded and taking
  // the footer's white through `currentColor` (`1280:1856`).
  args: {
    settings: SITE_SETTINGS,
    brandMark: <BrandMark trim size={128} className="lg:size-[148px]" />,
    year: STORY_YEAR,
  },
  globals: { backgrounds: { value: 'ink' } },
} satisfies Meta<typeof SiteFooter>

export default meta
type Story = StoryObj<typeof meta>

export const AsAuthored: Story = {
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const footer = canvasElement.querySelector('footer')!
    await expect(getComputedStyle(footer).paddingTop).toBe('128px')
    await expect(getComputedStyle(footer).paddingBottom).toBe('64px')
    const nav = within(canvasElement).getByRole('navigation', { name: 'Footer' })
    const copy = nav.parentElement!
    await expect(copy.getBoundingClientRect().width).toBe(628)
    await expect(copy.getBoundingClientRect().left - footer.getBoundingClientRect().left).toBe(716)
    await expect(getComputedStyle(copy).gap).toBe('32px')
    await expect(getComputedStyle(nav).gap).toBe('32px')
    await expect(getComputedStyle(copy.parentElement!).paddingBottom).toBe('43px')
    const watermarks = footer.querySelectorAll(':scope > svg')
    await expect(watermarks.length).toBe(2)
    await expect(
      watermarks[0]!.getBoundingClientRect().left - footer.getBoundingClientRect().left,
    ).toBe(-149)
    await expect(
      watermarks[1]!.getBoundingClientRect().left - footer.getBoundingClientRect().left,
    ).toBe(931)
  },
}

export const PropertyLogos: Story = {
  args: { utilityNavItems: SITE_SETTINGS?.utilityNavItems },
}

/** Current mobile footer (3726:68508). */
export const Mobile: Story = {
  args: { utilityNavItems: SITE_SETTINGS?.utilityNavItems },
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'mobile' } },
  parameters: {
    design: figmaDesign('3726:68508'),
    viewport: {
      options: { mobile: { name: 'Mobile', styles: { width: '402px', height: '874px' } } },
    },
  },
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'Footer' })
    const copy = nav.parentElement!
    const upper = copy.parentElement!
    const container = upper.parentElement!
    await expect(getComputedStyle(upper).gap).toBe('24px')
    await expect(getComputedStyle(copy).gap).toBe('64px')
    await expect(getComputedStyle(container).gap).toBe('64px')
    await expect(getComputedStyle(nav).paddingBottom).toBe('32px')
    const footer = nav.closest('footer')!
    const watermarks = footer.querySelectorAll(':scope > svg')
    await expect(
      watermarks[0]!.getBoundingClientRect().left - footer.getBoundingClientRect().left,
    ).toBe(-668)
    await expect(
      watermarks[1]!.getBoundingClientRect().left - footer.getBoundingClientRect().left,
    ).toBe(412)
    const company = nav.children[0]!.getBoundingClientRect()
    const socials = nav.children[1]!.getBoundingClientRect()
    const brands = nav.children[2]!.getBoundingClientRect()
    await expect(company.width).toBe(169)
    await expect(socials.top).toBe(company.top)
    await expect(socials.left - company.right).toBe(32)
    await expect(brands.top - Math.max(company.bottom, socials.bottom)).toBe(64)
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
  },
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
