import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { MaskedLines } from './masked-lines'

/**
 * The headline reveal: each line slides up from behind its own overflow mask
 * as it paints, 950ms on `ease-mask`, staggered 170ms.
 *
 * **Reload the story to see it.** It is a one-shot CSS animation, not a loop —
 * the same reason the hero plays it once per page load. Being an animation
 * rather than a mount-triggered transition is what lets it start at first
 * paint, which the hero needs: its headline is the LCP element.
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

/**
 * The two curves on the same lines, one above the other. This is where
 * `ease-spring` is settled: motion has no Figma anchor, so the case for a
 * third curve is what you can see next to the one it replaces.
 *
 * `mask` leaves the start line at speed and arrives. `spring` starts from
 * rest, gathers, and settles on a long tail — at the hero's stagger the lines
 * are far enough apart to be read one at a time, and the difference is the
 * difference between a swipe and a lift.
 */
export const SpringAgainstMask: Story = {
  args: { lines: [] },
  globals: { backgrounds: { value: 'ink' } },
  render: () => {
    const lines = [
      <span key="a" className="text-on-ink">
        You see the problem in front of you.
      </span>,
      <span key="b" className="text-white/50">
        We’re working on the one behind it.
      </span>,
    ]
    return (
      <div className="bg-ink px-gutter flex flex-col gap-16 py-24 text-white">
        {(['mask', 'spring'] as const).map((easing) => (
          <div key={easing} className="max-w-content mx-auto w-full">
            <p className="text-fg-muted mb-4 font-mono text-xs uppercase">{easing}</p>
            <p className="text-display-lg font-display text-balance">
              <MaskedLines lines={lines} stagger={220} easing={easing} />
            </p>
          </div>
        ))}
      </div>
    )
  },
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
