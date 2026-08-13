import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { MoleculeMark } from './molecule-mark'

const meta = {
  title: 'UI/MoleculeMark',
  component: MoleculeMark,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MoleculeMark>

export default meta
type Story = StoryObj<typeof meta>

/** The mark on its own, inked, so the shape is readable. */
export const Mark: Story = {
  args: { className: 'text-ink w-[240px]' },
}

/** How the quote band actually places it (`2250:1525`): 699px at 10%. */
export const AsQuoteDecoration: Story = {
  args: { className: 'text-ink w-[699px] opacity-10' },
  render: (args) => (
    <div className="bg-bone relative isolate h-[500px] overflow-hidden">
      <MoleculeMark {...args} className={`${args.className} absolute -right-[200px] top-[181px]`} />
    </div>
  ),
}
