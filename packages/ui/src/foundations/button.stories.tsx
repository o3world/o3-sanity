import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '../components/ui/button'
import { button, figmaUrl } from './figma-home-spec'
import { Callout, Mono, Page, Row, Section, SpecTable } from './spec-ui'

const meta = {
  title: 'Foundations/Button spec',
  parameters: {
    layout: 'fullscreen',
    design: { type: 'figma', url: figmaUrl('1868-3262') },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * The Figma button, rebuilt from the spec rather than from the `Button`
 * component — so the two can be compared honestly further down the page.
 * The trailing glyph is Material Symbols Outlined in Figma; Storybook has no
 * such face loaded, so it stands in as an inline arrow at the same 20px box.
 */
function FigmaButton({
  size = 'base',
  fill = 'dark',
  children,
}: {
  size?: keyof typeof button.sizes
  fill?: keyof typeof button.fills
  children: string
}) {
  const s = button.sizes[size]
  const f = button.fills[fill]
  const [py, px] = s.padding.split(' ')
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        background: f.background,
        color: f.label,
        padding: `${py} ${px}`,
        gap: s.gap,
        borderRadius: button.radius,
        fontSize: button.label.size,
        lineHeight: button.label.lineHeight,
        fontWeight: button.label.weight,
      }}
    >
      {children}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M4 10h11M11 5.5 15.5 10 11 14.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

/**
 * Figma component set `Button / Solid` — two sizes, two fills, no red, no
 * radius. Shown beside the shipped `Button` so the gap is visible rather than
 * described.
 */
export const ButtonSpec: Story = {
  render: () => (
    <Page
      title="Button"
      intro={
        <>
          Figma component set <Mono>Button / Solid</Mono>: two sizes × two fills, an{' '}
          <Mono>18px / 24px</Mono> Figtree Medium label, a trailing <Mono>arrow_forward</Mono> at
          20px, and square corners. Notably, the exploration contains{' '}
          <strong>no red button anywhere</strong>.
        </>
      }
    >
      <Section
        title="Sizes and fills"
        note="Padding is the only difference between the two sizes; the label is identical."
      >
        <div className="border-line flex flex-wrap items-center gap-8 border bg-white p-10">
          <FigmaButton size="base" fill="dark">
            View our work
          </FigmaButton>
          <FigmaButton size="large" fill="dark">
            See all partners
          </FigmaButton>
        </div>
        <div className="flex flex-wrap items-center gap-8 bg-[#0A0A0A] p-10">
          <FigmaButton size="base" fill="light">
            View our work
          </FigmaButton>
          <FigmaButton size="large" fill="light">
            See all partners
          </FigmaButton>
        </div>
        <SpecTable columns={['Variant', 'Padding', 'Gap', 'Background', 'Label']}>
          {(['base', 'large'] as const).flatMap((size) =>
            (['dark', 'light'] as const).map((fill) => (
              <Row key={`${size}-${fill}`}>
                <td className="whitespace-nowrap align-top font-medium">
                  {size} · {fill}
                </td>
                <td className="align-top">
                  <Mono>{button.sizes[size].padding}</Mono>
                </td>
                <td className="align-top">
                  <Mono>{button.sizes[size].gap}px</Mono>
                </td>
                <td className="align-top">
                  <Mono>{button.fills[fill].background}</Mono>
                </td>
                <td className="align-top">
                  <Mono>{button.fills[fill].label}</Mono>
                </td>
              </Row>
            )),
          )}
        </SpecTable>
      </Section>

      <Section
        title="Against the shipped Button"
        note="Left: rebuilt from the Figma spec. Right: the Button component as it ships today."
      >
        <div className="border-line bg-line grid gap-px border md:grid-cols-2">
          <div className="flex flex-col items-start gap-4 bg-white p-10">
            <p className="eyebrow text-fg-subtle">Figma</p>
            <FigmaButton size="base" fill="dark">
              View our work
            </FigmaButton>
          </div>
          <div className="flex flex-col items-start gap-4 bg-white p-10">
            <p className="eyebrow text-fg-subtle">Shipped</p>
            <Button arrow>View our work</Button>
          </div>
        </div>
        <Callout>
          The shipped component matches the spec: square corners from the radius tokens, the label
          on <Mono>--text-button</Mono>, the cva variant set on Figma&apos;s vocabulary —{' '}
          <Mono>dark | light | ghost</Mono> over <Mono>base | large</Mono>, no red fill anywhere,
          the glyph on a 20px box. The one remaining delta is a <strong>drawing</strong>: the arrow
          is the house <Mono>ArrowIcon</Mono>, stroked at 2.2, where Figma sets Material
          Symbols&apos; <Mono>arrow_forward</Mono>. ADR 0009 says a glyph is an inline SVG of the
          Material path, so that is a redraw whenever someone wants it, not a contract gap.
        </Callout>
      </Section>
    </Page>
  ),
}
