import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PageMockup } from '../PageMockup'

/**
 * `/ventures`, from `data/seed/page/ventures.json`.
 *
 * **No canonical Figma frame**, so no Design tab — see the note on
 * `Pages/Contact`. It earns a mockup anyway, for a different reason from the
 * frame-backed pages: it is the interior page built almost entirely out of
 * `layoutSection` and `railPanelsSection`, i.e. the generic bands an editor
 * reaches for when no bespoke block fits. What a page assembled from those
 * looks like — whether the rhythm holds without a designed band to anchor it —
 * is not visible in any single block story.
 */
const meta = {
  title: 'Pages/Ventures',
  component: PageMockup,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PageMockup>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: { page: 'ventures' },
  globals: { viewport: { value: 'desktop' } },
}

export const Mobile: Story = {
  args: { page: 'ventures' },
  globals: { viewport: { value: 'mobile' } },
}
