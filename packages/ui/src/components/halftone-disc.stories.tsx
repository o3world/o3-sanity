import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { HalftoneDisc } from './halftone-disc'

const meta = {
  title: 'UI/HalftoneDisc',
  component: HalftoneDisc,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof HalftoneDisc>

export default meta
type Story = StoryObj<typeof meta>

/** 138px — beside a discipline on the About grid (`1925:5922`). */
export const Discipline: Story = {
  args: { className: 'text-ink w-[138px]' },
}

/** 70px — beside a job role in the Careers band (`1925:6068`). */
export const Role: Story = {
  args: { className: 'text-ink w-[70px]' },
}

/** The dot grid is a fixed size, so the two diameters show the same pattern. */
export const BothSizes: Story = {
  args: { className: 'text-ink w-[138px]' },
  render: (args) => (
    <div className="flex items-center gap-8">
      <HalftoneDisc {...args} />
      <HalftoneDisc className="text-ink w-[70px]" />
    </div>
  ),
}
