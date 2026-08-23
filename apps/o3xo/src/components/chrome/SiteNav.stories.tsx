import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SiteNav } from './SiteNav'
import type { NavGroup, Settings } from './navItems'

/**
 * A stand-in for the Site Settings document, holding one of each thing the bar
 * can be handed: a group whose cards carry no eyebrow, a group whose cards do,
 * a plain link, and the bar's button.
 *
 * Written out rather than read off `tools/migration/data-o3xo/` — a story runs
 * in a browser and cannot reach the disk, and the committed document is
 * already the render test's subject. What a story is for is the paint.
 */
export const chromeSettings = {
  title: 'O3XO',
  navItems: [
    {
      _type: 'navGroup',
      _key: 'nav-industries',
      label: 'Industries',
      items: [
        {
          _type: 'navGroupItem',
          _key: 'a',
          button: { _type: 'button', label: 'Construction', href: '/industries/construction' },
          excerpt: 'Project lifecycle automation',
        },
        {
          _type: 'navGroupItem',
          _key: 'b',
          button: {
            _type: 'button',
            label: 'Industrial services',
            href: '/industries/industrial-services',
          },
          excerpt: 'Operational efficiency',
        },
      ],
      button: { _type: 'button', label: 'View all industries', href: '/industries' },
    },
    {
      _type: 'navGroup',
      _key: 'nav-case-studies',
      label: 'Case studies',
      items: [
        {
          _type: 'navGroupItem',
          _key: 'c',
          button: {
            _type: 'button',
            label: 'Buffalo Construction',
            href: '/case-studies/buffalo-construction',
          },
          eyebrow: 'Construction',
          excerpt: 'AI-powered construction operations',
        },
        {
          _type: 'navGroupItem',
          _key: 'd',
          button: { _type: 'button', label: 'Tyndale', href: '/case-studies/tyndale' },
          eyebrow: 'Industrial services',
          excerpt: 'AI-driven product insight',
        },
      ],
      button: { _type: 'button', label: 'View all case studies', href: '/case-studies' },
    },
    { _type: 'button', _key: 'nav-insights', label: 'Insights', href: '/insights' },
  ],
  primaryButton: { _type: 'button', label: 'Contact', href: '/contact', icon: 'none' },
  footerTagline: 'Transforming businesses through intelligent AI implementation.',
  utilityNavItems: [
    { _type: 'button', _key: 'u1', label: 'O3 World', href: 'https://www.o3world.com/' },
    { _type: 'button', _key: 'u2', label: '1682', href: 'https://www.1682conference.com/' },
  ],
  legalLinks: [
    {
      _type: 'button',
      _key: 'l1',
      label: 'Privacy policy',
      href: 'https://www.o3world.com/privacy-policy/',
    },
  ],
  legalName: 'O3 World, LLC',
} as unknown as Settings

export const industriesGroup = (chromeSettings.navItems ?? [])[0] as NavGroup
export const caseStudiesGroup = (chromeSettings.navItems ?? [])[1] as NavGroup

/**
 * O3XO's nav bar — the kit's `Navigation` (`4404:4146`).
 *
 * **The brand is pinned**, like every story in this app: the bar reaches for
 * `accent` through its mark and its focus rings, and `accent` is a role only
 * O3XO's token package declares (ADR 0028). The Brand toolbar stays live on
 * the shared-package stories, where flipping it is the paint-leak test.
 *
 * A dropdown opens on hover or on Enter, and a story cannot do either — what
 * is inside one is `NavPanel`'s story, and that a closed trigger says so is
 * `chrome.render.test.tsx`'s.
 */
const meta = {
  title: 'Chrome/SiteNav',
  component: SiteNav,
  globals: { brand: 'o3xo' },
  parameters: {
    layout: 'fullscreen',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/G6M2gu5qKFvhGxwj3W365b?node-id=4404-4146',
    },
  },
} satisfies Meta<typeof SiteNav>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The bar over a band, which is the only place it is ever seen. The band is
 * black because the site's first band is: the bar is opaque either way, which
 * is the whole reason it has no second skin to flip into.
 */
export const OverAHero: Story = {
  args: { settings: chromeSettings },
  render: (args) => (
    <div className="bg-ink-deep min-h-[320px]">
      <SiteNav {...args} />
      <div className="px-gutter max-w-section text-hero mx-auto py-16 text-white">
        Activate AI advantage
      </div>
    </div>
  ),
}

/** A brand with no button authored still gets a bar. */
export const NoButton: Story = {
  args: { settings: { ...chromeSettings, primaryButton: null } as Settings },
  render: (args) => (
    <div className="bg-ink-deep min-h-[200px]">
      <SiteNav {...args} />
    </div>
  ),
}
