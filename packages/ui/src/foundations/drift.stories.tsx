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

const OUTCOME_LABEL = {
  adopted: 'Adopted',
  partial: 'Values adopted',
} as const

/**
 * Start here. What the tokens are extracted from, the rule for what earns a
 * token, and the complete before/after of the Figma adoption.
 */
export const Overview: Story = {
  render: () => (
    <Page
      title="The design tokens, and where they come from"
      intro={
        <>
          Every token in <Mono>@o3/tailwind-config</Mono> is read off the canonical Figma frames in{' '}
          <em>{FIGMA_SOURCE.name}</em> — principally <Mono>{FIGMA_SOURCE.frame}</Mono> (
          {FIGMA_SOURCE.width}×{FIGMA_SOURCE.height}, node <Mono>{FIGMA_SOURCE.nodeId}</Mono>), at
          the authoritative 1440 desktop width. Nothing is inferred or rounded to taste. The reading
          record lives as data in <Mono>packages/ui/src/foundations/figma-home-spec.ts</Mono>, and
          these pages render it.
        </>
      }
    >
      <Section title="What earns a token">
        <p className="text-fg-muted max-w-[72ch] text-[15px] leading-[1.7]">
          A Figma value becomes a token when <strong>either</strong> it is bound to a named Figma
          variable (<Mono>text/tertiary</Mono>, <Mono>Layout/Layout 128</Mono>,{' '}
          <Mono>Gradient/Red/1</Mono>), <strong>or</strong> it recurs — the same value doing the
          same job in two or more places across the frames.
        </p>
        <p className="text-fg-muted max-w-[72ch] text-[15px] leading-[1.7]">
          Everything else stays a <strong>literal at the call site</strong>, with its node ID in a
          comment. A value that appears exactly once is composition, not vocabulary: the pull-quote
          attribution’s <Mono>1.5em</Mono> line-height, the 5.8px carousel chip, the 87px CTA bleed
          strip, the 1026px partners measure. Promoting those would grow the token surface without
          giving a second call site anything to reach for.
        </p>
      </Section>

      <Section
        title="The adoption"
        note="These tokens were extracted from the retired HTML prototype until #37. Figma is the source of record (map #33), so where the two disagreed the Figma value won. This is that before/after — the “Was” column is history."
      >
        <SpecTable columns={['Concern', 'Was', 'Figma', 'What happened']}>
          {drift.map((d) => (
            <Row key={d.concern}>
              <td className="align-top font-medium">
                <span className="whitespace-nowrap">{d.concern}</span>
                <span
                  className={`mt-1 block text-[11px] font-normal uppercase tracking-[0.08em] ${
                    d.outcome === 'adopted' ? 'text-fg-muted' : 'text-brand'
                  }`}
                >
                  {OUTCOME_LABEL[d.outcome]}
                </span>
              </td>
              <td className="text-fg-muted max-w-[26ch] align-top leading-[1.55] line-through decoration-1 opacity-70">
                {d.current}
              </td>
              <td className="max-w-[28ch] align-top leading-[1.55]">{d.figma}</td>
              <td className="text-fg-muted max-w-[34ch] align-top leading-[1.55]">{d.impact}</td>
            </Row>
          ))}
        </SpecTable>
        <Callout>
          <strong>Values adopted</strong> means the tokens carry the Figma value but a component
          still encodes the old decision — the <Mono>Eyebrow</Mono> default tone is still brand red,
          the <Mono>Button</Mono> still defaults to a red variant the design never uses, and{' '}
          <Mono>SectionShell</Mono> cannot yet take a gradient surface or a per-band rhythm. Those
          are component contracts, not token values: #38 and #41.
        </Callout>
      </Section>

      <Section title="Two things the frames could not settle">
        <ul className="text-fg-muted flex max-w-[72ch] list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.7]">
          <li>
            <strong className="text-fg">The responsive middle.</strong> Figma specifies the 1440
            endpoint; the type clamps’ floors and <Mono>vw</Mono> slopes are a code decision, marked
            interim in <Mono>typography.css</Mono>. #39 owns reconciling them against the 402
            frames.
          </li>
          <li>
            <strong className="text-fg">Motion.</strong> The frames are static. The orbital
            vocabulary in <Mono>motion.css</Mono> is the one part of this package still sourced from{' '}
            <Mono>prototype/</Mono>, and what carries it once the prototype retires (#48) is open on
            map #33.
          </li>
        </ul>
      </Section>

      <Section title="Reading order">
        <ul className="text-fg-muted flex max-w-[72ch] list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.7]">
          <li>
            <strong className="text-fg">Color</strong> — the five neutrals, the white-at-alpha copy
            set, and the discovery that brand red is a flat fill exactly once on the whole page.
          </li>
          <li>
            <strong className="text-fg">Gradient</strong> — the seven load-bearing fills, including
            the background-clipped statement text.
          </li>
          <li>
            <strong className="text-fg">Typography</strong> — the fixed px ramp, and why there is no
            hero step.
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
