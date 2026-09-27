import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { figmaDesign } from '@o3/story-kit'

import { PageMockup } from '../PageMockup'

/** Contact uses one introductory form band, followed by its preserved secondary content. */
const meta = {
  title: 'Pages/Contact',
  component: PageMockup,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PageMockup>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: { page: 'contact' },
  globals: { viewport: { value: 'desktop' } },
  parameters: { design: figmaDesign('2960:7557') },
}

/** Introduction, form, and secondary content stack on mobile. */
export const Mobile: Story = {
  args: { page: 'contact' },
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('2975:10037') },
}
