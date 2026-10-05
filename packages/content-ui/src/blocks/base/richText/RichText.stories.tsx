import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import type { BaseProps } from '@o3/content-runtime/blocks'
import { seedImage } from '../../../testing/seedContent'

import { RichText } from './RichText'
import { PortableTextBody } from '../../../portable-text/PortableTextBody'

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
  parameters: {
    layout: 'padded',
    viewport: {
      options: {
        mobile: { name: 'Figma mobile', styles: { width: '402px', height: '874px' } },
      },
    },
  },
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
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    const style = getComputedStyle(heading)
    await expect(parseFloat(style.fontSize)).toBeCloseTo(36, 1)
    await expect(parseFloat(style.lineHeight)).toBeCloseTo(44, 1)
    await expect(style.fontWeight).toBe('400')
    await expect(style.marginBottom).toBe('32px')
  },
  args: {
    body: [
      block('h2', 'What we found'),
      block('normal', 'The brief described a redesign. The problem was a taxonomy.'),
      block('h3', 'Where it started'),
      block('normal', 'Three teams, three vocabularies, one CMS trying to hold all of them.'),
    ] as unknown as Body,
  },
}

export const HeadingsMobile: Story = {
  args: Headings.args,
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    const style = getComputedStyle(heading)
    await expect(parseFloat(style.fontSize)).toBeCloseTo(32, 1)
    await expect(parseFloat(style.lineHeight)).toBeCloseTo(38, 1)
    await expect(style.fontWeight).toBe('400')
    await expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth)
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
        image: seedImage('tools/migration/data/seed/assets/insight-weekend-worktrees.png'),
        alt: 'Three parallel tracks converging on a single branch.',
        caption: 'One ticket, one worktree, one session.',
      },
      block('normal', 'And prose after it, which must not inherit the figure’s spacing.'),
    ] as unknown as Body,
  },
}

/**
 * The `:hover` declarations that apply to `element`, read off the stylesheets.
 * A synthetic pointer event never sets `:hover`, so a play function cannot
 * hover for real; this is the rule the browser would apply if it did.
 */
function hoverDeclarations(element: Element): CSSStyleDeclaration[] {
  const walk = (rules: CSSRuleList): CSSStyleDeclaration[] =>
    [...rules].flatMap((rule) => {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes(':hover')) {
        return element.matches(rule.selectorText.replaceAll(':hover', '')) ? [rule.style] : []
      }
      return 'cssRules' in rule ? walk((rule as CSSGroupingRule).cssRules) : []
    })
  return [...document.styleSheets].flatMap((sheet) => {
    // A cross-origin sheet (a webfont's) refuses to list its rules.
    try {
      return walk(sheet.cssRules)
    } catch {
      return []
    }
  })
}

/**
 * A link in prose is brand red and deepens to red-700 on hover, the brand
 * Button's pattern; keyboard focus draws the brand ring every other text link
 * draws, never the browser's own.
 */
export const LinkHover: Story = {
  args: Everything.args,
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'a link' })
    const style = getComputedStyle(link)
    await expect(style.color).toBe('rgb(235, 16, 0)')
    await expect(style.textDecorationColor).toBe('rgb(235, 16, 0)')
    const hover = hoverDeclarations(link).map((rule) => rule.getPropertyValue('color'))
    await expect(hover).toContain('var(--color-fg-link-hover)')
    await expect(
      getComputedStyle(document.documentElement).getPropertyValue('--color-fg-link-hover').trim(),
    ).toBe('#a80b00')
    await expect(style.transitionProperty).toContain('color')
    // `--duration-hover`, 220ms.
    await expect(style.transitionDuration).toBe('0.22s')
    for (let i = 0; i < 20 && document.activeElement !== link; i++) await userEvent.tab()
    await expect(document.activeElement).toBe(link)
    const focused = getComputedStyle(link)
    await expect(focused.outlineStyle).toBe('none')
    await expect(focused.boxShadow).toContain('rgb(235, 16, 0)')
  },
}

/** On a dark band a prose link keeps the band's body white, ruled in brand red. */
export const LinkOnInk: Story = {
  args: Everything.args,
  render: (args) => (
    <div data-surface="ink" className="bg-ink p-8">
      <RichText {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'a link' })
    const style = getComputedStyle(link)
    await expect(style.color).toBe('rgba(255, 255, 255, 0.92)')
    await expect(style.textDecorationColor).toBe('rgb(235, 16, 0)')
  },
}

/**
 * A light card on a dark band takes the light link back whole: the underline
 * follows the text through the hover, rather than keeping the dark band's
 * brand rule. The link's colour is set to red-700 to stand in for `:hover`.
 */
export const LinkInLightCardOnInk: Story = {
  args: Everything.args,
  render: (args) => (
    <div data-surface="ink" className="bg-ink p-8">
      <div data-surface="white" className="bg-white p-8">
        <RichText {...args} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'a link' })
    await expect(getComputedStyle(link).textDecorationColor).toBe('rgb(235, 16, 0)')
    link.style.color = 'rgb(168, 11, 0)'
    // The rule eases with the colour (`transition-colors`), so it is read settled.
    await waitFor(() => expect(getComputedStyle(link).textDecorationColor).toBe('rgb(168, 11, 0)'))
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

export const ArticleHeadingBreak: Story = {
  args: {
    body: [
      block('h2', 'Nothing should be sacred anymore.\nNothing is “too big to cut.”'),
      block('normal', 'First line.\nSecond line.'),
    ] as unknown as Body,
  },
  render: ({ body }) => (
    <div className="max-w-[822px]">
      <PortableTextBody value={body} variant="article" />
    </div>
  ),
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const heading = canvasElement.querySelector('h2')!
    await expect(getComputedStyle(heading).fontWeight).toBe('300')
    await expect(heading.getBoundingClientRect().height).toBeCloseTo(88, 0)
    await expect(canvasElement.querySelector('p')!.getBoundingClientRect().height).toBeCloseTo(
      64,
      0,
    )
  },
}

export const ArticleHeadingBreakMobile: Story = {
  ...ArticleHeadingBreak,
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const heading = canvasElement.querySelector('h2')!
    await expect(getComputedStyle(heading).fontWeight).toBe('300')
    await expect(getComputedStyle(heading.querySelector('span')!).whiteSpace).toBe('normal')
    await expect(getComputedStyle(canvasElement.querySelector('p span')!).whiteSpace).toBe(
      'pre-line',
    )
  },
}
