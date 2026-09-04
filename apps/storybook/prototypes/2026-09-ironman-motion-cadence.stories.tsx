import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PrototypeFrame, prototypeParameters } from './frame'

/**
 * **The question this answers:** can the existing native motion stack give a
 * real case study an authored cadence without hiding server content, turning
 * the page into a scroll-controlled presentation, or adding a route runtime?
 *
 * The current IRONMAN composition is the tracer: two chapters, a contained
 * photograph, a page capture, and a four-screen grid. The prototype gives
 * each content shape one semantic sequence:
 *
 * - a chapter opens with its heading group and lead paragraph; later prose
 *   stays still, and the details arrive as one compact group at their own
 *   viewport boundary, after the long prose;
 * - every media surface is painted before its foreground arrives;
 * - the screen-grid lead arrives first and the supporting screens follow in
 *   reading order, while the grid remains normal document flow.
 *
 * It uses only CSS animations, one pooled `IntersectionObserver`, and a
 * scroll-coalesced `requestAnimationFrame`. The on-page review dock can force
 * reduced motion, replay the sequence, and jump from top to bottom to prove
 * rapid scrolling settles skipped scenes. The Still mode gives a comparison
 * against the same content without entrances. The stage/image pairs already
 * exist in the published composition; the raster images themselves are flat,
 * so this does not invent independently authored photographic layers.
 *
 * **What decides it:** the desktop, mobile, reduced-motion, and rapid-scroll
 * reviews. Native wins if all content remains readable, skipped scenes settle,
 * and the three sequences feel deliberately related without pinning or scroll
 * interception.
 *
 * **What supersedes it:** the narrative implementation from #430, or a later
 * capture that demonstrates a named native failure and compares a scoped
 * specialist runtime against this exact tracer. Figma remains the source of
 * record for composition and values; this capture records motion sequence and
 * the runtime decision only.
 */
const meta = {
  title: 'Prototypes/IRONMAN — native narrative cadence (Sep 2026)',
  component: PrototypeFrame,
  parameters: prototypeParameters,
} satisfies Meta<typeof PrototypeFrame>

export default meta
type Story = StoryObj<typeof meta>

const set = '2026-09-ironman-motion-cadence'
const captured = 'September 2026'

export const NativeMotion: Story = {
  args: {
    set,
    page: 'index.html',
    label: 'IRONMAN — native narrative cadence (#426)',
    captured,
  },
}

export const ReducedMotion: Story = {
  args: {
    set,
    page: 'index.html?motion=reduce',
    label: 'IRONMAN — forced reduced motion',
    captured,
  },
}

export const StillBaseline: Story = {
  args: {
    set,
    page: 'index.html?motion=still',
    label: 'IRONMAN — same composition without entrances',
    captured,
  },
}

export const RapidScrollProof: Story = {
  args: {
    set,
    page: 'index.html?autotest=rapid',
    label: 'IRONMAN — rapid-scroll settlement proof',
    captured,
  },
}
