import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ArrowIcon } from './arrow-icon'
import { Button } from './ui/button'
import { DisplayHeading } from './display-heading'
import { Eyebrow } from './eyebrow'
import { SectionBackground, SectionShell, type Surface } from './section-shell'
import { Stat } from './stat'

const meta = {
  title: 'Layout/SectionShell',
  component: SectionShell,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    surface: { control: 'select', options: ['white', 'bone', 'ink'] },
    width: { control: 'select', options: ['section', 'content'] },
  },
} satisfies Meta<typeof SectionShell>

export default meta
type Story = StoryObj<typeof meta>

/** Placeholder section content that exercises the per-surface text roles. */
function PlaceholderContent({ surface }: { surface: Surface }) {
  const onInk = surface === 'ink'
  return (
    <div className="flex flex-col items-start gap-7">
      <Eyebrow tone={onInk ? 'inverse' : 'muted'}>Our Partners</Eyebrow>
      <DisplayHeading level="xl">
        We work with B2B and enterprise teams to reimagine experiences.
      </DisplayHeading>
      <p
        className={`max-w-[520px] text-lg leading-[1.55] ${onInk ? 'text-fg-inverse-muted' : 'text-fg-muted'}`}
      >
        Strategy, design, engineering and AI under one roof. The same senior team that finds the
        move is the team that builds it.
      </p>
      <Stat value="89% → 114%" label="NRR" tone={onInk ? 'inverse' : 'default'} />
      <div className="flex items-center gap-6">
        <Button variant={onInk ? 'light' : 'dark'} icon={<ArrowIcon />}>
          View our work
        </Button>
        {/* The tertiary text CTA is `Button / Ghost` (264:260) — its label
            follows the band, so it needs no per-surface tone. `asChild`
            ignores the icon slot, so the glyph goes inside the anchor. */}
        <Button variant="ghost" asChild>
          <a href="#partners">
            See all partners
            <ArrowIcon />
          </a>
        </Button>
      </div>
    </div>
  )
}

export const White: Story = {
  args: { surface: 'white' },
  render: (args) => (
    <SectionShell {...args}>
      <PlaceholderContent surface={args.surface ?? 'white'} />
    </SectionShell>
  ),
}

export const Bone: Story = {
  ...White,
  args: { surface: 'bone' },
}

export const Ink: Story = {
  ...White,
  args: { surface: 'ink' },
}

/** The narrower 1100px measure used for centered statements. */
export const ContentWidth: Story = {
  args: { surface: 'bone', width: 'content' },
  render: (args) => (
    <SectionShell {...args} contentClassName="text-center">
      <Eyebrow tone="muted" className="mb-10">
        Our Partners
      </Eyebrow>
      <DisplayHeading level="xl">
        We work with B2B and enterprise teams to reimagine experiences.
      </DisplayHeading>
    </SectionShell>
  ),
}

/** The full three-surface rhythm, stacked as on the homepage. */
export const AllSurfaces: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div>
      {(['white', 'bone', 'ink'] as const).map((surface) => (
        <SectionShell key={surface} surface={surface}>
          <PlaceholderContent surface={surface} />
        </SectionShell>
      ))}
    </div>
  ),
}

/**
 * A stand-in picture: a starfield drawn in CSS, so the story loads nothing and
 * two runs of it are the same pixels. On the site the child is a real image —
 * `packages/content-ui`'s `BackgroundMedia` puts a `SanityImage` here.
 */
function Photograph() {
  return (
    <div
      style={{
        backgroundColor: '#101014',
        backgroundImage: [
          'radial-gradient(1px 1px at 12% 30%, rgba(255,255,255,0.5), transparent)',
          'radial-gradient(1.5px 1.5px at 47% 62%, rgba(255,255,255,0.45), transparent)',
          'radial-gradient(1px 1px at 73% 18%, rgba(255,255,255,0.55), transparent)',
          'radial-gradient(2px 2px at 88% 71%, rgba(255,255,255,0.35), transparent)',
          'radial-gradient(120% 90% at 78% 20%, rgba(120,120,140,0.35), transparent)',
        ].join(', '),
      }}
    />
  )
}

/**
 * `background` — the band sits on a picture (#239). The surface still paints
 * under it and still decides the copy's colour, so the band declares the
 * surface it would have declared without one.
 *
 * `dim` lays that surface's own colour over the picture. This is the state a
 * band opens in, because a picture nobody has checked is the one that swallows
 * the copy.
 */
export const OnPhotograph: Story = {
  args: { surface: 'ink' },
  render: (args) => (
    <SectionShell
      {...args}
      background={
        <SectionBackground surface={args.surface ?? 'white'}>
          <Photograph />
        </SectionBackground>
      }
    >
      <PlaceholderContent surface={args.surface ?? 'white'} />
    </SectionShell>
  ),
}

/**
 * `tint: 'none'` — the picture as it is. What the O3XO kit draws on its
 * photographic bands (`4406:6755`, `4406:6954`), whose imagery is already a
 * near-black starfield.
 */
export const OnPhotographUntinted: Story = {
  args: { surface: 'ink' },
  render: (args) => (
    <SectionShell
      {...args}
      background={
        <SectionBackground surface={args.surface ?? 'white'} tint="none">
          <Photograph />
        </SectionBackground>
      }
    >
      <PlaceholderContent surface={args.surface ?? 'white'} />
    </SectionShell>
  ),
}

/**
 * The tint is the band's OWN colour, so a light band lightens the picture
 * rather than darkening it — dark copy keeps the contrast its surface promised.
 * Three bands, one picture, three tints.
 */
export const TintPerSurface: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div>
      {(['white', 'bone', 'ink'] as const).map((surface) => (
        <SectionShell
          key={surface}
          surface={surface}
          background={
            <SectionBackground surface={surface}>
              <Photograph />
            </SectionBackground>
          }
        >
          <PlaceholderContent surface={surface} />
        </SectionShell>
      ))}
    </div>
  ),
}
