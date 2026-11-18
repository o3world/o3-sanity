import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'

import LandingNotFound from '@/app/(landing)/not-found'

/** The landing pages' 404: the site's 404 band, with a link back to the site. */
const meta = {
  title: 'Chrome/Landing/Not found',
  component: LandingNotFound,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LandingNotFound>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'This jawn doesn’t exist.',
    )
    await expect(canvas.getByRole('link', { name: /Go home/ })).toHaveAttribute('href', '/')
    await expect(canvas.getByRole('main')).toHaveAttribute('id', 'landing-content')
  },
}
