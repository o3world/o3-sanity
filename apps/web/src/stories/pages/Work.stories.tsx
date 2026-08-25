import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { CaseStudyIndexMockup } from '../CaseStudyIndexMockup'

/**
 * `/work` — the Work index frame (`1634:1167`) at 1440 and `1906:851` at 402.
 *
 * Four bands: the Interior Hero on ink, the white grid of full-width case
 * cards, the shared CTA, the footer. The **surface sequence** is what only a
 * page mockup shows — ink → white → ink → black — and it is the one place the
 * two collection indexes deliberately differ: `/insights` lays its grid on
 * bone, because a white band between two ink ones would read as two pages,
 * while these cards carry their own photographs and a bone field behind them
 * muddies the scrim.
 *
 * The other page-level property is the card rhythm: 48px between 1248 × 550
 * bands at both widths (`2107:1094`–`1096`, `2975:8428` at 402), which is
 * close enough that three cards read as one stack rather than three sections.
 *
 * Added with #348, when the hero and closer became a `collectionIndex`
 * document — so the bands this draws are the seed's, and the frame it is
 * checked against is the one the seed records.
 */
const meta = {
  title: 'Pages/Work',
  component: CaseStudyIndexMockup,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1634:1167'),
  },
  argTypes: {
    page: { control: { type: 'number', min: 1 } },
  },
} satisfies Meta<typeof CaseStudyIndexMockup>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: { page: 1 },
  globals: { viewport: { value: 'desktop' } },
}

/** One column, the cards stacked the same 48 apart — the 402 frame (`1906:851`). */
export const Mobile: Story = {
  args: { page: 1 },
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('1906:851') },
}
