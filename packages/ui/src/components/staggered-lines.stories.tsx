import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { StaggeredLines } from './staggered-lines'

/**
 * The headline reveal: each line fades in as it paints, rising 0.4em with a
 * 4px blur melting off it, 700ms on `ease-spring`, one line every 220ms.
 *
 * **Reload the story to see it.** It is a one-shot CSS animation, not a loop —
 * the same reason the hero plays it once per page load. Being an animation
 * rather than a mount-triggered transition is what lets it start at first
 * paint, which the hero needs: its headline is the LCP element.
 *
 * `motion-reduce` renders every line in place with no animation at all, which
 * is why there is no "disable the animation" prop: the preference is the
 * switch. Storybook cannot fake that media query, so check it in the browser's
 * emulation panel rather than here.
 */
const meta = {
  title: 'Motion/StaggeredLines',
  component: StaggeredLines,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StaggeredLines>

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
        <StaggeredLines {...args} />
      </h1>
    </div>
  ),
}

/**
 * The spring against the house `ease-out` on the same lines. This is where
 * `ease-spring` is settled: motion has no Figma anchor, so the case for the
 * curve is what you can see next to the one it replaces.
 *
 * `out` leaves the start line at speed and arrives. `spring` starts from rest,
 * gathers, and settles on a long tail — at the hero's stagger the lines are
 * far enough apart to be read one at a time, and the long tail is what lets
 * the blur come off a line that has almost stopped moving.
 */
export const SpringAgainstOut: Story = {
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
        {(
          [
            // The curve is the one value the component does not take as a
            // prop — there is one headline curve, and this is the comparison
            // that chose it — so the story reaches past it and overrides the
            // shorthand's timing function on the lines themselves.
            ['out', '[&_span]:[animation-timing-function:var(--ease-out)]'],
            ['spring', ''],
          ] as const
        ).map(([easing, override]) => (
          <div key={easing} className="max-w-content mx-auto w-full">
            <p className="text-fg-muted mb-4 font-mono text-xs uppercase">{easing}</p>
            <p className={`text-display-lg font-display text-balance ${override}`}>
              <StaggeredLines lines={lines} />
            </p>
          </div>
        ))}
      </div>
    )
  },
}

/** A single line still arrives — the stagger simply has nothing to space. */
export const SingleLine: Story = {
  args: { lines: ['One line only'] },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink px-gutter py-24 text-white">
      <h1 className="text-hero font-display max-w-content mx-auto">
        <StaggeredLines {...args} />
      </h1>
    </div>
  ),
}

/**
 * Five lines at a wider stagger — the timing knobs, made visible. The rise is
 * 0.4em, so at this step it travels further than it does under the hero's
 * lines and still reads as the same move.
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
        <StaggeredLines {...args} />
      </p>
    </div>
  ),
}
