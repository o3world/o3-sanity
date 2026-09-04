import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'

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

const geometryViewports = {
  layout402: { name: 'Layout 402', styles: { width: '402px', height: '844px' } },
  layout1440: { name: 'Layout 1440', styles: { width: '1440px', height: '900px' } },
  layout1920: { name: 'Layout 1920', styles: { width: '1920px', height: '900px' } },
}

function GeometrySpecimen() {
  return (
    <div data-layout-root className="w-full overflow-x-clip bg-white py-8">
      <div data-standard-shell className="px-gutter w-full">
        <div data-structural-stage className="max-w-section bg-brand/15 mx-auto h-12 w-full" />
        <div data-statement-measure className="max-w-content bg-ink/10 mx-auto mt-4 h-8 w-full" />
        <div data-article-measure className="max-w-article bg-ink/10 mx-auto mt-4 h-8 w-full" />
      </div>
      <div data-tight-shell className="px-gutter-tight mt-8 w-full">
        <div className="bg-brand/15 h-8 w-full" />
      </div>
    </div>
  )
}

function requiredElement(canvasElement: HTMLElement, selector: string): HTMLElement {
  const element = canvasElement.querySelector<HTMLElement>(selector)
  if (!element) throw new Error(`Missing layout specimen: ${selector}`)
  return element
}

async function expectGeometry(
  canvasElement: HTMLElement,
  expected: {
    viewport: number
    gutter: number
    tightGutter: number
    stage: number
    statement: number
    article: number
  },
) {
  const standard = requiredElement(canvasElement, '[data-standard-shell]')
  const tight = requiredElement(canvasElement, '[data-tight-shell]')
  const stage = requiredElement(canvasElement, '[data-structural-stage]')
  const statement = requiredElement(canvasElement, '[data-statement-measure]')
  const article = requiredElement(canvasElement, '[data-article-measure]')

  await expect(document.documentElement.clientWidth, 'the story viewport').toBe(expected.viewport)
  await expect(parseFloat(getComputedStyle(standard).paddingLeft), 'standard gutter').toBeCloseTo(
    expected.gutter,
    0,
  )
  await expect(parseFloat(getComputedStyle(tight).paddingLeft), 'tight gutter').toBeCloseTo(
    expected.tightGutter,
    0,
  )
  await expect(stage.getBoundingClientRect().width, 'structural stage').toBeCloseTo(
    expected.stage,
    0,
  )
  await expect(statement.getBoundingClientRect().width, 'statement measure').toBeCloseTo(
    expected.statement,
    0,
  )
  await expect(article.getBoundingClientRect().width, 'article measure').toBeCloseTo(
    expected.article,
    0,
  )
  await expect(document.documentElement.scrollWidth, 'no horizontal overflow').toBe(
    document.documentElement.clientWidth,
  )
}

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
          O3 uses a product-owned <Mono>75px</Mono> gutter and <Mono>1290px</Mono> structural canvas
          at 1440, then grows to a <Mono>1728px</Mono> stage on wide screens. Figma&apos;s former
          96px edge remains the evidence for the surrounding system; this is its explicit #429
          override. Vertical rhythm is still hand-tuned per band.
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
          <Mono>--container-section: 1728px</Mono> is structural, not a reading measure. It fills
          the 1290px canvas at 1440 and caps at 1728px; <Mono>--container-content: 1034px</Mono> and{' '}
          <Mono>--container-article: 822px</Mono> keep statements and prose readable inside it.
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
        note="Case-study cards, insights cards and media frames all carry radius 0 on the Home frame this page reads, and so does its button."
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
          <Mono>--radius-card</Mono> is <Mono>0</Mono>; <Mono>--radius-btn</Mono> is{' '}
          <Mono>5px</Mono>, which is the corner the 2026-08 <Mono>Button</Mono> set (
          <Mono>2134:1785</Mono>) draws and the swatch above — read off the older Home frame — does
          not. The token names stay so a future reversal is one edit rather than a sweep of 25 call
          sites. Figma also declares a <Mono>radius-small: 4</Mono> variable that the Home frame
          never applies.
        </Callout>
      </Section>
    </Page>
  ),
}

/** Product-owned O3 geometry at the canonical 402px mobile viewport. */
export const GeometryAt402: Story = {
  parameters: { viewport: { viewports: geometryViewports } },
  globals: { brand: 'o3', viewport: { value: 'layout402' } },
  render: () => <GeometrySpecimen />,
  play: async ({ canvasElement }) => {
    await expectGeometry(canvasElement, {
      viewport: 402,
      gutter: 20,
      tightGutter: 16,
      stage: 362,
      statement: 362,
      article: 362,
    })
  },
}

/** The 1440px design viewport opens to 75px gutters and a 1290px stage. */
export const GeometryAt1440: Story = {
  parameters: { viewport: { viewports: geometryViewports } },
  globals: { brand: 'o3', viewport: { value: 'layout1440' } },
  render: () => <GeometrySpecimen />,
  play: async ({ canvasElement }) => {
    await expectGeometry(canvasElement, {
      viewport: 1440,
      gutter: 75,
      tightGutter: 75,
      stage: 1290,
      statement: 1034,
      article: 822,
    })
  },
}

/** The structural stage keeps growing after 1440, then caps at 1728px. */
export const GeometryAt1920: Story = {
  parameters: { viewport: { viewports: geometryViewports } },
  globals: { brand: 'o3', viewport: { value: 'layout1920' } },
  render: () => <GeometrySpecimen />,
  play: async ({ canvasElement }) => {
    await expectGeometry(canvasElement, {
      viewport: 1920,
      gutter: 75,
      tightGutter: 75,
      stage: 1728,
      statement: 1034,
      article: 822,
    })
  },
}
