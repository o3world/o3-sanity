import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { figmaDesign } from '@o3/story-kit'

import { PageMockup } from '../PageMockup'

/**
 * `/contact`, from `data/seed/page/contact.json`. Two bands: the interior hero
 * (`2960:7558`) and the form card beside its rail (`2960:7792`).
 *
 * The form posts to the app's `/api/contact` route, which forwards the
 * submission to HubSpot (#412). No mockup reaches that route — Storybook has
 * no app behind it — so what this shows is the card as a page draws it.
 */
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

/** The rail drops under the card, and the two name fields stay side by side. */
export const Mobile: Story = {
  args: { page: 'contact' },
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('2975:10037') },
}
