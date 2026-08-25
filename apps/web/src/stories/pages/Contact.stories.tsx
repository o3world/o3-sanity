import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { figmaDesign } from '@o3/story-kit'

import { PageMockup } from '../PageMockup'

/**
 * `/contact`, from `data/seed/page/contact.json`. Two bands: the interior hero
 * (`2960:7558`) and the form card beside its rail (`2960:7792`).
 *
 * The mockup also carries the state the page is actually in: the submit path
 * is stubbed (#58), and the notice saying so sits above a button that is
 * `aria-disabled` rather than `disabled`, so it stays focusable and its
 * description is announced. That is the thing to check has not quietly been
 * "tidied away" — a form that silently discards what it collects is worse than
 * no form.
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
