import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Eyebrow } from './eyebrow'

const meta = {
  title: 'UI/Eyebrow',
  component: Eyebrow,
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: 'inline-radio', options: ['base', 'lg'] },
    tone: { control: 'select', options: ['muted', 'inverse', 'brand'] },
  },
} satisfies Meta<typeof Eyebrow>

export default meta
type Story = StoryObj<typeof meta>

/** The section kicker at 18px — "OUR PARTNERS" above the logo wall (1864:2392). */
export const Section: Story = {
  args: { size: 'lg', children: 'Our Partners' },
  globals: { backgrounds: { value: 'bone' } },
}

/** The card kicker at 16px, on a light band. */
export const Card: Story = {
  args: { children: 'Teams' },
}

/** White, over a card scrim or on an ink band (1883:3561). */
export const Inverse: Story = {
  args: { tone: 'inverse', children: 'Healthcare · Pediatric Systems' },
  globals: { backgrounds: { value: 'ink' } },
}

/** Brand red — the exception. The frames use it for the footer link headers. */
export const Brand: Story = {
  args: { tone: 'brand', children: 'Company' },
  globals: { backgrounds: { value: 'ink' } },
}
