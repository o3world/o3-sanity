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

/** With the author's real headshot, which most of the 14 migrated people have. */
export const WithPortrait: Story = {
  args: {
    name: 'Jay Forbes',
    role: 'Director of Engineering',
    meta: 'Jun 2026 · 6 min read',
    avatar: (
      <img
        src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='42'%3E%3Crect width='42' height='42' fill='%23545b48'/%3E%3Ccircle cx='21' cy='16' r='7' fill='%23bfc4b4'/%3E%3Ccircle cx='21' cy='38' r='13' fill='%23bfc4b4'/%3E%3C/svg%3E"
        alt=""
        className="size-full object-cover"
      />
    ),
  },
}

/** A migrated post whose author record has no role. */
export const NameOnly: Story = {
  args: { name: 'Brian Crumley', meta: 'Feb 2015 · 3 min read' },
}

/** No author at all — the meta line still carries date and read time. */
export const Unattributed: Story = {
  args: { meta: 'Feb 2015 · 3 min read' },
}
