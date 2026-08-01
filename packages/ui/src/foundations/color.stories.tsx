import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { alphaOnInk, alphaOnLight, colors, figmaUrl, type ColorSpec } from './figma-home-spec'
import { Callout, Mono, Page, Row, Section, SpecTable } from './spec-ui'

const meta = {
  title: 'Foundations/Color',
  parameters: {
    layout: 'fullscreen',
    design: { type: 'figma', url: figmaUrl('1680-2134') },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function Swatch({ spec }: { spec: ColorSpec }) {
  return (
    <div className="border-line flex flex-col border">
      <div className="h-24 w-full" style={{ background: spec.value }} />
      <div className="flex flex-col gap-1 p-4">
        <p className="text-[15px] font-medium">{spec.name}</p>
        <Mono className="text-fg-muted">{spec.value}</Mono>
        {spec.variable ? <Mono className="text-fg-subtle">Figma: {spec.variable}</Mono> : null}
      </div>
    </div>
  )
}

/**
 * The four neutrals, the one red, and where each is actually used. Read the
 * "nearest token" column as a mapping, not an equivalence — two of these
 * differ from what `@o3/tailwind-config` ships.
 */
export const Palette: Story = {
  render: () => (
    <Page
      title="Color"
      intro={
        <>
          Every fill on the Home frame, read off Figma. The exploration runs on{' '}
          <strong>four</strong> neutrals rather than the prototype&rsquo;s three:{' '}
          <Mono>#0A0A0A</Mono> carries almost all the ink weight, while <Mono>#030303</Mono>{' '}
          survives mainly inside gradient stops.
        </>
      }
    >
      <Section
        title="Solid fills"
        note="Bound Figma variables are named where they exist; the rest are raw fills."
      >
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {colors.map((spec) => (
            <Swatch key={spec.name} spec={spec} />
          ))}
        </div>
      </Section>

      <Section
        title="Roles"
        note="Where each fill appears on the page, and the closest thing the token package already ships."
      >
        <SpecTable columns={['Name', 'Value', 'Role', 'Nearest token']}>
          {colors.map((spec) => (
            <Row key={spec.name}>
              <td className="whitespace-nowrap align-top font-medium">{spec.name}</td>
              <td className="align-top">
                <Mono>{spec.value}</Mono>
              </td>
              <td className="text-fg-muted max-w-[38ch] align-top leading-[1.55]">{spec.role}</td>
              <td className="text-fg-subtle align-top">
                {spec.token ? <Mono>{spec.token}</Mono> : '—'}
              </td>
            </Row>
          ))}
        </SpecTable>
      </Section>

      <Section
        title="Copy on dark"
        note="On ink bands the design tints white rather than reaching for a solid grey — so the copy composites over whatever photography sits behind it."
      >
        <Callout>
          This is a real behavioural difference, not a shade preference. The token package&rsquo;s{' '}
          <Mono>fg-inverse-muted</Mono> is solid <Mono>#A4A4A4</Mono>, which stays flat over an
          image; <Mono>rgba(255,255,255,0.65)</Mono> does not.
        </Callout>
        <div className="grid grid-cols-2 gap-5 bg-[#0A0A0A] p-6 md:grid-cols-3">
          {alphaOnInk.map((spec) => (
            <div key={spec.name} className="flex flex-col border border-white/15">
              <div className="h-24 w-full" style={{ background: spec.value }} />
              <div className="flex flex-col gap-1 p-4">
                <p className="text-[15px] font-medium text-white">{spec.name}</p>
                <Mono className="text-white/60">{spec.value}</Mono>
              </div>
            </div>
          ))}
        </div>
        <SpecTable columns={['Name', 'Value', 'Role']}>
          {alphaOnInk.map((spec) => (
            <Row key={spec.name}>
              <td className="whitespace-nowrap align-top font-medium">{spec.name}</td>
              <td className="align-top">
                <Mono>{spec.value}</Mono>
              </td>
              <td className="text-fg-muted max-w-[52ch] align-top leading-[1.55]">{spec.role}</td>
            </Row>
          ))}
        </SpecTable>
      </Section>

      <Section
        title="Copy on light"
        note="The same trick in reverse — the one place the design tints ink rather than reaching for a grey."
      >
        <div className="grid grid-cols-2 gap-5 bg-[#F0F0F0] p-6 md:grid-cols-3">
          {alphaOnLight.map((spec) => (
            <div key={spec.name} className="border-line flex flex-col border">
              <div className="h-24 w-full" style={{ background: spec.value }} />
              <div className="flex flex-col gap-1 bg-white p-4">
                <p className="text-[15px] font-medium">{spec.name}</p>
                <Mono className="text-fg-muted">{spec.value}</Mono>
                <p className="text-fg-muted mt-1 text-[13px] leading-normal">{spec.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Where the red went">
        <Callout>
          Brand red appears as a <strong>flat fill exactly once</strong> on the entire 9573px frame
          — the three footer link-group headers. Everywhere else it arrives as the{' '}
          <Mono>--gradient-brand-glow</Mono> radial. The token package currently defaults{' '}
          <Mono>Eyebrow</Mono> and <Mono>Button</Mono> to brand red, which is the single loudest
          disagreement between the two generations.
        </Callout>
      </Section>
    </Page>
  ),
}
