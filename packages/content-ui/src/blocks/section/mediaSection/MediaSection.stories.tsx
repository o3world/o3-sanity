import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '../../../testing/seedContent'

import { MediaSection } from './MediaSection'

/**
 * A full-width figure moment, built to the Case Study frame's two media
 * treatments (#44) — the only canonical frame that draws this block.
 *
 * | `variant` / `width`    | Frame                    | Shape                              |
 * | ---------------------- | ------------------------ | ---------------------------------- |
 * | `plain` / `full-bleed` | `1647:1721` / `1906:900` | edge to edge, 1440 × 576           |
 * | `plain` / `contained`  | `1899:4186`              | the 822px article measure + shadow |
 * | `capture`              | `1647:1720`              | a 700px dark stage that crops      |
 *
 * `contained` sits on the **article measure**, not `--container-content`: the
 * frame lines a contained figure up with the chapter prose around it, not with
 * the wider statement column.
 *
 * **Neither variant pads its own top.** The frame lets the band above supply
 * the air, so a story showing this block alone will look top-tight — that is
 * correct, and `Pages/Ventures` is where the spacing is honestly judged.
 */
const meta = {
  title: 'Content/Blocks/Section/MediaSection',
  component: MediaSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1647:1721'),
  },
} satisfies Meta<typeof MediaSection>

export default meta
type Story = StoryObj<typeof meta>

/** As seeded on `/ventures/urvin` — the one seeded instance of this block. */
export const AsSeeded: Story = {
  args: seededSectionArgs('ventures-urvin', 'mediaSection'),
}

/** Edge to edge — the treatment that has to escape `SectionShell`'s gutter. */
export const FullBleed: Story = {
  args: { ...seededSectionArgs('ventures-urvin', 'mediaSection'), width: 'full-bleed' },
}

/** The 822px article measure, with the `0 0 64px rgba(0,0,0,0.1)` lift. */
export const Contained: Story = {
  args: { ...seededSectionArgs('ventures-urvin', 'mediaSection'), width: 'contained' },
  parameters: { design: figmaDesign('1899:4186') },
}

/** `1906:900` — full-bleed at 402, where the box is 402 × 257. */
export const FullBleedMobile: Story = {
  args: { ...seededSectionArgs('ventures-urvin', 'mediaSection'), width: 'full-bleed' },
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('1906:900') },
}

/**
 * `1647:1720` (#97) — the capture. A tall page screenshot hung 64px from the
 * top of a full-bleed dark stage, which then **crops it at the band's floor**:
 * the picture is meant to run past the bottom edge, so a story where it fits
 * would be showing the wrong thing. `width` is ignored here (Studio hides it),
 * which is what this story pins.
 */
export const Capture: Story = {
  args: {
    ...seededSectionArgs('ventures-urvin', 'mediaSection'),
    variant: 'capture',
    width: 'contained',
  },
  parameters: { design: figmaDesign('1647:1720') },
}

/** The capture stage at 402, where the band shortens rather than scaling. */
export const CaptureMobile: Story = {
  args: { ...seededSectionArgs('ventures-urvin', 'mediaSection'), variant: 'capture' },
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('1647:1720') },
}

/** On ink — the contained shadow is authored for a light band. */
export const ContainedOnInk: Story = {
  args: {
    ...seededSectionArgs('ventures-urvin', 'mediaSection'),
    width: 'contained',
    surface: 'ink',
  },
  globals: { backgrounds: { value: 'ink' } },
}

/**
 * No media. The block is a picture and nothing else, so an empty one must
 * render nothing rather than an empty box holding the band's padding open.
 */
export const NoMedia: Story = {
  args: { ...seededSectionArgs('ventures-urvin', 'mediaSection'), media: null },
}

/** Scroll into the authored composition; reduced motion leaves the same layout still. */
export const Sequence: Story = {
  args: { ...Capture.args, sequence: true },
  decorators: [
    (Story) => (
      <div>
        <div className="min-h-screen" />
        <Story />
        <div className="h-screen" />
      </div>
    ),
  ],
}

/** About inset photo lifts above the band without clipping the next section. */
export const Overlap: Story = {
  args: { ...AsSeeded.args, variant: 'overlap', width: 'section' },
  globals: { viewport: { value: 'desktop' } },
  parameters: { design: figmaDesign('3754:78276') },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('figure > div')!
    await expect(panel.getBoundingClientRect().height).toBeCloseTo(550, 0)
    await expect(getComputedStyle(panel).translate).toBe('0px -64px')
  },
}

export const Feature: Story = {
  args: {
    ...AsSeeded.args,
    variant: 'feature',
    surface: 'white',
    heading: 'Philly made.',
    subheading:
      'We’re proud of where we started and it shows up in how we work. Straightforward conversations, practical thinking, zero pretense.\u2028A lot of grit. A little edge.',
    media: {
      _type: 'figure',
      alt: 'Philadelphia skyline',
      image: {
        _type: 'image',
        asset: {
          _id: 'image-dc7f93c6b2e336d44316689f85578229a01223dd-1248x550-png',
          metadata: null,
        },
      },
    },
    logo: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: 'image-8e867702ffba83004e58a7ee4b5beaaa4c5c9b6c-873x181-svg',
      },
    },
    badge: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: 'image-8ad65e117756cfc5a9059c89c2766b889df36470-314x36-svg',
      },
    },
  },
  globals: { viewport: { value: 'desktop' } },
  parameters: { design: figmaDesign('4061:50283') },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('h2')).toHaveTextContent('Philly made.')
    await expect(canvasElement.querySelector('p')).toHaveTextContent('A little edge.')
    await expect(
      canvasElement.querySelector('figure > div')!.getBoundingClientRect().height,
    ).toBeCloseTo(550, 0)
  },
}

export const FeatureMobile: Story = {
  ...Feature,
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('3883:16517') },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('figure > div')!
    await expect(panel.getBoundingClientRect().width).toBeCloseTo(343, 0)
    await expect(panel.getBoundingClientRect().height).toBeGreaterThanOrEqual(383)
    await expect(canvasElement.querySelector('p')).toHaveTextContent('A little edge.')
  },
}
