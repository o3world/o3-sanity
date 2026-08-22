import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '../../../testing/seedContent'

import { FeatureGridSection } from './FeatureGridSection'

/**
 * A set of parallel short claims, in the four compositions the canonical frames
 * draw them in — one block with a `layout` field, not four block types.
 *
 * | `layout`  | Frame       | Page                                              |
 * | --------- | ----------- | ------------------------------------------------- |
 * | `grid`    | `1925:5915` | `/about`                                          |
 * | `stack`   | `2354:2530` | `/partners/sanity`                                |
 * | `rows`    | `2341:2250` | `/partners/sanity`, `/solutions/software-engineering` |
 * | `orbital` | `1928:6524` | `/solutions`                                      |
 *
 * The orbital composition is `lg` and up: 1120px of absolutely-positioned copy
 * has no honest 402 form and no 402 frame to copy, so below `lg` it falls back
 * to the grid (ADR 0006). `OrbitalMobile` is that fallback, and it is worth a
 * story of its own — it is the arm the Solutions page mockup found a skipped
 * heading level in.
 *
 * **Heading level follows the band's own heading.** A feature is an `h3`
 * under the band's `h2`, and an `h2` when the band carries no heading — which
 * the Solutions frame does not. `NoHeading` is that case.
 *
 * **The mark is per feature.** Each row's `mark` draws the animated orb —
 * the default, including when the field is empty — or the frame's halftone
 * disc when an editor picks it. `Grid` is the orb arm and `GridDiscs` is the
 * disc arm; both ship, and a band can mix them.
 */
const meta = {
  title: 'Content/Blocks/Section/FeatureGridSection',
  component: FeatureGridSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1925:5915'),
  },
} satisfies Meta<typeof FeatureGridSection>

export default meta
type Story = StoryObj<typeof meta>

type Args = Parameters<typeof FeatureGridSection>[0]

/** The seeded band with every feature’s mark set to the disc. */
const asDiscs = (args: Args): Args => ({
  ...args,
  features: args.features?.map((feature) => ({
    ...feature,
    mark: { ...feature.mark, _type: 'mark' as const, kind: 'disc' as const },
  })),
})

/** `/about` — the grid, with the band's own heading above it. */
export const Grid: Story = {
  args: seededSectionArgs('about', 'featureGridSection'),
}

/** The same band with every mark set to disc: the frame's original. */
export const GridDiscs: Story = {
  args: asDiscs(seededSectionArgs('about', 'featureGridSection')),
}

/** `/solutions` — the dotted tetrahedron, at `lg` and up. */
export const Orbital: Story = {
  args: seededSectionArgs('solutions', 'featureGridSection'),
  parameters: { design: figmaDesign('1928:6524') },
}

/**
 * The same block below `lg`. The tetrahedron is gone and the grid is standing
 * in for it — and because the Solutions band has no heading, each feature
 * is an `h2` here rather than an `h3`.
 */
export const OrbitalMobile: Story = {
  args: seededSectionArgs('solutions', 'featureGridSection'),
  globals: { viewport: { value: 'mobile' } },
}

export const GridMobile: Story = {
  args: seededSectionArgs('about', 'featureGridSection'),
  globals: { viewport: { value: 'mobile' } },
}

/** No band heading — the feature headings take `h2` so nothing is skipped. */
export const NoHeading: Story = {
  args: { ...seededSectionArgs('about', 'featureGridSection'), heading: undefined },
}

/**
 * On ink. The frame has no ink instance of this band, so the disc inverts to
 * white — "the only honest inversion", per the component. Worth a story
 * because the schema lets an editor reach it.
 */
export const OnInk: Story = {
  args: { ...seededSectionArgs('about', 'featureGridSection'), surface: 'ink' },
  globals: { backgrounds: { value: 'ink' } },
}

/**
 * `/partners/sanity` — the stacked composition (`2354:2530`): the mark above a
 * 28px lead over a quieter paragraph, three across, on ink with the molecule
 * hung off the right.
 */
export const Stack: Story = {
  args: seededSectionArgs('partners-sanity', 'featureGridSection'),
  parameters: { design: figmaDesign('2354:2530') },
  globals: { backgrounds: { value: 'ink' } },
}

/**
 * The same composition with no `body` on any feature (`2334:2122`) — a whole
 * canonical band of headings and marks, and the reason `body` is optional. The
 * mark takes the frame's larger 59px box when the copy under it is one line.
 */
export const StackHeadingsOnly: Story = {
  args: seededSectionArgs('partners-sanity', 'featureGridSection', 2),
  parameters: { design: figmaDesign('2334:2122') },
}

/**
 * `/partners/sanity` — the hairlined rows (`2341:2250`): the mark and heading
 * left in 609, the body right in 500, a rule under every row.
 */
export const Rows: Story = {
  args: seededSectionArgs('partners-sanity', 'featureGridSection', 1),
  parameters: { design: figmaDesign('2341:2250') },
}

/** The rows composition below `lg`, where the two columns stack. */
export const RowsMobile: Story = {
  args: seededSectionArgs('partners-sanity', 'featureGridSection', 1),
  globals: { viewport: { value: 'mobile' } },
}

/** The stacked composition below `lg` — three columns become one. */
export const StackMobile: Story = {
  args: seededSectionArgs('partners-sanity', 'featureGridSection'),
  globals: { viewport: { value: 'mobile' } },
  parameters: { backgrounds: { value: 'ink' } },
}
