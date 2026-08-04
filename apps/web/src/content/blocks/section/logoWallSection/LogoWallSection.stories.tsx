import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '@/stories/seedContent'

import { LogoWallSection } from './LogoWallSection'

/**
 * The Home frame's "Intro section" (`1864:2390`) — eyebrow, gradient-filled
 * statement, a 3 × 2 wall of six marks, and a Size=Large CTA.
 *
 * `LogoWallSection.render.test.tsx` already guards the wall's geometry against
 * the marquee it replaced, with `logo: null` fixtures because that test is
 * about the grid rather than the pictures. These stories are the other half:
 * the real six marks, at size, in colour, in a real browser — which is where
 * "each one can actually be read" is a claim you can check.
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

/** The homepage band, exactly as seeded — six partners, real logos. */
export const AsSeeded: Story = {
  args: seededSectionArgs('index', 'logoWallSection'),
  globals: { backgrounds: { value: 'bone' } },
}

/** Two across below `lg`, which is the wall's only composition switch. */
export const Mobile: Story = {
  args: seededSectionArgs('index', 'logoWallSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
}

/**
 * Statement and wall with no CTA — the band must not leave the 96px gap
 * where the button was.
 */
export const NoCta: Story = {
  args: { ...seededSectionArgs('index', 'logoWallSection'), cta: null },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * A partial wall. Six is what the frame draws and what the seed carries, but
 * the count is the editor's — three must not stretch to fill two rows.
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
 * asset, so the tile is empty rather than broken — the state the wall is in
 * before an asset lands.
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
