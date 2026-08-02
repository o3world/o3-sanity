import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ArticleByline } from './article-byline'

const meta = {
  title: 'UI/ArticleByline',
  component: ArticleByline,
  parameters: { layout: 'padded' },
  globals: { backgrounds: { value: 'ink' } },
} satisfies Meta<typeof ArticleByline>

export default meta
type Story = StoryObj<typeof meta>

/** The frame exactly — `1710:2946`, monogram disc and all. */
export const Frame: Story = {
  args: {
    name: 'Jay Forbes',
    role: 'Director of Engineering',
    meta: 'Jun 2026 · 6 min read',
  },
}

/** With the author's real headshot, which all 12 migrated people have. */
export const WithPortrait: Story = {
  args: {
    name: 'Jay Forbes',
    role: 'Director of Engineering',
    meta: 'Jun 2026 · 6 min read',
    headshot: (
      <img
        src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='42'%3E%3Crect width='42' height='42' fill='%23545b48'/%3E%3Ccircle cx='21' cy='16' r='7' fill='%23bfc4b4'/%3E%3Ccircle cx='21' cy='38' r='13' fill='%23bfc4b4'/%3E%3C/svg%3E"
        alt=""
        className="size-full object-cover"
      />
    ),
  },
}

/** An author record with no role — a name and the meta line, no second line. */
export const NameOnly: Story = {
  args: { name: 'Alan Cho, CPACC', meta: 'Feb 2015 · 3 min read' },
}

/**
 * No author at all — the meta line still carries date and read time, and the
 * disc goes with the name. **This is the archive's majority state**, not an
 * edge case: 239 of the 272 migrated articles have no byline, because
 * o3world.com shows none for them either (#32).
 */
export const Unattributed: Story = {
  args: { meta: 'Feb 2015 · 3 min read' },
}
