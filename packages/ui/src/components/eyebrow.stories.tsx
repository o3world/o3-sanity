import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Eyebrow } from './eyebrow'

const meta = {
  title: 'UI/Eyebrow',
  component: Eyebrow,
  parameters: { layout: 'padded' },
  argTypes: {
    tone: { control: 'select', options: ['brand', 'tint', 'muted'] },
  },
} satisfies Meta<typeof Eyebrow>

export default meta
type Story = StoryObj<typeof meta>

/** The red kicker on light surfaces (insight-card categories). */
export const Brand: Story = {
  args: { children: 'Teams' },
}

/** The lifted red used on dark surfaces (work-case category lines). */
export const Tint: Story = {
  args: { tone: 'tint', children: 'Healthcare · Pediatric Systems' },
  globals: { backgrounds: { value: 'ink' } },
}

/** The neutral kicker ("OUR PARTNERS" above the logo wall). */
export const Muted: Story = {
  args: { tone: 'muted', children: 'Our Partners' },
  globals: { backgrounds: { value: 'bone' } },
}
