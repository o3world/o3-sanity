import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '@/stories/seedContent'

import { DisciplineGridSection } from './DisciplineGridSection'

/**
 * The four disciplines, in the two compositions the canonical frames draw them
 * in — one block with a `layout` field, not two block types.
 *
 * | `layout`  | Frame       | Page        |
 * | --------- | ----------- | ----------- |
 * | `grid`    | `1925:5915` | `/about`    |
 * | `orbital` | `1928:6524` | `/solutions`|
 *
 * The orbital composition is `lg` and up: 1120px of absolutely-positioned copy
 * has no honest 402 form and no 402 frame to copy, so below `lg` it falls back
 * to the grid (ADR 0006). `OrbitalMobile` is that fallback, and it is worth a
 * story of its own — it is the arm the Solutions page mockup found a skipped
 * heading level in.
 *
 * **Heading level follows the band's own heading.** A discipline is an `h3`
 * under the band's `h2`, and an `h2` when the band carries no heading — which
 * the Solutions frame does not. `NoHeading` is that case.
 *
 * **The mark is per discipline.** Each row's `mark` draws the animated orb —
 * the default, including when the field is empty — or the frame's halftone
 * disc when an editor picks it. `Grid` is the orb arm and `GridDiscs` is the
 * disc arm; both ship, and a band can mix them.
 */
const meta = {
  title: 'Content/Blocks/Section/DisciplineGridSection',
  component: DisciplineGridSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1925:5915'),
  },
} satisfies Meta<typeof DisciplineGridSection>

export default meta
type Story = StoryObj<typeof meta>

type Args = Parameters<typeof DisciplineGridSection>[0]

/** The seeded band with every discipline's mark set to the disc. */
const asDiscs = (args: Args): Args => ({
  ...args,
  disciplines: args.disciplines?.map((discipline) => ({
    ...discipline,
    mark: { ...discipline.mark, _type: 'mark' as const, kind: 'disc' as const },
  })),
})

/** `/about` — the grid, with the band's own heading above it. */
export const Grid: Story = {
  args: seededSectionArgs('about', 'disciplineGridSection'),
}

/** The same band with every mark set to disc: the frame's original. */
export const GridDiscs: Story = {
  args: asDiscs(seededSectionArgs('about', 'disciplineGridSection')),
}

/** `/solutions` — the dotted tetrahedron, at `lg` and up. */
export const Orbital: Story = {
  args: seededSectionArgs('solutions', 'disciplineGridSection'),
  parameters: { design: figmaDesign('1928:6524') },
}

/**
 * The same block below `lg`. The tetrahedron is gone and the grid is standing
 * in for it — and because the Solutions band has no heading, each discipline
 * is an `h2` here rather than an `h3`.
 */
export const OrbitalMobile: Story = {
  args: seededSectionArgs('solutions', 'disciplineGridSection'),
  globals: { viewport: { value: 'mobile' } },
}

export const GridMobile: Story = {
  args: seededSectionArgs('about', 'disciplineGridSection'),
  globals: { viewport: { value: 'mobile' } },
}

/** No band heading — the discipline headings take `h2` so nothing is skipped. */
export const NoHeading: Story = {
  args: { ...seededSectionArgs('about', 'disciplineGridSection'), heading: undefined },
}

/**
 * On ink. The frame has no ink instance of this band, so the disc inverts to
 * white — "the only honest inversion", per the component. Worth a story
 * because the schema lets an editor reach it.
 */
export const OnInk: Story = {
  args: { ...seededSectionArgs('about', 'disciplineGridSection'), surface: 'ink' },
  globals: { backgrounds: { value: 'ink' } },
}
