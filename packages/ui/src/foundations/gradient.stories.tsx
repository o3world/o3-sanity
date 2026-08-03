import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { figmaUrl, gradients } from './figma-home-spec'
import { Callout, Mono, Page, Row, Section, SpecTable } from './spec-ui'

const meta = {
  title: 'Foundations/Gradient',
  parameters: {
    layout: 'fullscreen',
    design: { type: 'figma', url: figmaUrl('1680-2134') },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * The one part of the Figma extraction already promoted to real tokens — it
 * landed ahead of the rest of the adoption, because the prototype
 * has no gradients at all.
 *
 * Every specimen below paints from the shipped custom property, not from a
 * copy of the value, so a drifting token shows up here as a visual break.
 */
export const Gradients: Story = {
  render: () => (
    <Page
      title="Gradient"
      intro={
        <>
          Eight fills, all live in <Mono>packages/tailwind-config/tokens/gradient.css</Mono>. The
          prototype had no gradients, so this part was purely additive and landed as tokens ahead of
          the rest of the adoption. Reach for them with{' '}
          <Mono>bg-(image:--gradient-card-scrim)</Mono>, or the <Mono>text-gradient</Mono> /{' '}
          <Mono>bg-brand-glow</Mono> utilities where more than one declaration is needed.
        </>
      }
    >
      <Section
        title="Statement text"
        note="The exploration's signature move: the two 64px statements are background-clipped so the copy fades as it descends. Never set as a solid."
      >
        <div className="border-line border bg-[#F0F0F0] p-12">
          <p className="text-gradient max-w-[900px] text-[52px] font-normal leading-[1.2]">
            We work with B2B and enterprise teams where the stakes — and the org charts — are real.
          </p>
        </div>
        <Callout>
          Rendered with the <Mono>text-gradient</Mono> utility. It defaults to{' '}
          <Mono>--gradient-statement</Mono>; set <Mono>background-image</Mono> after the class to
          clip a different fill.
        </Callout>
      </Section>

      <Section
        title="Card scrims"
        note="All three sit above a photographic fill and exist to hold copy legible — horizontal on the wide case-study card, weighted to the ends on the stacked one, bottom-heavy on the perspectives cards. None of them is opaque anywhere: the specimen chequer showing through is the point, and a scrim that hides it is holding the copy up with ink that should have come from the composition."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <div className="border-line relative h-[260px] overflow-hidden border">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#8a8a8a_0_14px,#6f6f6f_14px_28px)]" />
            <div className="bg-(image:--gradient-card-scrim) absolute inset-0" />
            <div className="relative flex h-full flex-col justify-end gap-2 p-8">
              <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-white">
                Healthcare
              </p>
              <p className="max-w-[24ch] text-[22px] leading-[1.2] tracking-[-0.0286em] text-white">
                Families were navigating twelve portals to manage one child&rsquo;s care.
              </p>
              <Mono className="mt-2 text-white/60">--gradient-card-scrim</Mono>
            </div>
          </div>
          <div className="border-line relative h-[260px] overflow-hidden border">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#8a8a8a_0_14px,#6f6f6f_14px_28px)]" />
            <div className="bg-(image:--gradient-card-scrim-stacked) absolute inset-0" />
            <div className="relative flex h-full flex-col justify-between gap-2 p-8">
              <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-white">
                Healthcare
              </p>
              <div className="flex flex-col gap-2">
                <p className="max-w-[24ch] text-[22px] leading-[1.2] tracking-[-0.0286em] text-white">
                  Families were navigating twelve portals.
                </p>
                <Mono className="text-white/60">--gradient-card-scrim-stacked</Mono>
              </div>
            </div>
          </div>
          <div className="border-line relative h-[260px] overflow-hidden border">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#8a8a8a_0_14px,#6f6f6f_14px_28px)]" />
            <div className="bg-(image:--gradient-card-veil) absolute inset-0" />
            <div className="relative flex h-full flex-col justify-end gap-2 p-8">
              <p className="max-w-[24ch] text-[22px] leading-[1.2] text-white">
                Why your best people keep solving the wrong problem
              </p>
              <Mono className="text-white/60">--gradient-card-veil</Mono>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Brand glow"
        note="Figma variable Gradient/Red/1 — two stacked radials. This, not a flat red, is how brand colour reaches the page at scale."
      >
        <div className="bg-brand-glow flex h-[320px] flex-col justify-end p-10">
          <p className="max-w-[26ch] text-[24px] leading-[1.2] text-white">
            The thinking behind the work.
          </p>
          <Mono className="mt-3 text-white/60">--gradient-brand-glow / .bg-brand-glow</Mono>
        </div>
      </Section>

      <Section
        title="Surface washes and band fades"
        note="Light bands wash between white and #F0F0F0 so consecutive sections separate without a rule; the ink fade bleeds the CTA band into the footer."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {(
            [
              ['--gradient-surface-wash', 'bg-(image:--gradient-surface-wash)'],
              ['--gradient-surface-wash-angled', 'bg-(image:--gradient-surface-wash-angled)'],
              ['--gradient-ink-fade', 'bg-(image:--gradient-ink-fade)'],
            ] as const
          ).map(([token, cls]) => (
            <div key={token} className="border-line flex flex-col border">
              <div className={`h-40 w-full ${cls}`} />
              <div className="p-4">
                <Mono className="text-fg-muted">{token}</Mono>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Reference">
        <SpecTable columns={['Token', 'Value', 'Role']}>
          {gradients.map((g) => (
            <Row key={g.name}>
              <td className="whitespace-nowrap align-top">
                <Mono>{g.token}</Mono>
              </td>
              <td className="align-top">
                <Mono className="text-fg-muted block max-w-[46ch] break-words">{g.value}</Mono>
              </td>
              <td className="text-fg-muted max-w-[34ch] align-top leading-[1.55]">{g.role}</td>
            </Row>
          ))}
        </SpecTable>
      </Section>
    </Page>
  ),
}
