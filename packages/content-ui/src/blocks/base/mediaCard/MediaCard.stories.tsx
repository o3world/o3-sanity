import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { seedImage } from '../../../testing/seedContent'

import { MediaCard } from './MediaCard'

/**
 * The About frame's "Beyond O3 World" card (`1924:5388`) — the three things
 * O3 does that are not client work, each a picture, a name, a line and the
 * link out.
 *
 * The band around it is a `layoutSection` on ink, so the ink stories are the
 * ones that match the frame; the white one is here because a base block goes
 * wherever a column goes and the card may not assume its band.
 */
const meta = {
  title: 'Content/Blocks/Base/MediaCard',
  component: MediaCard,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MediaCard>

export default meta
type Story = StoryObj<typeof meta>

const CONFERENCE = {
  _type: 'figure' as const,
  image: seedImage('tools/migration/data/seed/assets/about-beyond-1682.png'),
  alt: 'The 1682 conference wordmark on black, built from Bauhaus quarter-circles and squares.',
}

export const Default: Story = {
  args: {
    media: CONFERENCE,
    heading: '1682',
    body: 'Our annual conference on AI and innovation — the room where the people doing this work compare notes.',
    button: {
      _type: 'button',
      label: 'See the conference',
      href: '/1682-conference-ai-innovation',
      target: null,
    },
  },
}

/** The frame's own band: ink, three up, the link in brand red. */
export const OnInk: Story = {
  args: Default.args,
  decorators: [
    (Story) => (
      <div data-surface="ink" className="bg-ink p-10 text-white">
        <div className="max-w-[395px]">
          <Story />
        </div>
      </div>
    ),
  ],
}

/**
 * No link. The Community card has no page to point at, and the card has to
 * close under its body rather than leave the slot open.
 */
export const NoButton: Story = {
  args: {
    media: {
      _type: 'figure',
      image: seedImage('tools/migration/data/seed/assets/about-beyond-community.png'),
      alt: 'The O3 team in black and white, gathered on a bench in a stone-walled hall.',
    },
    heading: 'Community',
    body: 'Philadelphia is home. We show up for the design and engineering community that made us.',
    button: null,
  },
}

/** An upload that never landed — the copy still has to read. */
export const NoImage: Story = {
  args: {
    media: { _type: 'figure', image: null, alt: 'Nothing to show' },
    heading: 'Ventures',
    body: 'Our investment arm, backing early-stage AI and digital product companies whose values and ambitions match ours.',
    button: { _type: 'button', label: 'See the portfolio', href: '/ventures', target: null },
  },
}
