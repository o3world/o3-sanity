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
          <Mono>--container-section</Mono> was <Mono>1240px</Mono> with a <Mono>24px</Mono> gutter
          and is now <Mono>1248px</Mono> with <Mono>--spacing-gutter: 96px</Mono>. The 8px width
          difference was negligible; the gutter was not — 96px is what makes the frame read as
          editorial.
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
        note="Padding is asymmetric per band, and top rarely equals bottom — so the tokens ship the three steps rather than one value."
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
          The three steps now ship as <Mono>--spacing-band-sm/md/lg</Mono> (96/128/192), with{' '}
          <Mono>--spacing-section-y</Mono> kept as a default for a band that has no frame of its
          own. What tokens cannot express is the per-band asymmetry in the table above — that needs
          a rhythm variant on <Mono>SectionShell</Mono>, which is #41.
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
          <Mono>--radius-btn</Mono> and <Mono>--radius-card</Mono> were <Mono>6px</Mono> and{' '}
          <Mono>16px</Mono>; both are <Mono>0</Mono> now. The token names stay so a future reversal
          is one edit rather than a sweep of 25 call sites. Figma also declares a{' '}
          <Mono>radius-small: 4</Mono> variable that the Home frame never applies.
        </Callout>
      </Section>
    </Page>
  ),
}
