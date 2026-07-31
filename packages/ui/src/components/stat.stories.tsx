import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Stat } from './stat'

const meta = {
  title: 'UI/Stat',
  component: Stat,
  parameters: { layout: 'padded' },
  argTypes: {
    tone: { control: 'select', options: ['default', 'inverse'] },
  },
} satisfies Meta<typeof Stat>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { value: '41%', label: 'fewer missed appointments' },
}

/** String values carry arrows and multipliers unchanged. */
export const RangeValue: Story = {
  args: { value: '89% → 114%', label: 'NRR' },
}

/** The work-case metric on the ink surface. */
export const Inverse: Story = {
  args: { value: '2.3×', label: 'digital order volume', tone: 'inverse' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="text-white">
      <Stat {...args} />
    </div>
  ),
}
