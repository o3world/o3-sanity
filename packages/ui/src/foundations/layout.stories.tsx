import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  elementPadding,
  figmaUrl,
  layout,
  radius,
  sectionRhythm,
  spacingScale,
} from './figma-home-spec'
import { Callout, Mono, Page, Row, Section, SpecTable } from './spec-ui'

const meta = {
  title: 'Foundations/Layout',
  parameters: {
    layout: 'fullscreen',
    design: { type: 'figma', url: figmaUrl('1680-2134') },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * Gutter, container, spacing steps, per-band rhythm, and the corner story —
 * which is that there isn't one. The exploration is square.
 */
export const Layout: Story = {
  render: () => (
    <Page
      title="Layout"
      intro={
        <>
          The page gutter is <Mono>96px</Mono> (Figma <Mono>Section/section-margin-left</Mono>),
          giving a <Mono>1248px</Mono> content column at the 1440px design width. Vertical rhythm is
          hand-tuned per band rather than one shared value — <Mono>128px</Mono> and{' '}
          <Mono>192px</Mono> do most of the work.
        </>
      }
    >
      <Section title="Grid">
        <div className="border-line overflow-hidden border">
          <div className="relative bg-[#F0F0F0]" style={{ height: 200 }}>
            <div
              className="bg-brand/10 absolute inset-y-0"
              style={{ left: 0, width: `${(layout.gutter / layout.designWidth) * 100}%` }}
            />
            <div
              className="bg-brand/10 absolute inset-y-0"
              style={{ right: 0, width: `${(layout.gutter / layout.designWidth) * 100}%` }}
            />
            <div
              className="border-ink-soft/30 absolute inset-y-0 border-x border-dashed"
              style={{
                left: `${(layout.gutter / layout.designWidth) * 100}%`,
                right: `${(layout.gutter / layout.designWidth) * 100}%`,
              }}
            />
            <div className="text-fg absolute inset-0 flex items-center justify-center">
              <Mono>
                {layout.contentWidth}px content · {layout.gutter}px gutter · {layout.designWidth}px
                frame
              </Mono>
            </div>
          </div>
        </div>
        <Callout>
          The shipped <Mono>--container-section</Mono> is <Mono>1240px</Mono> with a{' '}
          <Mono>24px</Mono> gutter. The 8px width difference is negligible; the gutter difference is
          not — 96px is what makes the frame read as editorial.
        </Callout>
      </Section>

      <Section
        title="Spacing scale"
        note="The steps the frame actually uses. 4–20 are bound to Figma element-padding variables; 128 is Layout/Layout 128."
      >
        <div className="flex flex-col gap-2">
          {spacingScale.map((step) => (
            <div key={step} className="flex items-center gap-4">
              <Mono className="text-fg-muted w-12 shrink-0 text-right">{step}</Mono>
              <div className="h-5 bg-[#0A0A0A]" style={{ width: step }} />
              {Object.entries(elementPadding).find(([, v]) => v === step) ? (
                <Mono className="text-fg-subtle">
                  Element/padding-
                  {Object.entries(elementPadding).find(([, v]) => v === step)?.[0]}
                </Mono>
              ) : null}
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Section rhythm"
        note="Padding is asymmetric per band — there is no single vertical value to tokenise."
      >
        <SpecTable columns={['Band', 'Padding', 'Gap', 'Surface']}>
          {sectionRhythm.map((s) => (
            <Row key={s.section}>
              <td className="align-top font-medium">{s.section}</td>
              <td className="align-top">
                <Mono>{s.padding}</Mono>
              </td>
              <td className="align-top">
                <Mono>{s.gap}</Mono>
              </td>
              <td className="align-top">
                <Mono className="text-fg-muted">{s.surface}</Mono>
              </td>
            </Row>
          ))}
        </SpecTable>
        <Callout>
          <Mono>--spacing-section-y</Mono> is one <Mono>clamp(120px, 14vw, 200px)</Mono> for every
          band. That model cannot express the table above, so adopting this rhythm means either a
          variant on <Mono>SectionShell</Mono> or the design accepting a single value.
        </Callout>
      </Section>

      <Section
        title="Corners"
        note="Buttons, case-study cards, perspectives cards and media frames all carry radius 0."
      >
        <div className="flex flex-wrap items-end gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="h-24 w-24 bg-[#0A0A0A]" style={{ borderRadius: radius.card }} />
            <Mono className="text-fg-muted">cards · {radius.card}</Mono>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="h-24 w-24 bg-[#0A0A0A]" style={{ borderRadius: radius.button }} />
            <Mono className="text-fg-muted">buttons · {radius.button}</Mono>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="h-24 w-24 bg-[#D3D3D3]" style={{ borderRadius: radius.iconChip }} />
            <Mono className="text-fg-muted">icon chip · {radius.iconChip}</Mono>
          </div>
        </div>
        <Callout>
          The shipped tokens are <Mono>--radius-btn 6px</Mono> and <Mono>--radius-card 16px</Mono>,
          used across 25 call sites. Figma also declares a <Mono>radius-small: 4</Mono> variable
          that the Home frame never applies.
        </Callout>
      </Section>
    </Page>
  ),
}
