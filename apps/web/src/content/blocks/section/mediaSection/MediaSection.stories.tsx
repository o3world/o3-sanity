import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '@/stories/seedContent'

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
  args: { ...seededSectionArgs('ventures-urvin', 'mediaSection'), media: undefined },
}
