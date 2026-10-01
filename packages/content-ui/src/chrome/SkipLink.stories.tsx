import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, within } from 'storybook/test'

import { SkipLink } from './SkipLink'

/** Keyboard users' way past the nav (WCAG 2.4.1). Hidden until it takes focus. */
const meta = {
  title: 'Chrome/SkipLink',
  component: SkipLink,
  parameters: { layout: 'fullscreen' },
  args: { target: 'site-content' },
  render: (args) => (
    <>
      <SkipLink {...args} />
      <nav aria-label="Primary">
        <a href="#work">Work</a>
      </nav>
      <main id="site-content" tabIndex={-1}>
        <h1>Page content</h1>
      </main>
    </>
  ),
} satisfies Meta<typeof SkipLink>

export default meta
type Story = StoryObj<typeof meta>

export const FirstTabRevealsIt: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Skip to content' })
    // Waiting above the viewport, not removed: it must stay focusable.
    await expect(link.getBoundingClientRect().bottom).toBeLessThanOrEqual(0)

    await userEvent.tab()
    await expect(link).toHaveFocus()
    const shown = link.getBoundingClientRect()
    await expect(shown.width).toBeGreaterThan(40)
    await expect(shown.top).toBeGreaterThanOrEqual(0)
    await expect(Number(getComputedStyle(link).zIndex)).toBeGreaterThan(50)

    await userEvent.keyboard('{Enter}')
    await expect(canvasElement.querySelector('main')).toHaveFocus()
  },
}
