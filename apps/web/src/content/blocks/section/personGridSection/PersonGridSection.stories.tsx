import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '@/stories/seedContent'

import { PersonGridSection } from './PersonGridSection'

/**
 * The About frame's "Our team" band (`1927:6435`).
 *
 * The people are **referenced**, not inlined — a person is already a document
 * (they author insights), so inlining names here would have created a
 * second, drifting copy of the same fact. These stories therefore render the
 * real migrated `person` documents, headshots and all, which makes this also
 * the check that the converted person tree still carries them.
 *
 * The frame draws six identical placeholders, so the **count is the editor's**
 * rather than the design's — hence the stories at other counts. Three to a row
 * is the rule; what four or five do to the last row is the thing to look at.
 */
const meta = {
  title: 'Content/Blocks/Section/PersonGridSection',
  component: PersonGridSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1927:6435'),
  },
} satisfies Meta<typeof PersonGridSection>

export default meta
type Story = StoryObj<typeof meta>

/** The projected slot shape. Typegen assumes every `people[]` dereference
 *  lands, so `DanglingReference` — the case where one does not — has to say so
 *  by hand. */
type People = NonNullable<ComponentProps<typeof PersonGridSection>['people']>

/** The six people the About seed references. */
export const AsSeeded: Story = {
  args: seededSectionArgs('about', 'personGridSection'),
}

export const Mobile: Story = {
  args: seededSectionArgs('about', 'personGridSection'),
  globals: { viewport: { value: 'mobile' } },
}

/** Four — the second row runs short, and must stay left-aligned to the grid. */
export const FourPeople: Story = {
  args: {
    ...seededSectionArgs('about', 'personGridSection'),
    people: (seededSectionArgs('about', 'personGridSection').people ?? []).slice(0, 4),
  },
}

/** One person: a single tile, not a stretched one. */
export const OnePerson: Story = {
  args: {
    ...seededSectionArgs('about', 'personGridSection'),
    people: (seededSectionArgs('about', 'personGridSection').people ?? []).slice(0, 1),
  },
}

/**
 * A person with no headshot. The tile's black-and-red-arc plate is drawn by
 * `PortraitTile`, so the composition survives a missing portrait — the state
 * a newly-added person is in before their photo lands.
 */
export const MissingHeadshot: Story = {
  args: {
    ...seededSectionArgs('about', 'personGridSection'),
    people: (seededSectionArgs('about', 'personGridSection').people ?? []).map((person, i) =>
      i === 1 ? { ...person, headshot: null } : person,
    ),
  },
}

/** A person with no `title` — the 13px role eyebrow has nothing to print. */
export const MissingRole: Story = {
  args: {
    ...seededSectionArgs('about', 'personGridSection'),
    people: (seededSectionArgs('about', 'personGridSection').people ?? []).map((person, i) =>
      i === 0 ? { ...person, title: null } : person,
    ),
  },
}

/**
 * One person in two slots — a band of six with a repeat, which an editor gets
 * by duplicating a row. Both cards render, and each keeps its own overlay: the
 * slot's `_key` is the only thing that separates two `<li>`s holding the same
 * document, so anything else here reconciles them into one.
 */
export const SamePersonTwice: Story = {
  args: {
    ...seededSectionArgs('about', 'personGridSection'),
    people: (seededSectionArgs('about', 'personGridSection').people ?? []).map((person, i, all) =>
      i === 3 ? { ...(all[0] as People[number]), _key: person._key } : person,
    ),
  },
}

/**
 * A slot whose person was deleted. The projection spreads nothing, so the item
 * arrives as `{_key}` alone — the state a band is in mid-`load`. It renders as
 * five cards, never as a sixth tile with no portrait and no name.
 */
export const DanglingReference: Story = {
  args: {
    ...seededSectionArgs('about', 'personGridSection'),
    people: (seededSectionArgs('about', 'personGridSection').people ?? []).map((person, i) =>
      i === 2 ? { _key: person._key } : person,
    ) as People,
  },
}
