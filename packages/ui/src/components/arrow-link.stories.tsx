import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ArrowLink } from './arrow-link'

const meta = {
  title: 'UI/ArrowLink',
  component: ArrowLink,
  parameters: { layout: 'padded' },
  argTypes: {
    tone: { control: 'select', options: ['default', 'tint', 'inverse'] },
  },
} satisfies Meta<typeof ArrowLink>

export default meta
type Story = StoryObj<typeof meta>

/** The light-surface text CTA ("See all partners"). */
export const Default: Story = {
  args: { href: '#partners', children: 'See all partners' },
}

/** The dark-surface case link ("Read the case", brand-tint). */
export const Tint: Story = {
  args: { href: '#case', tone: 'tint', children: 'Read the case' },
  globals: { backgrounds: { value: 'ink' } },
}

/** Plain white link on ink (footer nav). */
export const Inverse: Story = {
  args: { href: '#contact', tone: 'inverse', children: 'Talk about embedding' },
  globals: { backgrounds: { value: 'ink' } },
}
