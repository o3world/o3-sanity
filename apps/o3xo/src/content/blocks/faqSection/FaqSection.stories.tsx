import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, within } from 'storybook/test'

import { FaqSection } from './FaqSection'

/**
 * The kit's FAQ band (`4406:7288`, Layouts canvas) and the accordion inside it
 * (`310:1977`).
 *
 * **The brand is pinned** for the reason the yellow cards' stories are: the
 * row's leading disc is `accent`, a role only O3XO's token package declares.
 *
 * The picture the band sits on is `backgroundMedia`, which resolves through
 * Sanity's CDN — a story has no dataset, so these draw on the `ink` the band
 * declares underneath it. The picture is proven in the render test instead.
 *
 * The copy is the live o3xo.ai `/about/approach` FAQ, which is what the kit's
 * frame draws.
 */
const questions = (...pairs: [string, string][]) =>
  pairs.map(([heading, body], index) => ({
    _key: `q-${index}`,
    _type: 'question' as const,
    heading,
    body,
  }))

const meta = {
  title: 'Content/Sections/FaqSection',
  component: FaqSection,
  globals: { brand: 'o3xo' },
  parameters: { layout: 'fullscreen' },
  args: {
    surface: 'ink' as const,
    heading: 'AI Implementation FAQ',
    subheading:
      'Quick answers to the questions we hear most about integrating AI into your business.',
    questions: questions(
      [
        'How do we start working with O3XO?',
        "We don't build AI for AI's sake—everything starts with your business objectives. Some clients need help identifying use cases and building a roadmap, while others come with defined KPIs ready to scope. In both cases, we focus on measurable impact and ROI. You can start by taking our AI assessment.",
      ],
      [
        'Should we build or buy AI?',
        "Building creates solutions tailored to your needs and minimizes disruption by bridging systems. Buying may fit if a tool aligns closely with your goals, but it often comes with licensing, training, and implementation costs. We'll help you weigh the trade-offs.",
      ],
      [
        'Can AI work with our current systems?',
        'Yes. We emphasize integration over disruption. We build solutions that connect with both legacy systems and modern SaaS.',
      ],
    ),
  },
} satisfies Meta<typeof FaqSection>

export default meta
type Story = StoryObj<typeof meta>

/** How the band arrives: every row closed, which is the only state the kit draws. */
export const Default: Story = {}

/**
 * The turn — the one thing the kit does not draw, invented from tokens.
 *
 * Rows are independent, the way the live site behaves: opening the second
 * leaves the first shut, and a second click on the same row closes it again.
 */
export const OpensAndCloses: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const second = canvas.getByRole('button', { name: 'Should we build or buy AI?' })
    const first = canvas.getByRole('button', { name: 'How do we start working with O3XO?' })

    await userEvent.click(second)
    await expect(second).toHaveAttribute('aria-expanded', 'true')
    await expect(first).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.getByText(/Building creates solutions/)).toBeVisible()

    await userEvent.click(second)
    await expect(second).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.getByText(/Building creates solutions/)).not.toBeVisible()
  },
}

/** The keyboard reaches the same turn: rows are buttons, so Enter opens one. */
export const OpensFromTheKeyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = canvas.getByRole('button', { name: 'How do we start working with O3XO?' })

    first.focus()
    await expect(first).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(first).toHaveAttribute('aria-expanded', 'true')
  },
}

/** One question — the shortest band the schema allows. */
export const SingleQuestion: Story = {
  args: {
    subheading: undefined,
    questions: questions([
      'How soon will we see results?',
      'Simple solutions can launch in weeks.',
    ]),
  },
}

/** Stacked at 402 — the column takes the full measure. */
export const Mobile: Story = {
  globals: { brand: 'o3xo', viewport: { value: 'mobile' } },
}
