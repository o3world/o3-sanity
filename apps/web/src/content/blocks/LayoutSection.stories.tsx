import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { figmaDesign } from '@o3/story-kit'

import { LayoutSection } from '@o3/content-ui'
import { seededSectionArgs } from '@o3/content-ui/testing/seed'

import { BASE_CLIENT_COMPONENTS } from './clientComponents'

/**
 * The one true two-tier block (ADR 0001): 1–3 columns of **base-tier** blocks,
 * dispatched through this app's base roster. It is the band an editor reaches
 * for when no bespoke block fits, so what it does with an awkward mix is more
 * interesting than what it does with a tidy one.
 *
 * **The brand is pinned**, and the story is this app's rather than the shared
 * package's, because `statGroup` is app-first (`APP_FIRST_RENDERERS`): the
 * band's `baseComponents` slot only has an answer inside an app. The band
 * itself is still shared, so each host draws it through its own roster, and
 * this story is O3's side of that.
 *
 * Its header follows the About frame's interior bands (`1924:5344`): a neutral
 * eyebrow, the 48px heading, and a set-back subheading.
 *
 * The base tier never contains sections, so nothing here can nest — the
 * columns hold `richText`, `figure`, `mediaCard`, `embed`, `button` and
 * `statGroup`, and that is the whole vocabulary.
 */
const meta = {
  title: 'Content/Blocks/Section/LayoutSection',
  component: LayoutSection,
  globals: { brand: 'o3' },
  args: { baseComponents: BASE_CLIENT_COMPONENTS },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LayoutSection>

export default meta
type Story = StoryObj<typeof meta>

/** The About page's opening prose band. */
export const AsSeeded: Story = {
  args: seededSectionArgs('about', 'layoutSection', 0),
}

/**
 * About's "Beyond O3 World" band (`1924:5388`): three `mediaCard` columns on
 * ink, each a picture over a name, a line and the link out.
 */
export const AboutSecondBand: Story = {
  args: seededSectionArgs('about', 'layoutSection', 1),
  globals: { backgrounds: { value: 'ink' } },
}

/** The 1682 page's bands — the block carrying figures rather than prose. */
export const WithFigures: Story = {
  args: seededSectionArgs('1682-conference-ai-innovation', 'layoutSection', 1),
}

/** Forced to one column: the measure, not the grid, is what has to hold. */
export const SingleColumn: Story = {
  args: { ...seededSectionArgs('about', 'layoutSection', 0), columns: 1 },
}

/** Three columns of the same items — the tightest measure the block allows. */
export const ThreeColumns: Story = {
  args: { ...seededSectionArgs('about', 'layoutSection', 0), columns: 3 },
}

/** Header dropped — items only, which is how most interior bands are authored. */
export const NoHeader: Story = {
  args: {
    ...seededSectionArgs('about', 'layoutSection', 0),
    eyebrow: undefined,
    heading: undefined,
    subheading: undefined,
  },
}

/** Empty. A band with a header and no items should not draw an empty grid. */
export const NoItems: Story = {
  args: { ...seededSectionArgs('about', 'layoutSection', 0), items: [] },
}

export const Mobile: Story = {
  args: seededSectionArgs('about', 'layoutSection', 0),
  globals: { viewport: { value: 'mobile' } },
}

/** On ink — base blocks inherit the band's ink, so this is the readability check. */
export const OnInk: Story = {
  args: { ...seededSectionArgs('about', 'layoutSection', 0), surface: 'ink' },
  globals: { backgrounds: { value: 'ink' } },
}

/**
 * `/solutions/software-engineering` — the proof-point band (`2357:2690`,
 * #93): ink, with the molecule hung off the band's right edge at 25%. The
 * `decoration` knob's canonical instance on this block.
 */
export const WithMolecule: Story = {
  args: seededSectionArgs('solutions-software-engineering', 'layoutSection', 1),
  parameters: { design: figmaDesign('2357:2690') },
  globals: { backgrounds: { value: 'ink' } },
}

/**
 * `/solutions/software-engineering` — the Overview band (`2360:2861`): prose
 * beside the photo.
 */
export const OverviewWithPhoto: Story = {
  args: seededSectionArgs('solutions-software-engineering', 'layoutSection', 0),
  parameters: { design: figmaDesign('2360:2861') },
}

/** The About heading keeps its hierarchy when the photo placement changes. */
const aboutHeading = {
  ...seededSectionArgs('solutions-software-engineering', 'layoutSection', 0),
  eyebrow: 'Why O3',
  heading: 'Built to go end to end on purpose',
  headingLevel: 'xl' as const,
}

export const AboutHeadingWithPhoto: Story = {
  args: aboutHeading,
  globals: { viewport: { value: 'desktop' } },
  parameters: { design: figmaDesign('2960:6890') },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { name: aboutHeading.heading })
    await expect(parseFloat(getComputedStyle(heading).fontSize)).toBeCloseTo(48, 0)
    await expect(getComputedStyle(heading).fontWeight).toBe('300')
  },
}

export const AboutHeadingMobile: Story = {
  ...AboutHeadingWithPhoto,
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('2975:9043') },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { name: aboutHeading.heading })
    await expect(getComputedStyle(heading).fontSize).toBe('40px')
    await expect(getComputedStyle(heading).fontWeight).toBe('300')
    await expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth)
  },
}

export const AboutHeadingWithoutBleed: Story = {
  ...AboutHeadingMobile,
  args: { ...aboutHeading, bleed: 'none' },
}

/** No stored setting: existing Engineering Overview keeps its current size. */
export const OverviewAutomaticMobile: Story = {
  ...OverviewWithPhoto,
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { name: 'Overview' })
    await expect(getComputedStyle(heading).fontSize).toBe('18px')
    await expect(getComputedStyle(heading).fontWeight).toBe('300')
  },
}

export const LegacyHeading: Story = {
  args: { ...aboutHeading, headingLevel: 'auto', bleed: 'none' },
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { name: aboutHeading.heading })
    await expect(getComputedStyle(heading).fontSize).toBe('40px')
    await expect(getComputedStyle(heading).fontWeight).toBe('400')
  },
}
