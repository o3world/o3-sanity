import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import type { BaseProps } from '@/content/blocks/sectionTypes'
import { seedImage } from '@/stories/seedContent'

import { RichText } from './RichText'

type Body = NonNullable<BaseProps<'richText'>['body']>

/**
 * A Portable Text passage inside a `layoutSection` column — the base block
 * that carries every prose paragraph on the site.
 *
 * The **whole** allowed vocabulary is exercised below, because a serializer
 * that has never rendered a `blockquote` is a serializer that will render one
 * badly the first time an editor reaches for it. `bodyText` allows exactly:
 * `normal` · `h2` · `h3` · `blockquote`, the `strong` / `em` / `code`
 * decorators, links, both list kinds, and the three inline objects (`figure`,
 * `embed`, `pullQuote`).
 *
 * **No code block, on purpose** — extracting all 272 WordPress bodies found
 * zero `<pre>`, `<code>` or highlighted blocks (ADR 0005). The inline `code`
 * decorator covers naming a flag mid-sentence, and it is in `Everything`.
 */
const meta = {
  title: 'Content/Blocks/Base/RichText',
  component: RichText,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof RichText>

export default meta
type Story = StoryObj<typeof meta>

let key = 0
const k = () => `k${(key += 1)}`

function block(style: string, text: string, extra: Record<string, unknown> = {}) {
  const id = k()
  return {
    _type: 'block',
    _key: id,
    style,
    markDefs: [],
    children: [{ _type: 'span', _key: `${id}s`, text, marks: [] }],
    ...extra,
  }
}

const PROSE = [
  block('normal', 'Most firms ship what you asked for. We solve what was actually in the way.'),
  block(
    'normal',
    'The same senior team that finds the move is the team that builds it — which is why the recommendation and the implementation never have to be translated between two groups of people.',
  ),
] as unknown as Body

/** Two paragraphs — the shape almost every authored passage actually is. */
export const Paragraphs: Story = {
  args: { body: PROSE },
}

/** Headings inside a passage. `h2` and `h3` only; the page owns `h1`. */
export const Headings: Story = {
  args: {
    body: [
      block('h2', 'What we found'),
      block('normal', 'The brief described a redesign. The problem was a taxonomy.'),
      block('h3', 'Where it started'),
      block('normal', 'Three teams, three vocabularies, one CMS trying to hold all of them.'),
    ] as unknown as Body,
  },
}

/** A pull quote in the flow, and a `blockquote` style — two different things. */
export const Quotes: Story = {
  args: {
    body: [
      block('normal', 'The engagement turned on one sentence in the kickoff.'),
      block('blockquote', 'Nobody here agrees what a “product” is.'),
      {
        _type: 'pullQuote',
        _key: k(),
        quote: 'We were solving the site. The site was not the problem.',
        attribution: 'Managing Director',
      },
      block('normal', 'Everything after that was downstream of naming it.'),
    ] as unknown as Body,
  },
}

/** Both list kinds, nested a level — the shape `htmlToBlocks` produces. */
export const Lists: Story = {
  args: {
    body: [
      block('normal', 'The weekend broke down roughly like this:'),
      block('normal', 'Move 272 posts off WordPress', { listItem: 'bullet', level: 1 }),
      block('normal', 'Rebuild the block layer', { listItem: 'bullet', level: 1 }),
      block('normal', 'Rewire the routes', { listItem: 'bullet', level: 2 }),
      block('normal', 'Ship it', { listItem: 'number', level: 1 }),
    ] as unknown as Body,
  },
}

/**
 * Every decorator, a link, and an inline figure in one passage — the density a
 * migrated article actually arrives at.
 */
export const Everything: Story = {
  args: {
    body: [
      block('h2', 'The whole vocabulary'),
      {
        _type: 'block',
        _key: 'mixed',
        style: 'normal',
        markDefs: [{ _type: 'link', _key: 'l1', href: 'https://www.o3world.com' }],
        children: [
          { _type: 'span', _key: 'm1', text: 'Bold ', marks: ['strong'] },
          { _type: 'span', _key: 'm2', text: 'italic ', marks: ['em'] },
          { _type: 'span', _key: 'm3', text: 'NEXT_PUBLIC_SANITY_DATASET', marks: ['code'] },
          { _type: 'span', _key: 'm4', text: ', and ', marks: [] },
          { _type: 'span', _key: 'm5', text: 'a link', marks: ['l1'] },
          { _type: 'span', _key: 'm6', text: ' — all in one paragraph.', marks: [] },
        ],
      },
      {
        _type: 'figure',
        _key: k(),
        image: seedImage('tools/migration/data/seed/assets/perspective-weekend-worktrees.png'),
        alt: 'Three parallel tracks converging on a single branch.',
        caption: 'One ticket, one worktree, one session.',
      },
      block('normal', 'And prose after it, which must not inherit the figure’s spacing.'),
    ] as unknown as Body,
  },
}

/** Empty. An absent body renders nothing rather than an empty measure. */
export const Empty: Story = {
  args: { body: [] as unknown as Body },
}

/** On ink — prose inherits the band's ink, so this is the legibility check. */
export const OnInk: Story = {
  args: { body: PROSE },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink p-12 text-white">
      <RichText {...args} />
    </div>
  ),
}
