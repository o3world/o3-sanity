import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Eyebrow } from '../eyebrow'
import { Card, CardContent, CardDescription, CardFooter, CardMedia, CardTitle } from './card'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: { layout: 'padded' },
  argTypes: {
    surface: { control: 'select', options: ['white', 'ink'] },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

/** The insight card from the insights carousel (white card on bone). */
export const InsightCard: Story = {
  globals: { backgrounds: { value: 'bone' } },
  render: (args) => (
    <Card {...args} className="flex w-[340px] flex-col">
      <CardMedia />
      <CardContent>
        <Eyebrow className="mb-3 text-[11px]">Teams</Eyebrow>
        <CardTitle className="mb-3">Why your best people keep solving the wrong problem</CardTitle>
        <CardDescription>
          Talent isn&apos;t the bottleneck. The framing is — and the framing is set long before the
          work begins.
        </CardDescription>
      </CardContent>
      <CardFooter className="mx-6 px-0">Brady Halligan · Jun 2026 · 6 min read</CardFooter>
    </Card>
  ),
}

/** The ink-soft card fill used by the work-case showcase on the #030303 band. */
export const InkSurface: Story = {
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <Card {...args} surface="ink" className="w-[520px]">
      <CardContent className="p-10">
        <Eyebrow tone="inverse" className="mb-4">
          Healthcare · Pediatric Systems
        </Eyebrow>
        <CardTitle className="text-display-md mb-0 text-white">
          Families were navigating twelve portals to manage one child&apos;s care.
        </CardTitle>
      </CardContent>
    </Card>
  ),
}
