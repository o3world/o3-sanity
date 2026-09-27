import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { heroSectionKnobs } from '@o3/sanity/knobs'
import { defineKnobStories } from '@o3/story-kit'

import type { SectionProps } from '@o3/content-runtime/blocks'

import { HeroSection } from './HeroSection'

/**
 * The hero's stories, half of them derived (#106).
 *
 * `Playground` and `Matrix` come out of `heroSectionKnobs` — the same
 * declaration the Sanity fields and the canvas toolbar read (ADR 0020). Adding
 * a knob to that file adds a control here and an axis to the matrix; nobody
 * edits this file to make that happen, and a knob the form gates cannot be set
 * from a control the form would have hidden.
 *
 * The stories below them are the other half, and they stay hand-written on
 * purpose: one headline line, no subheading, no CTA are facts about the
 * *content*, not about the block's design options, so there is no declaration
 * to derive them from.
 *
 * Every story here is also a test — the `stories` layer mounts each one in
 * real Chromium and axe-scans it (ADR 0004), so a block with stories needs no
 * separate test file. The fixture is typed as `SectionProps<'heroSection'>`
 * through `defineKnobStories`, so a schema change that alters the block's shape
 * still breaks this file at compile time.
 *
 * Band stories cover current ink interiors and the bone About composition.
 * The orbital Home composition retains its independent ink surface.
 */
const fixture: SectionProps<'heroSection'> = {
  variant: 'orbital',
  eyebrow: 'WORK',
  headlineLines: ['You see the problem in front of you.', 'We’re working on the one behind it.'],
  subheading:
    'Strategy, design, engineering and AI under one roof. The same senior team that finds the move is the team that builds it.',
  // No contrast, so the white fill in the story is Auto reading the band's
  // own ink — the hero forces nothing any more (#147).
  button: {
    _type: 'button',
    label: 'View our work',
    href: '/work',
    target: null,
  },
  decoration: 'orbs',
}

const kit = defineKnobStories({
  spec: heroSectionKnobs,
  component: HeroSection,
  fixture,
  // Every story in this file is an ink band, so the surface is pinned once on
  // the meta rather than repeated on each story.
  globals: { backgrounds: { value: 'ink' } },
})

// Re-typed against the component, and the two derived stories re-cast to
// match. The annotations are not decoration: an exported const whose type is
// inferred through a workspace package cannot name Storybook's internal CSF
// types across pnpm's nested copies (TS2742). Same shape as
// `packages/ui/.../button.stories.tsx`.
// The title is spelled out rather than left to `kit.meta`'s spread. Storybook's
// indexer reads this file statically, so a title arriving through a spread is
// invisible to it and the sidebar entry — and the story id every screenshot is
// keyed by — falls back to the file's path instead. Every sibling block spells
// it out for the same reason; the string is what `titleForSpec` produces.
const meta: Meta<typeof HeroSection> = {
  ...kit.meta,
  title: 'Content/Blocks/Section/HeroSection',
  component: HeroSection,
}
export default meta
type Story = StoryObj<typeof meta>

/** Every knob the hero declares, as a control. Turn one, the block redraws. */
export const Playground = kit.Playground as Story

/**
 * Composition against alignment — the block's first two knobs, gridded. The
 * orbital opener collapses to one cell: it is centred by its own composition
 * and the gate hides the axis.
 */
export const Matrix = kit.Matrix as Story

/** A single headline line gets no set-back — the treatment needs two or more. */
export const SingleLine: Story = {
  args: { ...fixture, headlineLines: ['One line only'], subheading: undefined, button: null },
}

/** Headline alone: no subheading, no button. The layout must not collapse. */
export const HeadlineOnly: Story = {
  args: {
    ...fixture,
    headlineLines: ['Just the headline', 'and nothing else'],
    subheading: undefined,
    button: null,
  },
}

/** Headline and copy keep their beats; a following CTA gets a 300ms reading pause. */
const checkCadence =
  (expected: number[]): NonNullable<Story['play']> =>
  async ({ canvasElement }) => {
    const { expect } = await import('storybook/test')
    const items = [...canvasElement.querySelectorAll<HTMLElement>('h1 > span, .hero-lead > div')]
    const delays = items.map((item) => parseFloat(getComputedStyle(item).animationDelay) * 1000)
    expect(delays).toHaveLength(expected.length)
    delays.forEach((delay, index) => expect(delay).toBeCloseTo(expected[index]!, 2))
  }

export const Cadence: Story = { args: fixture, play: checkCadence([320, 480, 640, 940]) }

export const CadenceWithoutCopy: Story = {
  args: { ...fixture, subheading: undefined },
  play: checkCadence([320, 480, 640]),
}

export const LongHeadlineCadence: Story = {
  args: {
    ...fixture,
    headlineLines: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'],
  },
  play: checkCadence([
    106.667, 160, 213.333, 266.667, 320, 373.333, 426.667, 480, 533.333, 833.333,
  ]),
}

/** About uses the exact ring from3807:81244 and reserves clearance for the overlapping photo. */
export const CentredWithRing: Story = {
  args: {
    ...fixture,
    variant: 'band',
    alignment: 'center',
    surface: 'bone',
  },
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const { expect, within } = await import('storybook/test')
    await expect(within(canvasElement).getByText(fixture.subheading!)).toBeVisible()
    await expect(canvasElement.querySelector('[data-orbital-preset]')).toBeNull()
    const ring = canvasElement.querySelector<SVGElement>('[data-hero-decoration="ring"]')!
    await expect(ring.getBoundingClientRect().width).toBe(608)
    await expect(getComputedStyle(ring).opacity).toBe('0.5')
    const hero = canvasElement.querySelector('section')!
    await expect(hero.getBoundingClientRect().height).toBeGreaterThanOrEqual(864)
    await expect(getComputedStyle(hero).paddingBottom).toBe('239px')
  },
}

export const InteriorMolecule: Story = {
  args: { ...fixture, variant: 'band', alignment: 'start', surface: 'ink' },
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const { expect } = await import('storybook/test')
    await expect(canvasElement.querySelector('[data-orbital-preset]')).toBeNull()
    const molecule = canvasElement.querySelector('section > svg')!
    await expect(molecule.getBoundingClientRect().width).toBe(980)
    await expect(getComputedStyle(molecule).opacity).toBe('0.1')
    await expect(getComputedStyle(molecule).top).toBe('-384px')
    await expect(getComputedStyle(molecule).right).toBe('-287px')
    const hero = canvasElement.querySelector('section')!
    const heading = canvasElement.querySelector('h1')!
    await expect(heading.getBoundingClientRect().left - hero.getBoundingClientRect().left).toBe(96)
  },
}

export const InteriorMoleculeMobile: Story = {
  ...InteriorMolecule,
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const { expect } = await import('storybook/test')
    const molecule = canvasElement.querySelector('section > svg')!
    await expect(molecule.getBoundingClientRect().width).toBe(980)
    await expect(getComputedStyle(molecule).left).toBe('167px')
    await expect(getComputedStyle(molecule).top).toBe('-390px')
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
  },
}

export const PartnerLogoOnly: Story = {
  args: {
    ...fixture,
    variant: 'band',
    alignment: 'start',
    headlineLines: ['Sanity development partner'],
    surface: 'ink',
    logo: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: 'image-64b1b99c9e348ad9a6869c7506d42882cd4afc32-800x220-png',
      },
    },
  },
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const { expect } = await import('storybook/test')
    await expect(canvasElement.querySelector('[data-orbital-preset]')).toBeNull()
    await expect(canvasElement.querySelectorAll('svg')).toHaveLength(0)
    const logo = canvasElement.querySelector('img')!
    await expect(logo.getBoundingClientRect().width).toBeLessThanOrEqual(257)
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
  },
}

export const CentredWithRingMobile: Story = {
  ...CentredWithRing,
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const { expect } = await import('storybook/test')
    const ring = canvasElement.querySelector<SVGElement>('[data-hero-decoration="ring"]')!
    await expect(ring.getBoundingClientRect().width).toBe(440)
    await expect(getComputedStyle(ring).top).toBe('109px')
    await expect(
      canvasElement.querySelector('section')!.getBoundingClientRect().height,
    ).toBeGreaterThanOrEqual(658)
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
  },
}

export const CentredInkMolecule: Story = {
  ...InteriorMolecule,
  args: { ...InteriorMolecule.args, alignment: 'center' },
  play: async ({ canvasElement }) => {
    const { expect } = await import('storybook/test')
    const molecule = canvasElement.querySelector('section > svg')!
    await expect(molecule.getBoundingClientRect().width).toBe(980)
    await expect(getComputedStyle(molecule).top).toBe('-426px')
    await expect(getComputedStyle(molecule).right).toBe('-397px')
    await expect(getComputedStyle(canvasElement.querySelector('h1')!).textAlign).toBe('center')
  },
}
