import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { YellowTextCard, YellowTextCards } from './YellowTextCard'

/**
 * The kit's `Yellow Text Card` (`4404:3934`, Cards canvas `340:1577` of the
 * _O3XO: UI kit_ file) and the pair it is drawn in (`Yellow Text Card Group`,
 * `4404:4611`).
 *
 * **The brand is pinned**, for the reason the mark's stories are: the plate is
 * `accent`, a role only O3XO's token package declares, so there is nothing for
 * the Brand toolbar to ask.
 *
 * The copy is the Construction industry page's pain points, which is what the
 * kit's own frame draws.
 */
const meta = {
  title: 'Content/Cards/YellowTextCard',
  component: YellowTextCard,
  globals: { brand: 'o3xo' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof YellowTextCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    heading: 'Time-intensive estimation processes',
    body: 'Your estimating team spends weeks on complex bids, often missing opportunities. Automated quantity takeoffs and data-driven pricing generate comprehensive estimates in hours instead of weeks.',
  },
}

/** A heading with no body — the plate keeps its padding rather than collapsing. */
export const HeadingOnly: Story = {
  args: { heading: 'Messy handoffs from precon to construction' },
}

const panels = (...pairs: [string, string][]) =>
  pairs.map(([heading, body], i) => ({ key: `panel-${i}`, heading, body }))

/**
 * The pair — two cards, 24px apart, filling the 1200 measure. Cards in a row
 * match heights, so the shorter body leaves space rather than a shorter plate.
 */
export const Pair: Story = {
  args: {},
  render: () => (
    <YellowTextCards
      items={panels(
        [
          'Time-intensive estimation processes',
          'Your estimating team spends weeks on complex bids, often missing opportunities. Automated quantity takeoffs and data-driven pricing generate comprehensive estimates in hours instead of weeks.',
        ],
        [
          'Messy handoffs from precon to construction',
          'Critical project details get lost transitioning from office to field.',
        ],
      )}
    />
  ),
}

/** Four — what every industry page's pain-points band carries. */
export const Four: Story = {
  args: {},
  render: () => (
    <YellowTextCards
      items={panels(
        [
          'Time-intensive estimation processes',
          'Your estimating team spends weeks on complex bids, often missing opportunities.',
        ],
        [
          'Project delays + cost overruns',
          'Small issues snowball into major schedule and budget problems. Predictive AI can identify potential delays before they occur.',
        ],
        [
          'Messy handoffs from precon to construction',
          'Critical project details get lost transitioning from office to field.',
        ],
        [
          'Vendor management + productivity losses',
          'Coordinating multiple subcontractors creates constant communication overhead.',
        ],
      )}
    />
  ),
}

/** On ink — the surface the About page's principles band declares. */
export const OnInk: Story = {
  ...Pair,
  globals: { brand: 'o3xo', backgrounds: { value: 'ink' } },
  render: () => (
    <div className="bg-ink p-12 text-white" data-surface="ink">
      <YellowTextCards
        items={panels(
          [
            'Impact first, quickly + effectively',
            'We establish clear success metrics upfront, launch working use cases within 90 days, and make decisive go or no-go decisions based on actual performance — not potential.',
          ],
          [
            'Adoption is the outcome',
            'A model nobody uses has changed nothing. We design for the day after launch.',
          ],
        )}
      />
    </div>
  ),
}

/** Stacked at 402 — one plate per row. */
export const Mobile: Story = {
  ...Pair,
  globals: { brand: 'o3xo', viewport: { value: 'mobile' } },
}
