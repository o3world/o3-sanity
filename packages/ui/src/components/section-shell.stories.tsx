import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ArrowLink } from './arrow-link'
import { Button } from './ui/button'
import { DisplayHeading } from './display-heading'
import { Eyebrow } from './eyebrow'
import { SectionShell, type Surface } from './section-shell'
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
      <Eyebrow tone={onInk ? 'tint' : 'brand'}>Our Partners</Eyebrow>
      <DisplayHeading level="xl">
        We work with B2B and enterprise teams to reimagine experiences.
      </DisplayHeading>
      <p className={`max-w-[520px] text-lg leading-[1.55] ${onInk ? 'text-fg-inverse-muted' : 'text-fg-muted'}`}>
        Strategy, design, engineering and AI under one roof. The same senior team that finds the
        move is the team that builds it.
      </p>
      <Stat value="89% → 114%" label="NRR" tone={onInk ? 'inverse' : 'default'} />
      <div className="flex items-center gap-6">
        <Button variant={onInk ? 'inverse' : 'brand'} arrow>
          View our work
        </Button>
        <ArrowLink href="#partners" tone={onInk ? 'tint' : 'default'}>
          See all partners
        </ArrowLink>
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
