import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import type { SectionProps } from '@o3/content-runtime/blocks'

import { HeroSection } from './HeroSection'

/**
 * The hero's stories. `Playground` renders the fixture with every prop open to
 * the controls panel; `Matrix` draws each composition and alignment the knobs
 * offer in one frame; the rest are single states — content edge cases, the
 * entrance cadence, and the band compositions the frames draw.
 *
 * Every story here is also a test — the `stories` layer mounts each one in
 * real Chromium and axe-scans it (ADR 0004), so a block with stories needs no
 * separate test file. The fixture is typed as `SectionProps<'heroSection'>`,
 * so a schema change that alters the block's shape breaks this file at
 * compile time.
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

const meta: Meta<typeof HeroSection> = {
  title: 'Content/Blocks/Section/HeroSection',
  component: HeroSection,
  parameters: { layout: 'fullscreen' },
  // Every story in this file is an ink band, so the surface is pinned once on
  // the meta rather than repeated on each story.
  globals: { backgrounds: { value: 'ink' } },
}
export default meta
type Story = StoryObj<typeof meta>

/** The fixture as authored. Turn a control and the block redraws. */
export const Playground: Story = { args: fixture }

const MATRIX: { label: string; args: SectionProps<'heroSection'> }[] = [
  { label: 'Composition: Orbital', args: fixture },
  {
    label: 'Composition: Band, Alignment: Left',
    args: { ...fixture, variant: 'band', alignment: 'start' },
  },
  {
    label: 'Composition: Band, Alignment: Centred',
    args: { ...fixture, variant: 'band', alignment: 'center' },
  },
]

/**
 * Composition against alignment. The orbital opener takes one cell: it is
 * centred by its own composition, so alignment is a band-only choice.
 */
export const Matrix: Story = {
  args: fixture,
  parameters: { controls: { disable: true } },
  // Stacked rather than side by side: a section block is full-bleed, and
  // half-width columns would draw it at a width it never renders at.
  render: () => (
    <div className="flex flex-col">
      {MATRIX.map(({ label, args }) => (
        <div key={label}>
          <div className="bg-bone text-fg-muted px-4 py-1 font-mono text-xs">{label}</div>
          <HeroSection {...args} />
        </div>
      ))}
    </div>
  ),
}

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
