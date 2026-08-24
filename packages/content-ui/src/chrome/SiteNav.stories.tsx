import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'
import { BrandMark } from '@o3/ui'

import { SITE_SETTINGS } from '../testing/seedContent'

import { SiteNav } from './SiteNav'

/**
 * Figma's `NavBar` (`2225:2920`), rendered from the **real committed Site
 * Settings document** rather than a fixture — the chrome is authored entirely
 * in data, so a fixture here would be testing the fixture.
 *
 * The bar is `position: fixed` at every width, which makes it awkward to look
 * at on its own: with nothing under it there is nothing for it to float over.
 * Each story therefore supplies a band, and the bands are chosen to exercise
 * the one behaviour that only exists in a browser —
 *
 * ── THE INK FLIP ───────────────────────────────────────────────────────────
 *
 * `NavInk` hit-tests what is under the bar's midpoint on every scroll frame
 * and sets `data-ink="dark"` on the header when it finds a light surface. The
 * default — and everything SSR and no-JS ever sees — is the dark scrim with
 * white copy. `ScrollsOverBands` is the story that actually shows the flip;
 * scroll it.
 *
 * Two widths, structurally different (ADR 0006): a 900 × 80 bar at 1440 with a
 * 12px corner, a full-width square bar at 402 with the links behind
 * "Open menu".
 *
 * The button is **`Theme=White` on both skins** and is the one thing on the bar
 * that does not move. The bar declares itself an `ink` surface and the button's
 * Auto contrast reads it (#147), so the fill is the frame's rather than a
 * chrome override — and it does not follow the flip, because contrast resolves
 * from a declared surface and the flip is a read of what is passing under.
 */
const meta = {
  title: 'Chrome/SiteNav',
  component: SiteNav,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('2225:2920'),
  },
  // The mark comes from the app (#228). These stories are the O3 chrome —
  // their frames are O3's — so they render what `apps/web` hands the bar, and
  // it is `currentColor`, which is what makes the flip below carry it.
  args: { settings: SITE_SETTINGS, brandMark: <BrandMark size={64} className="lg:size-12" /> },
} satisfies Meta<typeof SiteNav>

export default meta
type Story = StoryObj<typeof meta>

/** The default skin: white copy on the `bg-scrim` pill, over an ink band. */
export const OverInk: Story = {
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink h-[420px]">
      <SiteNav {...args} />
    </div>
  ),
}

/** The flipped skin: over bone, the bar takes `--color-fg` and inverts its hairline. */
export const OverBone: Story = {
  globals: { backgrounds: { value: 'bone' } },
  render: (args) => (
    <div className="bg-bone h-[420px]">
      <SiteNav {...args} />
    </div>
  ),
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

/** 402: a full-width square bar, button beside the two-bar hamburger. */
export const Mobile: Story = {
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'mobile' } },
  render: (args) => (
    <div className="bg-ink h-[420px]">
      <SiteNav {...args} />
    </div>
  ),
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
