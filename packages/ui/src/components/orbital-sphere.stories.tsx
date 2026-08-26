import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { OrbitalSphere } from './orbital-sphere'

/**
 * The wireframe atom, ported from the official export rather than traced off a
 * raster. See the component's own comment for what the export supersedes and
 * which two readings from the trace survive it.
 *
 * It is `position: absolute` and `aria-hidden` by construction: it is a field a
 * band sits in front of, never a thing on its own. Every placement story
 * therefore supplies the band, and **carries that call site's real values** —
 * these stories are the record of how each band crops the sphere, and the only
 * seam that catches placement drift.
 *
 * The thing to check is the **proportion**, not the numbers: the arcs should run
 * nearly parallel to whatever curve is beneath them. A sphere drawn a sixth too
 * small pulls its arcs up and away, which is the way this has historically
 * drifted — the previous hero story drew it a third small for a whole
 * generation without anything noticing.
 */
const meta = {
  title: 'UI/OrbitalSphere',
  component: OrbitalSphere,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof OrbitalSphere>

export default meta
type Story = StoryObj<typeof meta>

/** The drawing itself, still, at each preset — not a composition any band draws,
 *  but the only way to see the atom rather than a crop of it. */
export const Presets: Story = {
  args: {},
  globals: { backgrounds: { value: 'ink' } },
  render: () => (
    <div className="grid grid-cols-3">
      <div className="bg-ink relative isolate flex h-[360px] items-center justify-center">
        <OrbitalSphere
          preset="hero"
          className="left-1/2 top-1/2 w-[220px] -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      <div className="bg-ink-deep relative isolate flex h-[360px] items-center justify-center">
        <OrbitalSphere
          preset="background"
          className="left-1/2 top-1/2 w-[220px] -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      <div className="bg-bone relative isolate flex h-[360px] items-center justify-center">
        <OrbitalSphere
          preset="line"
          className="left-1/2 top-1/2 w-[220px] -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
  ),
}

/** The same atom turning, with the coloured great circles breathing against it.
 *  `still` is the default deliberately — a decorative background that turns
 *  forever is what `prefers-reduced-motion` is about, so a band asks for motion
 *  rather than opting out of it. */
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

/** Two on one page. The export found its host by a hardcoded global element id,
 *  so the second one never drew; this is the story that would have caught it. */
export const TwoOnAPage: Story = {
  args: { motion: 'orbit' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink relative isolate flex h-[420px] items-center justify-around overflow-hidden">
      <OrbitalSphere
        {...args}
        preset="hero"
        className="left-[8%] top-1/2 w-[280px] -translate-y-1/2"
      />
      <OrbitalSphere
        {...args}
        preset="background"
        className="right-[8%] top-1/2 w-[280px] -translate-y-1/2"
      />
    </div>
  ),
}

/* ---------------------------------------------------------------------------
 * The real call sites. Values below are copied from the renderers, not invented.
 * ------------------------------------------------------------------------- */

/** The Home opener. The sphere is 133.75% of the frame width, hung so only its
 *  cap shows, on a band that closes on a hard edge. The ratio deliberately does
 *  not carry to 402 — see the component comment. */
export const HomeOpener: Story = {
  args: { preset: 'hero', motion: 'orbit' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink relative isolate h-[520px] overflow-hidden">
      <OrbitalSphere
        {...args}
        className="bottom-[-124vw] left-1/2 w-[165vw] -translate-x-1/2 lg:bottom-[-111.3vw] lg:w-[133.75vw]"
      />
    </div>
  ),
}

/** The interior hero on ink — the red globe, off the band's right shoulder. */
export const InteriorHeroInk: Story = {
  args: { preset: 'hero', motion: 'orbit' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink relative isolate h-[520px] overflow-hidden">
      <OrbitalSphere
        {...args}
        className="left-[205px] top-[184px] -z-10 w-[918px] lg:left-auto lg:right-[-117px]"
      />
    </div>
  ),
}

/** The interior hero on bone — the line drawing, most of it past the right edge
 *  with the arcs crossing the copy's right shoulder. */
export const InteriorHeroBone: Story = {
  args: { preset: 'line', motion: 'orbit' },
  globals: { backgrounds: { value: 'bone' } },
  render: (args) => (
    <div className="bg-bone relative isolate h-[520px] overflow-hidden">
      <OrbitalSphere
        {...args}
        className="left-[171px] top-[178px] -z-10 w-[720px] lg:left-auto lg:right-[-147px] lg:top-[98px]"
      />
    </div>
  ),
}

/** The closing CTA band — centred so the band shows the sphere's underside. */
export const CtaBand: Story = {
  args: { preset: 'hero', motion: 'orbit' },
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

/** The pull quote's pair, on bone, both `lg:` only — the 402 frame has room for
 *  neither. This is the band where the `line` preset has to hold up. */
export const PullQuotePair: Story = {
  args: { preset: 'line' },
  globals: { backgrounds: { value: 'bone' } },
  render: (args) => (
    <div className="bg-bone relative isolate h-[560px] overflow-hidden">
      <OrbitalSphere
        {...args}
        className="-z-10 hidden lg:left-[-563px] lg:top-[258px] lg:block lg:w-[1155px]"
      />
      <OrbitalSphere
        {...args}
        className="-z-10 hidden lg:left-[734px] lg:top-[643px] lg:block lg:w-[1304px]"
      />
    </div>
  ),
}
