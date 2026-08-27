import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Card, CardContent, CardDescription, CardTitle } from './ui/card'
import { SectionShell } from './section-shell'
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
 * viewport. Blocks already visible on mount keep their server paint and never
 * animate, and prefers-reduced-motion renders everything in place — which is
 * why every demo here starts its blocks below the fold.
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

/** Staggered tiles entering together — the logo-wall entrance pattern. */
export const Staggered: Story = {
  render: () => (
    <div className="bg-bone px-6 py-16">
      <div className="flex min-h-screen items-start">
        <DisplayHeading level="lg" as="p">
          Scroll to the tiles ↓
        </DisplayHeading>
      </div>
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

/**
 * The band pattern: a `SectionShell` whose children enter in sequence, each
 * `Reveal` delayed by its index × 80ms — the stagger `Reveal` documents and the
 * logo wall uses. The tiles are `interactive` cards, so the entrance and the
 * hover affordance are visible together.
 *
 * Nothing here is new component code: `Reveal` already takes `delay`, and the
 * stagger is composition. The story exists because motion has no Figma anchor
 * (CONTEXT.md) — `packages/ui` stories are where it is settled.
 */
export const StaggeredBand: Story = {
  render: () => (
    <SectionShell surface="white">
      <div className="flex min-h-screen items-start">
        <DisplayHeading level="lg" as="p">
          Scroll to the band ↓
        </DisplayHeading>
      </div>
      <div className="flex flex-col gap-10">
        {/* h3 so the h4 CardTitles below do not skip a level — the stories
            layer axe-scans every story and heading-order is enforced. */}
        <DisplayHeading level="lg" as="h3">
          Staggered reveal
        </DisplayHeading>
        <div className="grid grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Reveal key={i} delay={i * 80}>
              <Card interactive className="h-full">
                <CardContent>
                  <CardTitle className="mb-3">Panel {i + 1}</CardTitle>
                  <CardDescription>
                    opacity 0 → 1, translateY 24px → 0, entering at {i * 80}ms.
                  </CardDescription>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  ),
}
