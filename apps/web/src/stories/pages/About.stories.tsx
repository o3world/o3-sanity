import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { PageMockup } from '../PageMockup'

/**
 * `/about` — the canonical About frame (`1924:5344`), from
 * `data/seed/page/about.json`.
 *
 * The page the `band` hero variant exists for: a shallow `ink-warm` strip with
 * the sphere hung off the right edge, not the Home hero's full orbital field.
 * Below it the disciplines run in the `grid` layout (`1925:5915`) — the same
 * block Solutions draws as `orbital`, which is the pair worth flipping between
 * when either changes.
 *
 * The team band dereferences **migrated** people, not seeded ones, so this
 * mockup is also the check that the converted person tree still carries
 * headshots and titles.
 *
 * There is no mobile frame for About in the manifest, so there is no mobile
 * story claiming to match one. Use the viewport toolbar.
 */
const meta = {
  title: 'Pages/About',
  component: PageMockup,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1924:5344'),
  },
} satisfies Meta<typeof PageMockup>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: { page: 'about' },
  globals: { viewport: { value: 'desktop' } },
}
