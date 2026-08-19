import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { QuoteSection } from '@o3/content-ui'

import { HeaderPill } from './HeaderPill'

/**
 * The kit's Header Pill (`4414:8100`, Quotes canvas of the _O3XO: UI kit_
 * file) — the label a band wears above its opening line.
 *
 * **The brand is pinned.** The pill is O3XO's alone: it is drawn to a file O3
 * does not read, and its type step is the kit's sentence-case kicker rather
 * than the shared `Eyebrow`'s uppercase one (#238). There is nothing for the
 * Brand toolbar to ask over it, so `globals.brand` is pinned and the control
 * greys out — the toolbar stays live on the shared stories, where flipping the
 * brand is the standing paint-leak test (ADR 0028).
 *
 * There is no Design tab: `figmaDesign` is pinned to O3's file, and the kit is
 * a second one.
 */
const meta = {
  title: 'O3XO/HeaderPill',
  component: HeaderPill,
  globals: { brand: 'o3xo' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof HeaderPill>

export default meta
type Story = StoryObj<typeof meta>

const LABEL = 'Trusted by leading organizations'

/** Over a photograph, which is the only place the kit draws it. */
export const OnInk: Story = {
  args: { children: LABEL },
  globals: { backgrounds: { value: 'ink' } },
}

/**
 * On a light band — the surface O3XO's own quote band sits on today. The kit
 * has no drawing of this, so the fill and hairline are `fg` alphas: white on
 * white would be nothing.
 */
export const OnBone: Story = {
  args: { children: LABEL },
  globals: { backgrounds: { value: 'bone' } },
}

/** The words wrapping — the pill hugs its label rather than the column. */
export const TwoLines: Story = {
  args: {
    children: 'Trusted by leading organizations across construction, real estate and life sciences',
    className: 'max-w-[16rem]',
  },
  globals: { backgrounds: { value: 'ink' } },
}

/**
 * The band, as this app binds it (`4404:5107`): the pill fills the quote
 * section's eyebrow slot, 32px clear of the quote, on the quote's own column.
 */
export const InTheQuoteBand: Story = {
  args: { children: LABEL },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <QuoteSection
      {...({
        quote:
          'I was expecting the ROI for our project next year, but we are going to immediately see that value now.',
        attribution: 'Brett Norton, President, Buffalo Construction, Inc',
        decoration: 'none',
        surface: 'bone',
      } as unknown as ComponentProps<typeof QuoteSection>)}
      eyebrowSlot={<HeaderPill {...args} />}
    />
  ),
}
