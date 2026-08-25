import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { figmaUrl, typeScale, type TypeSpec } from './figma-home-spec'
import { Callout, Mono, Page, Row, Section, SpecTable } from './spec-ui'

const meta = {
  title: 'Foundations/Typography',
  parameters: {
    layout: 'fullscreen',
    design: { type: 'figma', url: figmaUrl('1680-2134') },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Sample copy per step, taken from the frame itself wherever it fits. */
const SAMPLE: Record<string, string> = {
  statement: 'We work with B2B and enterprise teams where the stakes are real.',
  cta: 'Let’s get started on your next big thing.',
  headline: 'Most firms ship what you asked for.',
  stat: '89% → 114%',
  attribution: 'Business Leader, Global Health Brand',
  numeral: '01',
  narrative: 'Families were navigating twelve portals to manage one child’s care.',
  lead: 'We don’t dabble across every tool. We build real, certified depth in a few platforms.',
  'body-lg': 'Structured content and real-time editing, wired into the systems your team runs.',
  platform: 'Sanity',
  button: 'View our work',
  'eyebrow-lg': 'Our partners',
  eyebrow: 'Healthcare',
  'stat-label': 'NRR',
  'nav-header': 'Company',
  'nav-link': 'Careers',
  meta: '3 mins · 7/27/26',
  legal: '© 2026 O3 World, LLC. All rights reserved.',
}

function specimenStyle(spec: TypeSpec) {
  return {
    fontSize: `${spec.size}px`,
    lineHeight: spec.lineHeight === 'normal' ? 'normal' : spec.lineHeight,
    letterSpacing: spec.letterSpacing === '0' ? 'normal' : spec.letterSpacing,
    fontWeight: spec.weight,
    textTransform: spec.uppercase ? ('uppercase' as const) : undefined,
  }
}

function Specimen({ spec }: { spec: TypeSpec }) {
  return (
    <div className="border-line flex flex-col gap-4 border-b py-8 last:border-b-0 md:flex-row md:gap-10">
      <div className="flex w-[190px] shrink-0 flex-col gap-1.5 pt-1">
        <p className="text-[15px] font-medium">{spec.name}</p>
        <Mono className="text-fg-muted">
          {spec.size}px / {spec.lineHeight}
        </Mono>
        <Mono className="text-fg-subtle">
          {spec.style} {spec.weight}
          {spec.letterSpacing !== '0' ? ` · ${spec.letterSpacing}` : ''}
        </Mono>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-sans" style={specimenStyle(spec)}>
          {SAMPLE[spec.name] ?? 'The quick brown fox'}
        </p>
        <p className="text-fg-muted mt-3 max-w-[62ch] text-[13.5px] leading-[1.55]">{spec.role}</p>
      </div>
    </div>
  )
}

/**
 * The full ramp, rendered at the exact size / weight / tracking Figma
 * specifies. Figtree throughout — the display voice comes from size and
 * tracking, not from a second family.
 */
export const Scale: Story = {
  render: () => (
    <Page
      title="Typography"
      intro={
        <>
          Eighteen steps, all Figtree, all at a <strong>fixed px ramp</strong> for the 1440px design
          width. Two things here overturned the prototype outright: display weight is{' '}
          <strong>400</strong>, not 300, and line-height is <Mono>1.2em</Mono> almost everywhere
          rather than 1.05–1.3. The tokens keep fluid clamps and anchor each{' '}
          <strong>maximum</strong> to its step here — the floors are interim and belong to #39.
        </>
      }
    >
      {/*
        Keep inline elements followed by PUNCTUATION, never by a word. Prettier
        reflows JSX text, and a space that ends up between an element and the
        line break is dropped by the oxc transform Storybook builds with (though
        not by Babel, which is why Prettier thinks the reflow is safe) — the
        words render glued together.
      */}
      <Callout>
        Figma&rsquo;s <Mono>Interactive/Large</Mono> variable still names its family as{' '}
        <strong>Inter</strong>, but every button that consumes it renders Figtree Medium — the
        variable&rsquo;s family is stale, and the rendered value is what&rsquo;s recorded here.
      </Callout>

      <Section
        title="Specimens"
        note="Rendered from the extracted spec, so a specimen and the reference table can never disagree."
      >
        <div className="flex flex-col">
          {typeScale.map((spec) => (
            <Specimen key={`${spec.name}-${spec.size}`} spec={spec} />
          ))}
        </div>
      </Section>

      <Section title="Reference">
        <SpecTable columns={['Step', 'Size', 'Line-height', 'Tracking', 'Weight']}>
          {typeScale.map((spec) => (
            <Row key={`${spec.name}-row`}>
              <td className="whitespace-nowrap align-top font-medium">{spec.name}</td>
              <td className="align-top">
                <Mono>{spec.size}px</Mono>
              </td>
              <td className="align-top">
                <Mono>{spec.lineHeight}</Mono>
              </td>
              <td className="align-top">
                <Mono>{spec.letterSpacing === '0' ? '—' : spec.letterSpacing}</Mono>
              </td>
              <td className="align-top">
                <Mono>
                  {spec.weight} {spec.style}
                </Mono>
              </td>
            </Row>
          ))}
        </SpecTable>
      </Section>
    </Page>
  ),
}
