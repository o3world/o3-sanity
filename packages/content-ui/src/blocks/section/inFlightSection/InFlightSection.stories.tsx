import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '../../../testing/seedContent'

import { InFlightSection } from './InFlightSection'

/**
 * The three middle bands of the Live frame (`1644:1889`, mobile `1906:334`).
 *
 * All three are the same entry — a kicker, a title, a lead — in two
 * compositions, which is the `layout` field:
 *
 * | `layout` | Frame                    | The band                        |
 * | -------- | ------------------------ | ------------------------------- |
 * | `cards`  | `1751:1994`              | the work in the studio          |
 * | `rows`   | `1710:1800`, `1732:1409` | the rooms we'll be in · ideas   |
 *
 * **The cards are not case-study references** — the frame draws them anonymous
 * and unlinked on purpose (see the schema comment).
 *
 * Two mobile reads worth knowing before comparing to the 402 frame: the rows
 * drop the disc and the dot and collapse the date onto one line (transcribed),
 * and the frame also drops the **arrow control** — which this renderer keeps,
 * shrunk, because a row whose only affordance disappears is a link nobody can
 * see. ADR 0006 records the divergence.
 */
const meta = {
  title: 'Content/Blocks/Section/InFlightSection',
  component: InFlightSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1644:1889'),
  },
} satisfies Meta<typeof InFlightSection>

export default meta
type Story = StoryObj<typeof meta>

/** "The work in the studio" — `layout: cards`, with the square media. */
export const Cards: Story = {
  args: seededSectionArgs('live', 'inFlightSection', 0),
  parameters: { design: figmaDesign('1751:1994') },
}

/** "The rooms we'll be in" — `layout: rows`, dated, with the red date column. */
export const DatedRows: Story = {
  args: seededSectionArgs('live', 'inFlightSection', 1),
  parameters: { design: figmaDesign('1710:1800') },
}

/** "The ideas we're chasing" — rows again, with the halftone disc instead of a date. */
export const DiscRows: Story = {
  args: seededSectionArgs('live', 'inFlightSection', 2),
  parameters: { design: figmaDesign('1732:1409') },
}

/** The mobile rows: no disc, no dot, one-line date — and the arrow kept. */
export const RowsMobile: Story = {
  args: seededSectionArgs('live', 'inFlightSection', 1),
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('1906:579') },
}

/** "The work in the studio" at 402 (`1906:342`). */
export const CardsMobile: Story = {
  args: seededSectionArgs('live', 'inFlightSection', 0),
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('1906:342') },
}

/** Header dropped — the band is entries only. */
export const NoHeader: Story = {
  args: {
    ...seededSectionArgs('live', 'inFlightSection', 1),
    heading: undefined,
    subheading: undefined,
  },
  parameters: { design: figmaDesign('1710:1800') },
}

/** A card with no media: the square must not leave a hole in the row. */
export const CardWithoutMedia: Story = {
  args: {
    ...seededSectionArgs('live', 'inFlightSection', 0),
    entries: (seededSectionArgs('live', 'inFlightSection', 0).entries ?? []).map((entry, i) =>
      i === 1 ? { ...entry, media: undefined } : entry,
    ),
  },
  parameters: { design: figmaDesign('1751:1994') },
}
