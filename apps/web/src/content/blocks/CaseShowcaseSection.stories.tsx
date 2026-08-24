import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { CaseShowcaseSection } from '@o3/content-ui'
import { seededSectionArgs } from '@o3/content-ui/testing/seed'

import { CARD_COMPONENTS } from './clientComponents'

/**
 * The Home frame's "Case Studies" band (`1683:2656`), drawing O3's card.
 *
 * **The brand is pinned**, and the story is this app's rather than the shared
 * package's, for the same reason: `caseStudy` is app-first
 * (`APP_FIRST_RENDERERS`), so the band's cards slot only has an answer inside
 * an app. O3XO's own composition is covered by its card's story and the
 * showcase render test in `apps/o3xo`.
 *
 * The band is one flat `neutral/black` band padded `64px 96px`, and that is
 * the thing to look at first: the cards are photographs behind their own
 * scrim, so the join between a card's floor and the band around it should read
 * as one dark field rather than two.
 *
 * The block offers no `surface` (see the component) — the band is ink on every
 * page it appears on, so there is no white story here.
 */
const meta = {
  title: 'Content/Blocks/Section/CaseShowcaseSection',
  component: CaseShowcaseSection,
  globals: { brand: 'o3' },
  args: { cardComponents: CARD_COMPONENTS },
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1683:2656'),
  },
} satisfies Meta<typeof CaseShowcaseSection>

export default meta
type Story = StoryObj<typeof meta>

/** Three real case studies, dereferenced from the committed translations. */
export const AsSeeded: Story = {
  args: seededSectionArgs('index', 'caseShowcaseSection'),
}

/** Gap 24 at 402, 48 at 1440 — the band's one responsive move (ADR 0006). */
export const Mobile: Story = {
  args: seededSectionArgs('index', 'caseShowcaseSection'),
  globals: { viewport: { value: 'mobile' } },
}

/**
 * The heading row is `space-between` aligned to **flex-end**, so the 48px
 * headline and the Size=Large button share a baseline. With no button the
 * headline should not recentre itself.
 */
export const NoButton: Story = {
  args: { ...seededSectionArgs('index', 'caseShowcaseSection'), button: null },
}

/** One card — the band still has to hold its 64px top and bottom. */
export const SingleCase: Story = {
  args: {
    ...seededSectionArgs('index', 'caseShowcaseSection'),
    caseStudies: (seededSectionArgs('index', 'caseShowcaseSection').caseStudies ?? []).slice(0, 1),
  },
}
