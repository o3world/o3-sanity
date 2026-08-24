import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { OrbitalSphere } from './orbital-sphere'

/**
 * The wireframe globe, drawn rather than exported — both canonical frames
 * carry it as a flattened raster (one with the headline baked in, one with a
 * mouse cursor in the middle of it), so neither is shippable. See the
 * component's own comment for how the geometry was recovered.
 *
 * It is `position: absolute` and `aria-hidden` by construction: it is a field
 * a band sits in front of, never a thing on its own. Every story therefore
 * supplies the band — the sizing and the offsets in each `className` are the
 * real call sites' values, so these stories are the record of how each band
 * actually crops the sphere.
 *
 * The thing to check is the **proportion**, not the numbers: the arcs should
 * run nearly parallel to whatever curve is beneath them. A sphere drawn a
 * sixth too small pulls its arcs up and away, which is the way this has
 * historically drifted.
 */
const meta = {
  title: 'UI/OrbitalSphere',
  component: OrbitalSphere,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof OrbitalSphere>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The Home hero (`1810:1616`) — 95.5% of the frame width, hung so only the cap
 * shows, and the band closing on a hard edge the way `2089:4316` draws it.
 * `motion="orbit"`, which is what the hero asks for.
 */
export const HeroCap: Story = {
  args: { motion: 'orbit' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink relative isolate h-[520px] overflow-hidden">
      <OrbitalSphere
        {...args}
        className="bottom-[-124vw] left-1/2 w-[165vw] -translate-x-1/2 lg:bottom-[-77.1vw] lg:w-[95.5vw]"
      />
    </div>
  ),
}

/**
 * The closing CTA band (`1799:1470`) — the same sphere at the same scale, but
 * centred so the band shows its underside, and run at `soft` so the copy on
 * top of it stays the brightest thing in the band.
 */
export const CtaBand: Story = {
  args: { intensity: 'soft', motion: 'orbit' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink-deep relative isolate h-[520px] overflow-hidden">
      <OrbitalSphere
        {...args}
        className="bottom-[4%] left-1/2 w-[150vw] -translate-x-1/2 lg:w-[90vw]"
      />
    </div>
  ),
}

/**
 * `tone="light"` — the pull quote (`1683:2139`) and the About hero draw the
 * same sphere as fine dark line-art with **no bloom**. The glow belongs to the
 * dark bands only, which is the whole distinction this prop exists to hold.
 */
export const LightTone: Story = {
  args: { tone: 'light' },
  globals: { backgrounds: { value: 'bone' } },
  render: (args) => (
    <div className="bg-bone relative isolate h-[520px] overflow-hidden">
      <OrbitalSphere
        {...args}
        className="left-1/2 top-1/2 w-[560px] -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  ),
}

/**
 * The whole sphere, still, at `full` — not a composition any frame draws, but
 * the only way to see the drawing itself: the lit limb, the four great
 * circles, and the node dots on the paths.
 *
 * `still` is the default deliberately. A decorative background that turns
 * forever is exactly what `prefers-reduced-motion` is about, so a band has to
 * ask for `orbit` rather than opt out of it.
 */
export const WholeSphere: Story = {
  args: {},
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink relative isolate flex h-[560px] items-center justify-center overflow-hidden">
      <OrbitalSphere
        {...args}
        className="left-1/2 top-1/2 w-[440px] -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  ),
}

/** The same drawing turning — one revolution a minute, with the two coloured
 *  great circles breathing against it. */
export const Turning: Story = {
  args: { motion: 'orbit' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink relative isolate flex h-[560px] items-center justify-center overflow-hidden">
      <OrbitalSphere
        {...args}
        className="left-1/2 top-1/2 w-[440px] -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  ),
}
