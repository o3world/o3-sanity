import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { figmaDesign } from '@o3/story-kit'

import '@/components/globe/scene.css'

import { PageMockup } from '../PageMockup'

/**
 * `/` — the canonical Home frame (`3720:60473`, mobile `1814:1618`).
 *
 * Eight bands off `data/seed/page/index.json`, in the seed's order: the
 * orbital hero, the partners strip, the case showcase, the pull quote, the two
 * rail-panel bands, the insights carousel and the closing CTA.
 *
 * The **surface sequence** is the thing this story shows that no block story
 * can: ink → warm wash → wash → bone → white → white → bone → ink. Every step
 * in it is a hard edge, the way both frames draw them, and the CTA band's fade
 * strip only works because the footer under it is black. Those are page
 * properties; change one band's surface and this is where it shows.
 */
const meta = {
  title: 'Pages/Home',
  component: PageMockup,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('3720:60473'),
  },
} satisfies Meta<typeof PageMockup>

export default meta
type Story = StoryObj<typeof meta>

async function expectAlignedNavMark(canvasElement: HTMLElement, targetSize: number, leftInset = 0) {
  const home = within(canvasElement).getByRole('link', { name: / home$/ })
  const target = home.getBoundingClientRect()
  const paths = Array.from(home.querySelectorAll('svg path'), (path) =>
    path.getBoundingClientRect(),
  ).filter((box) => box.width > 0)
  const left = Math.min(...paths.map((path) => path.left))
  const right = Math.max(...paths.map((path) => path.right))
  await expect(left - target.left).toBeCloseTo(leftInset, 1)
  if (targetSize === 48) {
    await expect(Math.min(...paths.map((path) => path.top)) - target.top).toBeCloseTo(8.59, 1)
  }
  await expect(right - left).toBeCloseTo(38.84, 0)
  await expect(target.width).toBe(targetSize)
  await expect(target.height).toBe(targetSize)
}

export const Desktop: Story = {
  args: { page: 'index' },
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    await expectAlignedNavMark(canvasElement, 80, 24.6)
    // Figma's autosized Newsreader line is 1076px (3720:60482). A weight-only
    // font fixes optical size at 16 and incorrectly narrows it to 1030px.
    // Allow 6px for browser/platform text metrics (Linux CI differs by 4px).
    await document.fonts.ready
    const heroLine = canvasElement.querySelector('.hero-lead h1 > span > span')!
    await expect(Math.abs(heroLine.getBoundingClientRect().width - 1076)).toBeLessThan(6)
    const cardCopy = canvasElement.querySelectorAll(
      '.rounded-case-card h3, .rounded-case-card .text-display-xl',
    )
    await expect(cardCopy.length).toBeGreaterThan(0)
    for (const node of cardCopy) {
      await expect(getComputedStyle(node).fontFamily).toContain('Figtree')
    }
    const footerStatement = canvasElement.querySelector('footer .text-display-xl')!
    await expect(getComputedStyle(footerStatement).fontFamily).toContain('Newsreader')
  },
}

/**
 * `1814:1618`. Every composition switch in the page fires between these two
 * stories — the nav switches from a content-aligned pill to a full-width bar, the hero
 * goes flush left, the partners strip wraps to two plates across instead of
 * clipping one row of six, and the rail panels restack. ADR 0006 is the record
 * of which of those are deliberate.
 */
export const Mobile: Story = {
  args: { page: 'index' },
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('1814:1618') },
  play: async ({ canvasElement }) => expectAlignedNavMark(canvasElement, 48, 8.6),
}

/** The app's capped sphere must remain inside the hero crop on large monitors. */
export const WideGlobe: Story = {
  args: { page: 'index' },
  globals: { viewport: { value: 'ultrawide' } },
  parameters: {
    viewport: {
      options: {
        ultrawide: { name: 'Wide desktop', styles: { width: '2560px', height: '1100px' } },
      },
    },
  },
  render: (args) => (
    <div data-spatial-layout>
      <PageMockup {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const hero = canvasElement.querySelector('.hero-band')!.getBoundingClientRect()
    const globe = canvasElement.querySelector('.hero-lag > div')!.getBoundingClientRect()
    await expect(globe.width).toBeLessThanOrEqual(1728)
    await expect(hero.bottom - globe.top).toBeCloseTo(288, 0)
  },
}
