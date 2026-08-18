import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '@/stories/seedContent'

import { CaseShowcaseSection } from './CaseShowcaseSection'

/**
 * The Home frame's "Case Studies" band (`1683:2656`).
 *
 * The band is two stacked `<div>`s with **different gradients** — that is why
 * it builds its own `<section>` instead of using `SectionShell`, and it is the
 * thing to look at first: the join between `--gradient-surface-wash` and
 * `--gradient-surface-wash-angled` should not read as a seam.
 *
 * The block offers no `surface` (see the component), so there is no ink story
 * here — a dark treatment would be a second `variant`, not this band on a dark
 * surface.
 */
const meta = {
  title: 'Content/Blocks/Section/CaseShowcaseSection',
  component: CaseShowcaseSection,
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

/** One card — the wash bands still have to hold their proportions. */
export const SingleCase: Story = {
  args: {
    ...seededSectionArgs('index', 'caseShowcaseSection'),
    caseStudies: (seededSectionArgs('index', 'caseShowcaseSection').caseStudies ?? []).slice(0, 1),
  },
}
