import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { DisplayHeading } from './display-heading'

const meta = {
  title: 'UI/DisplayHeading',
  component: DisplayHeading,
  parameters: { layout: 'padded' },
  argTypes: {
    level: { control: 'select', options: ['hero', 'xl', 'lg', 'md'] },
    as: { control: 'select', options: ['h1', 'h2', 'h3', 'h4', 'p', 'div'] },
  },
} satisfies Meta<typeof DisplayHeading>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: { level: 'xl', children: 'The platforms we go deep on' },
}

/** All four fluid display steps, largest first. */
export const Levels: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-10">
      <DisplayHeading level="hero" as="p">
        You see the problem in front of you.
      </DisplayHeading>
      <DisplayHeading level="xl" as="p">
        The platforms we go deep on
      </DisplayHeading>
      <DisplayHeading level="lg" as="p">
        Embedded Team Member
      </DisplayHeading>
      <DisplayHeading level="md" as="p">
        Families were navigating twelve portals to manage one child&apos;s care.
      </DisplayHeading>
    </div>
  ),
}

/** The hero headline's line stagger — remount the story to replay. */
export const StaggeredReveal: Story = {
  globals: { backgrounds: { value: 'ink' } },
  parameters: { controls: { disable: true } },
  render: () => (
    <DisplayHeading
      level="hero"
      as="h1"
      lines={[
        <span key="1" className="text-[#F4F4F6]">
          You see the problem in front of you.
        </span>,
        <span key="2" className="text-[#6E6E76]">
          We&apos;re working on the one behind it.
        </span>,
      ]}
      revealDelay={200}
    />
  ),
}
