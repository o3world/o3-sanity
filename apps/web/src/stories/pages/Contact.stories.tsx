import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PageMockup } from '../PageMockup'

/**
 * `/contact`, from `data/seed/page/contact.json`.
 *
 * ⚠️ **No canonical Figma frame** (`docs/content-sourcing.md`), so this story
 * carries no Design tab — there is nothing to compare it to, and a link to a
 * near-enough frame would be worse than none. The band is assembled from parts
 * other frames authored; `FormSection`'s own comment says exactly what was
 * transcribed and what was not.
 *
 * What this mockup is good for is the state the page is actually in: the
 * submit path is stubbed (#58), and the notice saying so sits above a button
 * that is `aria-disabled` rather than `disabled`, so it stays focusable and
 * its description is announced. That is the thing to check has not quietly
 * been "tidied away" — a form that silently discards what it collects is worse
 * than no form.
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
}

/** The two name fields share a row from `sm`, so they stack here. */
export const Mobile: Story = {
  args: { page: 'contact' },
  globals: { viewport: { value: 'mobile' } },
}
