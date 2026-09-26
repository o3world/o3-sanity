import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { usePathname } from '@storybook/nextjs-vite/navigation.mock'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { figmaDesign } from '@o3/story-kit'
import { BrandMark } from '@o3/ui'

import { SITE_SETTINGS } from '../testing/seedContent'

import { SiteNav } from './SiteNav'

/** Current Figma navigation, with the site's authored links and destinations. */
const meta = {
  title: 'Chrome/SiteNav',
  component: SiteNav,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('3271:17013'),
  },
  // The mark comes from the app (#228). These stories are the O3 chrome —
  // their frames are O3's — so they render what `apps/web` hands the bar, and
  // it is `currentColor`, which is what makes the flip below carry it.
  args: { settings: SITE_SETTINGS, brandMark: <BrandMark size={64} className="-m-2" /> },
} satisfies Meta<typeof SiteNav>

export default meta
type Story = StoryObj<typeof meta>

/** The desktop pill shares the hero's inner content measure. */
export const AlignedWithContent: Story = {
  globals: { viewport: { value: 'desktop' } },
  render: (args) => (
    <div className="bg-ink px-gutter h-[420px] pt-64">
      <SiteNav {...args} />
      <div data-content-stage className="max-w-content mx-auto h-12 w-full bg-white/10" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('#site-nav > nav')!
    const bounds = nav.getBoundingClientRect()
    await expect(bounds.left).toBeCloseTo(
      (document.documentElement.clientWidth - bounds.width) / 2,
      0,
    )
    await expect(bounds.height).toBe(80)
    await expect(getComputedStyle(nav).borderTopLeftRadius).toBe('12px')
    const home = within(canvasElement).getByRole('link', { name: / home$/ })
    await expect(home.getBoundingClientRect().left).toBe(32)
    await expect(home.getBoundingClientRect().width).toBe(80)
    await expect(getComputedStyle(home).transitionDuration).toBe(
      getComputedStyle(nav).transitionDuration,
    )
    await expect(getComputedStyle(home).transitionProperty).toBe(
      getComputedStyle(nav).transitionProperty,
    )
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
    await expect(within(canvasElement).getByRole('link', { name: 'Let’s talk' })).toBeVisible()
  },
}

export const AlignedOnWideScreens: Story = {
  ...AlignedWithContent,
  globals: { viewport: { value: 'wide' } },
  parameters: {
    viewport: {
      options: { wide: { name: 'Wide desktop', styles: { width: '1920px', height: '900px' } } },
    },
  },
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('#site-nav > nav')!.getBoundingClientRect()
    await expect(nav.width).toBeLessThan(900)
    await expect(nav.left).toBeCloseTo((document.documentElement.clientWidth - nav.width) / 2, 0)
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
    await expect(within(canvasElement).getByRole('link', { name: 'Let’s talk' })).toBeVisible()
  },
}

/** The default skin: white copy on the `bg-scrim` pill, over an ink band. */
export const OverInk: Story = {
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: '/' } } },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink h-[420px]">
      <SiteNav {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const home = within(canvasElement).getByRole('link', { name: / home$/ })
    await expect(home).not.toHaveAttribute('aria-current')
    await expect(getComputedStyle(home).color).toBe('rgb(255, 255, 255)')
  },
}

/** The flipped skin: over bone, the bar takes `--color-fg` and inverts its hairline. */
export const OverBone: Story = {
  beforeEach: () => {
    usePathname.mockReturnValue('/work')
    return () => usePathname.mockReset()
  },
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: '/work' } } },
  globals: { backgrounds: { value: 'bone' } },
  render: (args) => (
    <div className="bg-bone h-[420px]">
      <SiteNav {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const home = within(canvasElement).getByRole('link', { name: / home$/ })
    await expect(home).not.toHaveAttribute('aria-current')
    await expect(getComputedStyle(home).color).not.toBe('rgb(235, 16, 0)')
    await expect(within(canvasElement).getByRole('link', { name: 'Work' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  },
}

/**
 * **Scroll this one.** Four full-width bands, alternating ink and light, so
 * the flip fires repeatedly against real surfaces. The narrow white card in
 * the middle band is deliberate: it is light and under the sample point, and
 * it must **not** flip the bar — a 180px element is furniture on a band, not
 * the band, and letting it win reads as a flicker.
 */
export const ScrollsOverBands: Story = {
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div>
      <SiteNav {...args} />
      <div className="bg-ink h-[70vh]" />
      <div className="bg-bone h-[70vh]" />
      <div className="flex h-[70vh] items-center justify-center bg-white">
        <div className="border-line rounded-card w-[180px] border bg-white p-6 text-center">
          Narrow, light, and not the surface.
        </div>
      </div>
      <div className="bg-ink-deep h-[70vh]" />
    </div>
  ),
}

/** 402: the contact action is visible beside the menu trigger. */
export const Mobile: Story = {
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'mobile' } },
  parameters: {
    viewport: {
      options: { mobile: { name: 'Mobile', styles: { width: '402px', height: '874px' } } },
    },
  },
  render: (args) => (
    <div className="bg-ink px-gutter h-[420px] pt-24">
      <SiteNav {...args} />
      <div data-content-stage className="max-w-section mx-auto h-12 w-full bg-white/10" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('#site-nav > nav')!
    await expect(nav.getBoundingClientRect().left).toBe(0)
    await expect(nav.getBoundingClientRect().width).toBe(document.documentElement.clientWidth)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'Let’s talk' })).toBeVisible()
    const trigger = canvas.getByRole('button', { name: 'Open menu' })
    await expect(trigger).toBeVisible()
    await expect(trigger.getBoundingClientRect().width).toBe(48)
    await expect(trigger.getBoundingClientRect().height).toBe(48)
    const icon = trigger.querySelector('svg')!.getBoundingClientRect()
    await expect(icon.width).toBe(20)
    await expect(icon.height).toBe(20)
    await expect(icon.left - trigger.getBoundingClientRect().left).toBe(14)
    await expect(icon.top - trigger.getBoundingClientRect().top).toBe(14)
    await expect(nav.getBoundingClientRect().height).toBe(80)
    await expect(trigger.getBoundingClientRect().right).toBeCloseTo(
      document.documentElement.clientWidth - 16,
      0,
    )
    await userEvent.click(trigger)
    const menu = await within(canvasElement.ownerDocument.body).findByRole('dialog', {
      name: 'Menu',
    })
    const button = within(menu).getByRole('link', { name: 'Let’s talk' })
    await expect(button).toBeVisible()
    await expect(button).toHaveAttribute('href', '/contact')
    await userEvent.click(within(menu).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

/** The collapsed header keeps the same fluid gutter at intermediate widths. */
export const MobileOnTablet: Story = {
  ...Mobile,
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'tablet' } },
  parameters: {
    viewport: {
      options: { tablet: { name: 'Tablet', styles: { width: '772px', height: '874px' } } },
    },
  },
}

/** No primary button authored — the row must close up rather than leave a gap. */
export const WithoutButton: Story = {
  args: { settings: SITE_SETTINGS ? { ...SITE_SETTINGS, primaryButton: null } : SITE_SETTINGS },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink h-[420px]">
      <SiteNav {...args} />
    </div>
  ),
}

/**
 * No nav items. Reachable on a fresh dataset before Site Settings is authored,
 * and the bar must still be a bar — mark and button, not a collapsed strip.
 */
export const WithoutNavItems: Story = {
  args: { settings: SITE_SETTINGS ? { ...SITE_SETTINGS, navItems: [] } : SITE_SETTINGS },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink h-[420px]">
      <SiteNav {...args} />
    </div>
  ),
}

/** Related brands belong in the footer; header interaction never reveals them. */
export const HeaderBrand: Story = {
  ...OverInk,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const home = canvas.getByRole('link', { name: / home$/ })
    await userEvent.hover(home)
    home.focus()
    await expect(canvas.queryByRole('link', { name: 'O3XO' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('link', { name: '1682 Conference' })).not.toBeInTheDocument()
    await expect(home.getBoundingClientRect().width).toBe(80)
    const primary = canvas.getByRole('navigation', { name: 'Primary' }).getBoundingClientRect()
    await expect(home.getBoundingClientRect().right).toBeLessThan(primary.left)
  },
}

export const SmallDesktop: Story = {
  ...HeaderBrand,
  globals: { viewport: { value: 'smallDesktop' } },
  parameters: {
    viewport: {
      options: {
        smallDesktop: { name: 'Small desktop', styles: { width: '1048px', height: '874px' } },
      },
    },
  },
}
