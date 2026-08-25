import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '../../../testing/seedContent'

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
 * layout bug: compare the export of `1864:2390` — and it is a still of a strip
 * that travels, so in a browser the marks crawl left. Hover to stop them.
 */
export const AsSeeded: Story = {
  args: seededSectionArgs('index', 'logoWallSection'),
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * The band on a phone. One row still, crawling — the wrap this story used to
 * show is gone, because a moving strip shows all six marks at 402 without a
 * second composition.
 */
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
 * the count is the editor's — three must fill the row and travel at the same
 * speed six do, which is what the copy count exists to hold.
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

/**
 * `layout: bar` — the partner page's band (`2332:1708`), #92. The same six
 * marks with the plate dropped and the tile at 100 tall, under a 36px heading
 * in a 64px strip: a footnote to the heading rather than the band's subject.
 */
export const Bar: Story = {
  args: seededSectionArgs('partners-sanity', 'logoWallSection'),
  parameters: { design: figmaDesign('2332:1708') },
  globals: { backgrounds: { value: 'bone' } },
}

/** The bar on a phone — clipped and crawling, like the plates band. */
export const BarMobile: Story = {
  args: seededSectionArgs('partners-sanity', 'logoWallSection'),
  globals: { viewport: { value: 'mobile' }, backgrounds: { value: 'bone' } },
}
