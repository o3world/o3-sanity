import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { CaseShowcaseSection } from '@o3/content-ui'
import { seededSectionArgs } from '@o3/content-ui/testing/seed'

import { CARD_COMPONENTS } from './clientComponents'

/**
 * The shared showcase band drawing this brand's card — the kit's
 * `Case Study Cards` set (`4404:3072`), a white plate with the photograph in
 * its own band across the top.
 *
 * **The brand is pinned**, and the story is this app's rather than the shared
 * package's, because `caseStudy` is app-first (`APP_FIRST_RENDERERS`): the
 * band's cards slot only has an answer inside an app. The band itself is still
 * shared, so each host draws it through its own binding, and this story is
 * O3XO's side of that — what `pnpm vr --brand o3xo` screenshots.
 *
 * The content is the same seeded band `apps/web`'s story draws, so the two
 * hosts differ by the card and the tokens and nothing else.
 *
 * The band offers no `surface`: it paints a flat `neutral/black` fill, read off
 * O3's Home frame (`1683:2656`). The kit's own `Case Studies` band
 * (`4407:7758`) is #F9FAFB with three cards ACROSS, so this story is where the
 * two designs are furthest apart — a demotion candidate the component map has
 * not yet classified (#324).
 */
const meta = {
  title: 'Content/Blocks/Section/CaseShowcaseSection',
  component: CaseShowcaseSection,
  globals: { brand: 'o3xo' },
  args: { cardComponents: CARD_COMPONENTS },
  parameters: { layout: 'fullscreen' },
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

/** One card — the band still has to hold its 64px top and bottom. */
export const SingleCase: Story = {
  args: {
    ...seededSectionArgs('index', 'caseShowcaseSection'),
    caseStudies: (seededSectionArgs('index', 'caseShowcaseSection').caseStudies ?? []).slice(0, 1),
  },
}
