import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '@/stories/seedContent'

import { LogoWallSection } from './LogoWallSection'

/**
 * The Home frame's `Section - Partners` (`1864:2390`) as the 2026-08 redesign
 * draws it — eyebrow, solid-ink heading, standfirst, a single row of six
 * hairlined plates, and a dark CTA, all on the warm wash.
 *
 * `LogoWallSection.render.test.tsx` guards the structure against the 3 × 2
 * wall it replaced, with `logo: null` fixtures because that test is about the
 * row rather than the pictures. These stories are the other half: the real six
 * marks, desaturated, inside their plates, in a real browser — which is where
 * "the strip clips the same way the frame does" is a claim you can check.
 */
const meta = {
  title: 'Content/Blocks/Section/LogoWallSection',
  component: LogoWallSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1864:2390'),
  },
} satisfies Meta<typeof LogoWallSection>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The homepage band, exactly as seeded — six partners, real logos.
 *
 * The row is 1680px wide against a 1248px column, so the first and last plates
 * are clipped by the viewport. That is the frame's own composition, not a
 * layout bug: compare the export of `1864:2390`.
 */
export const AsSeeded: Story = {
  args: seededSectionArgs('index', 'logoWallSection'),
  globals: { backgrounds: { value: 'bone' } },
}

/** Two plates across, wrapped to three rows — the band's only composition switch. */
export const Mobile: Story = {
  args: seededSectionArgs('index', 'logoWallSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
}

/**
 * Heading and strip with no button — the band must not leave the 128px gap where
 * the button was.
 */
export const NoButton: Story = {
  args: { ...seededSectionArgs('index', 'logoWallSection'), button: null },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * Heading with no standfirst. The split into `heading` + `body` is what #89
 * changed about this block, so the half-filled case is the one an editor will
 * actually produce first.
 */
export const NoBody: Story = {
  args: { ...seededSectionArgs('index', 'logoWallSection'), body: undefined },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * A partial strip. Six is what the frame draws and what the seed carries, but
 * the count is the editor's — three must stay centred rather than stretching.
 */
export const ThreeClients: Story = {
  args: {
    ...seededSectionArgs('index', 'logoWallSection'),
    clients: (seededSectionArgs('index', 'logoWallSection').clients ?? []).slice(0, 3),
  },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * A client with no uploaded logo. `SanityImage` renders nothing for an absent
 * asset, so the plate is empty rather than broken — and because the plate is
 * hairlined now, an empty one is visible instead of silent.
 */
export const MissingLogo: Story = {
  args: {
    ...seededSectionArgs('index', 'logoWallSection'),
    clients: (seededSectionArgs('index', 'logoWallSection').clients ?? []).map((client, i) =>
      i === 2 ? { ...client, logo: null } : client,
    ),
  },
  globals: { backgrounds: { value: 'bone' } },
}
