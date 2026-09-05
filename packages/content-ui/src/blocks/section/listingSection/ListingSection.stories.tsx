/* eslint o3/figma-design: "off" -- ADR 0013 retired /services; this unused block has no seeded instance or canonical frame (module contract below). */
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import type { SectionProps } from '@o3/content-runtime/blocks'

import { ListingSection } from './ListingSection'

/**
 * A grid of `page` cards, filtered by `pageType` and resolved at query time
 * (`SECTION_FIELDS`' listingSection arm), so the component itself is pure.
 *
 * **The only section block with no seeded instance and no canonical frame.**
 * It was built to power `/services`, which ADR 0013 consolidated into
 * `/solutions` — so nothing on the site renders it today, and the args below
 * are hand-built rather than read off a seed.
 *
 * That is exactly why it earns stories. A block nothing renders is a block
 * nothing catches: it kept compiling through the `page.card` fieldset landing
 * and through the card registry changing under it, with no page and no test
 * ever mounting it. These stories are the only thing standing between it and
 * silent rot — and if it is genuinely dead, they are also the evidence needed
 * to delete it rather than a reason to keep it.
 */
const meta = {
  title: 'Content/Blocks/Section/ListingSection',
  component: ListingSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ListingSection>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Six service pages. `card` is the `page` document's own card fieldset —
 * shortTitle, excerpt, icon — and the icons are deliberately absent: no seeded
 * page carries one, so a story that invented them would be describing content
 * that does not exist.
 */
const PAGES: SectionProps<'listingSection'>['pages'] = [
  ['Strategy', 'Where the work should go, decided with the people who will build it.'],
  ['Design', 'Interfaces that survive contact with a real org chart.'],
  ['Engineering', 'The team that found the move is the team that ships it.'],
  ['AI', 'Applied where it changes an outcome, not where it demos well.'],
  ['Platforms', 'Certified depth in a few, rather than a passing acquaintance with all.'],
  ['Support', 'What happens after launch, planned before it.'],
].map(([title, excerpt], i) => ({
  _id: `page-listing-${i}`,
  _type: 'page' as const,
  title: title as string,
  slug: (title as string).toLowerCase(),
  card: { shortTitle: title as string, excerpt: excerpt as string },
}))

export const AsAuthored: Story = {
  args: { heading: 'What we do', pages: PAGES },
}

/** Three across from `lg`, two from `md`, one below — the grid's whole rule. */
export const Mobile: Story = {
  args: { heading: 'What we do', pages: PAGES },
  globals: { viewport: { value: 'mobile' } },
}

/** Four cards: the second row runs short and must stay left-aligned. */
export const FourPages: Story = {
  args: { heading: 'What we do', pages: PAGES.slice(0, 4) },
}

/** No heading — the 48px gap above the grid has nothing to space. */
export const NoHeading: Story = {
  args: { pages: PAGES },
}

/**
 * Nothing matched the `pageType`. This is the state `/services` would be in
 * today, and the band must not draw an empty grid under a live heading.
 */
export const NoPages: Story = {
  args: { heading: 'What we do', pages: [] },
}

/** A card with no excerpt — the card's own fallback, seen in the grid. */
export const MissingExcerpt: Story = {
  args: {
    heading: 'What we do',
    pages: PAGES.map((page, i) =>
      i === 1 ? { ...page, card: { shortTitle: page.card?.shortTitle } } : page,
    ),
  },
}

export const OnBone: Story = {
  args: { heading: 'What we do', pages: PAGES, surface: 'bone' },
  globals: { backgrounds: { value: 'bone' } },
}
