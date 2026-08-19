import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { KeyMetricCard, KeyMetricCards } from './KeyMetricCard'

/**
 * The kit's `Key Metric Card` (`4404:3916`, Cards canvas `340:1577` of the
 * _O3XO: UI kit_ file) and the row it is drawn in (`Key Metric Card Group`,
 * `4404:3960`).
 *
 * **The brand is pinned.** The plate is `accent`, a role only O3XO's token
 * package declares, so there is nothing for the Brand toolbar to ask — the
 * toolbar stays live on the shared-package stories, where flipping the brand
 * is the standing paint-leak test (ADR 0028).
 *
 * Neither the kit nor the live site draws a state on this card: it carries no
 * link and no control, so there is no hover or focus to invent.
 */
const meta = {
  title: 'Content/Cards/KeyMetricCard',
  component: KeyMetricCard,
  globals: { brand: 'o3xo' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof KeyMetricCard>

export default meta
type Story = StoryObj<typeof meta>

/** One card, as the component frame draws it. */
export const Default: Story = {
  args: { value: '50%+', label: 'Average efficiency gains' },
}

/** The values are strings, so `<90 days` and `10x` sit in the same row. */
export const LongValue: Story = {
  args: { value: '<90 days', label: 'Average time to prove ROI' },
}

const metrics = (...pairs: [string, string][]) =>
  pairs.map(([value, label], i) => ({ key: `metric-${i}`, value, label }))

/**
 * The group — the homepage's "Key metrics across accounts" band, which is
 * where these three numbers come from.
 */
export const Row: Story = {
  args: { value: '', label: '' },
  render: () => (
    <KeyMetricCards
      items={metrics(
        ['50%+', 'Average efficiency gains'],
        ['10x', 'Faster information access'],
        ['<90 days', 'Average time to prove ROI'],
      )}
    />
  ),
}

/**
 * On ink — the surface the homepage band declares. The card is a light card on
 * a dark band, so it declares `white` and gets the light text roles back.
 */
export const OnInk: Story = {
  ...Row,
  globals: { brand: 'o3xo', backgrounds: { value: 'ink' } },
  render: () => (
    <div className="bg-ink p-12 text-white" data-surface="ink">
      <KeyMetricCards
        items={metrics(
          ['50%+', 'Average efficiency gains'],
          ['10x', 'Faster information access'],
          ['<90 days', 'Average time to prove ROI'],
        )}
      />
    </div>
  ),
}

/** Four metrics in a three-across row — the count is the editor's. */
export const Four: Story = {
  args: { value: '', label: '' },
  render: () => (
    <KeyMetricCards
      items={metrics(
        ['50%+', 'Average efficiency gains'],
        ['10x', 'Faster information access'],
        ['<90 days', 'Average time to prove ROI'],
        ['3', 'Industries served'],
      )}
    />
  ),
}

/** One card in the row must read as a figure, not as a row that failed to fill. */
export const One: Story = {
  args: { value: '', label: '' },
  render: () => <KeyMetricCards items={metrics(['50%+', 'Average efficiency gains'])} />,
}

/** Stacked at 402 — the plate is full width and the figure keeps its step. */
export const Mobile: Story = {
  ...Row,
  globals: { brand: 'o3xo', viewport: { value: 'mobile' } },
}
