import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '@/stories/seedContent'

import { QuoteSection } from './QuoteSection'

/**
 * The pull quote, built to the Home frame's second "Intro section"
 * (`1683:2137`).
 *
 * The quote is filled with `--gradient-statement`, so it starts at ink and
 * finishes at 40% — **the fade is length-dependent**, which is the whole
 * reason this block has a short story and a long one. On two lines it barely
 * registers; on eight it is the effect.
 *
 * The attribution is 36px at `--color-fg-quiet` on a 1.5em line. It is **not**
 * an eyebrow — the scaffold set it as a red uppercase kicker, which was
 * neither the size, the case, nor the colour.
 *
 * The quotation marks are added by the renderer, not stored, so no story
 * should type them.
 */
const meta = {
  title: 'Content/Blocks/Section/QuoteSection',
  component: QuoteSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1683:2137'),
  },
} satisfies Meta<typeof QuoteSection>

export default meta
type Story = StoryObj<typeof meta>

/** The homepage quote — eight lines at 1440, where the fade does its work. */
export const AsSeeded: Story = {
  args: seededSectionArgs('index', 'quoteSection'),
  globals: { backgrounds: { value: 'bone' } },
}

/** `--text-quote` sets this node at 30px on a phone, not the hero's 36 (ADR 0006). */
export const Mobile: Story = {
  args: seededSectionArgs('index', 'quoteSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
}

/** A two-line quote: the gradient has almost nothing to travel across. */
export const Short: Story = {
  args: {
    ...seededSectionArgs('index', 'quoteSection'),
    quote: 'They found the problem behind the problem.',
    attribution: 'CTO, Global Health Brand',
  },
  globals: { backgrounds: { value: 'bone' } },
}

/** No attribution — the 24px gap under the quote must close, not hang. */
export const Unattributed: Story = {
  args: { ...seededSectionArgs('index', 'quoteSection'), attribution: undefined },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * `decoration: 'molecule'` — the 2026-08 case-study band (`2250:1525`, #97).
 * The same column and the same gradient fill, with the molecule mark at 699px
 * and 10% hung off the right edge instead of the two spheres, clipped by the
 * band. Hidden below `lg`, like the spheres.
 */
export const Molecule: Story = {
  args: { ...seededSectionArgs('index', 'quoteSection'), decoration: 'molecule' },
  globals: { backgrounds: { value: 'bone' } },
  parameters: { design: figmaDesign('2250:1525') },
}

/** `decoration: 'none'` drops the sphere; the column and the fade stay. */
export const NoDecoration: Story = {
  args: { ...seededSectionArgs('index', 'quoteSection'), decoration: 'none' },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * On ink. The gradient fill is authored for a light band, so this is the story
 * that says whether an editor picking `ink` here gets something usable — worth
 * knowing, since the schema lets them.
 */
export const OnInk: Story = {
  args: { ...seededSectionArgs('index', 'quoteSection'), surface: 'ink' },
  globals: { backgrounds: { value: 'ink' } },
}
