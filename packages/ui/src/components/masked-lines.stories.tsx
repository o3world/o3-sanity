import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { MaskedLines } from './masked-lines'

/**
 * The headline reveal: each line slides up from behind its own overflow mask
 * on mount, 950ms on `ease-mask`, staggered 170ms.
 *
 * **Reload the story to see it.** It is a mount-triggered transition, not a
 * loop — the same reason the hero plays it once per page load.
 *
 * `motion-reduce` renders every line in place with no transition at all, which
 * is why there is no "disable the animation" prop: the preference is the
 * switch. Storybook cannot fake that media query, so check it in the browser's
 * emulation panel rather than here.
 */
const meta = {
  title: 'Motion/MaskedLines',
  component: MaskedLines,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MaskedLines>

export default meta
type Story = StoryObj<typeof meta>

/** The Home hero's two lines, at hero size, with the closing line set back. */
export const HeroHeadline: Story = {
  args: {
    lines: [
      <span key="a" className="text-on-ink">
        You see the problem in front of you.
      </span>,
      <span key="b" className="text-white/50">
        We’re working on the one behind it.
      </span>,
    ],
  },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink px-gutter py-24 text-white">
      <h1 className="text-hero font-display max-w-content mx-auto text-balance">
        <MaskedLines {...args} />
      </h1>
    </div>
  ),
}

/** A single line still gets its mask — the stagger simply has nothing to space. */
export const SingleLine: Story = {
  args: { lines: ['One line only'] },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink px-gutter py-24 text-white">
      <h1 className="text-hero font-display max-w-content mx-auto">
        <MaskedLines {...args} />
      </h1>
    </div>
  ),
}

/**
 * Five lines at a wider stagger — the timing knobs, made visible. Descenders
 * are the thing to watch: the mask carries 0.04em of bottom padding so a `g`
 * is not clipped by its own reveal.
 */
export const SlowStagger: Story = {
  args: {
    lines: ['Strategy', 'Design', 'Engineering', 'and AI', 'under one roof.'],
    baseDelay: 200,
    stagger: 320,
  },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink px-gutter py-24 text-white">
      <p className="text-display-xl font-display max-w-content mx-auto">
        <MaskedLines {...args} />
      </p>
    </div>
  ),
}
