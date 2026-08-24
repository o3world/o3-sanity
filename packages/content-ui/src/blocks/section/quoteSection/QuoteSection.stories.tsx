import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '../../../testing/seedContent'

import { QuoteSection } from './QuoteSection'

/**
 * The pull quote, built to the `Quote` set (`2748:4672`) — a centred 1034px
 * column on bone, instanced whole by Home at both widths.
 *
 * The quote is filled with `--gradient-statement`, so it starts at ink and
 * finishes at 40% — **the fade is length-dependent**, which is the whole
 * reason this block has a short story and a long one. On two lines it barely
 * registers; on eight it is the effect.
 *
 * The attribution is the section-level eyebrow: 18/24 bold uppercase in
 * `--color-fg-muted` (`2748:4840`).
 *
 * The quotation marks are added by the renderer, not stored, so no story
 * should type them.
 */
const meta = {
  title: 'Content/Blocks/Section/QuoteSection',
  component: QuoteSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('2748:4767'),
  },
} satisfies Meta<typeof QuoteSection>

export default meta
type Story = StoryObj<typeof meta>

/** The homepage quote — eight lines at 1440, where the fade does its work. */
export const AsSeeded: Story = {
  args: seededSectionArgs('index', 'quoteSection'),
  globals: { backgrounds: { value: 'bone' } },
}

/** 36/44 at 402 (`2748:4715`), on a 24px column gap instead of 48. */
export const Mobile: Story = {
  args: seededSectionArgs('index', 'quoteSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('2748:4804') },
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

/** No attribution — the gap under the quote must close, not hang. */
export const Unattributed: Story = {
  args: { ...seededSectionArgs('index', 'quoteSection'), attribution: undefined },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * `decoration: 'molecule'` — what Home's instances draw: the same column with
 * the 776px mark at 10% hung off the bottom-left corner instead of the two
 * spheres, clipped by the band. The one decoration that survives 402.
 */
export const Molecule: Story = {
  args: { ...seededSectionArgs('index', 'quoteSection'), decoration: 'molecule' },
  globals: { backgrounds: { value: 'bone' } },
  parameters: { design: figmaDesign('2748:4767') },
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
