import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { drift, FIGMA_SOURCE, figmaUrl } from './figma-home-spec'
import { Callout, Mono, Page, Row, Section, SpecTable } from './spec-ui'

const meta = {
  title: 'Foundations/Overview',
  parameters: {
    layout: 'fullscreen',
    design: { type: 'figma', url: figmaUrl(FIGMA_SOURCE.nodeId) },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * Start here. What was extracted, why almost none of it became a token, and
 * the complete list of disagreements between the two design generations.
 */
export const Overview: Story = {
  render: () => (
    <Page
      title="The O3DX exploration, extracted"
      intro={
        <>
          Every value in this section was read off the Figma frame <Mono>{FIGMA_SOURCE.frame}</Mono>{' '}
          ({FIGMA_SOURCE.width}×{FIGMA_SOURCE.height}, node <Mono>{FIGMA_SOURCE.nodeId}</Mono>) in{' '}
          <em>{FIGMA_SOURCE.name}</em>. Nothing is inferred or rounded to taste. The extraction
          lives as data in <Mono>packages/ui/src/foundations/figma-home-spec.ts</Mono>, and these
          pages render it.
        </>
      }
    >
      <Section title="Why this is data, not tokens">
        <p className="text-fg-muted max-w-[72ch] text-[15px] leading-[1.7]">
          <Mono>@o3/tailwind-config</Mono> is extracted from the HTML prototype in{' '}
          <Mono>prototype/</Mono>. This Figma file is a <strong>later, different generation</strong>{' '}
          of the same design, and most of what it specifies contradicts the prototype rather than
          extending it — a fixed px type ramp instead of fluid clamps, display weight 400 instead of
          300, square corners instead of 6/16px radii, a 96px page gutter instead of 24px.
        </p>
        <p className="text-fg-muted max-w-[72ch] text-[15px] leading-[1.7]">
          Merging that in silently would have retuned every shipped section block. So it is recorded
          here at full fidelity — enough to review and adopt from — with zero effect on what the
          site currently renders. The table below is the adoption decision.
        </p>
        <Callout>
          One exception was promoted to real tokens: the <strong>gradients</strong>, in{' '}
          <Mono>packages/tailwind-config/tokens/gradient.css</Mono>. The prototype has none, so they
          collide with nothing.
        </Callout>
      </Section>

      <Section
        title="Drift"
        note="Every place the two generations disagree, and what adopting the Figma value would cost."
      >
        <SpecTable columns={['Concern', 'Shipped today', 'Figma', 'Impact']}>
          {drift.map((d) => (
            <Row key={d.concern}>
              <td className="whitespace-nowrap align-top font-medium">{d.concern}</td>
              <td className="text-fg-muted max-w-[28ch] align-top leading-[1.55]">{d.current}</td>
              <td className="max-w-[28ch] align-top leading-[1.55]">{d.figma}</td>
              <td className="text-fg-muted max-w-[34ch] align-top leading-[1.55]">{d.impact}</td>
            </Row>
          ))}
        </SpecTable>
      </Section>

      <Section title="Reading order">
        <ul className="text-fg-muted flex max-w-[72ch] list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.7]">
          <li>
            <strong className="text-fg">Color</strong> — four neutrals, and the discovery that brand
            red is a flat fill exactly once on the whole page.
          </li>
          <li>
            <strong className="text-fg">Gradient</strong> — the seven fills that already landed as
            tokens, including the background-clipped statement text.
          </li>
          <li>
            <strong className="text-fg">Typography</strong> — eighteen steps at the fixed px ramp.
          </li>
          <li>
            <strong className="text-fg">Layout</strong> — the 96px gutter, per-band rhythm, and the
            square-corner story.
          </li>
          <li>
            <strong className="text-fg">Button spec</strong> — the Figma component beside the
            shipped one.
          </li>
        </ul>
        <Callout>
          Each page carries a <strong>Design</strong> tab (addon-designs) linking straight to the
          Figma node it was read from, so any value here can be checked against source in one click.
        </Callout>
      </Section>
    </Page>
  ),
}
