import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ReadingProgress } from './reading-progress'

const meta = {
  title: 'UI/ReadingProgress',
  component: ReadingProgress,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ReadingProgress>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Scroll the preview: the bar fills left to right. It is `fixed`, so it pins
 * to the top of the frame rather than the top of the copy.
 */
export const Scrolling: Story = {
  render: () => (
    <>
      <ReadingProgress />
      <div className="max-w-article mx-auto px-6 py-16">
        {Array.from({ length: 24 }, (_, i) => (
          <p key={i} className="text-body text-fg mt-4 first:mt-0">
            Paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        ))}
      </div>
    </>
  ),
}

/**
 * A page with nothing to scroll leaves the bar empty rather than full — the
 * divide-by-zero case.
 */
export const NothingToScroll: Story = {
  render: () => (
    <>
      <ReadingProgress />
      <p className="text-body text-fg p-6">One short paragraph, no scrollbar.</p>
    </>
  ),
}
