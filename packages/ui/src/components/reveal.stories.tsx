import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Card, CardContent, CardDescription, CardTitle } from './ui/card'
import { DisplayHeading } from './display-heading'
import { Reveal } from './reveal'

const meta = {
  title: 'Motion/Reveal',
  component: Reveal,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Reveal>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Scroll down: each block fades up 24px on the house curve as it enters the
 * viewport. Blocks already visible on mount show immediately, and
 * prefers-reduced-motion renders everything in place.
 */
export const ScrollDemo: Story = {
  render: () => (
    <div className="bg-bone px-6 py-16">
      <div className="max-w-content mx-auto flex flex-col gap-[70vh]">
        <div>
          <DisplayHeading level="lg" as="p">
            Scroll to reveal ↓
          </DisplayHeading>
          <p className="text-fg-muted mt-4">
            Each block below animates in as it crosses the viewport edge (with a 40px early margin,
            like the prototype&apos;s data-reveal).
          </p>
        </div>
        {[1, 2, 3].map((n) => (
          <Reveal key={n} delay={(n - 1) * 80}>
            <Card className="max-w-[480px]">
              <CardContent>
                <CardTitle className="mb-3">Revealed block {n}</CardTitle>
                <CardDescription>
                  opacity 0 → 1, translateY 24px → 0, 700ms on the ease-out house curve.
                </CardDescription>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </div>
  ),
}

/** Staggered tiles in one viewport — the logo-wall entrance pattern. */
export const Staggered: Story = {
  render: () => (
    <div className="bg-bone px-6 py-16">
      <div className="max-w-content mx-auto grid grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Reveal key={i} delay={i * 80}>
            <div className="border-line rounded-card flex h-[110px] items-center justify-center border bg-white">
              Tile {i + 1}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  ),
}
