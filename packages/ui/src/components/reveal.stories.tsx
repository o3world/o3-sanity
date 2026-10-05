import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor } from 'storybook/test'

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
            <div className="rounded-card max-w-[480px] bg-white p-6">
              <p className="text-body-heading mb-3">Revealed block {n}</p>
              <p className="text-body text-fg-muted">
                opacity 0 → 1, translateY 24px → 0, 700ms on the ease-out house curve.
              </p>
            </div>
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
 * logo wall uses.
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
        <DisplayHeading level="lg" as="h3">
          Staggered reveal
        </DisplayHeading>
        <div className="grid grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="border-line rounded-card h-full border bg-white p-6">
                <p className="text-body-heading mb-3">Panel {i + 1}</p>
                <p className="text-body text-fg-muted">
                  opacity 0 → 1, translateY 24px → 0, entering at {i * 80}ms.
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  ),
}

/** What the reader sees of an element: its opacity times every ancestor's. */
const seenOpacity = (element: Element) => {
  let product = 1
  for (let node: Element | null = element; node; node = node.parentElement)
    product *= Number(getComputedStyle(node).opacity)
  return product
}
const twoFrames = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

/**
 * Focus reaching an armed block shows it at once. A keyboard reader who tabs
 * to a link below the fold must never be focused on something still faded
 * out.
 */
export const RevealsOnFocus: Story = {
  render: () => (
    <div className="bg-bone px-6 py-16">
      <div className="h-[200vh]" />
      <Reveal>
        <a href="#reveal-target" className="text-body-heading">
          Focusable inside the reveal
        </a>
      </Reveal>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector<HTMLAnchorElement>('a[href="#reveal-target"]')!
    await waitFor(() => expect(seenOpacity(link)).toBe(0))
    link.focus({ preventScroll: true })
    await twoFrames()
    await expect(seenOpacity(link)).toBe(1)
  },
}

/**
 * Focus from a pointer leaves the entrance alone: the block rises on its own
 * schedule, so a tap or click that lands on it mid-rise isn't moved out from
 * under the pointer between press and release.
 */
export const PointerFocusKeepsTheEntrance: Story = {
  render: RevealsOnFocus.render,
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector<HTMLAnchorElement>('a[href="#reveal-target"]')!
    await waitFor(() => expect(seenOpacity(link)).toBe(0))
    link.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    link.focus({ preventScroll: true })
    await twoFrames()
    await expect(seenOpacity(link)).toBe(0)
  },
}

/**
 * Focus moving into a cross-origin frame — an embed — sends the page no
 * `focusin`, only a window `blur`, and doesn't scroll the page. The block
 * still shows at once. A `data:` URL is an opaque origin, so it stands in for
 * YouTube.
 */
export const RevealsOnFocusIntoAnEmbed: Story = {
  render: () => (
    <div className="bg-bone px-6 py-16">
      <div className="h-[200vh]" />
      <Reveal>
        <iframe
          title="Embedded frame"
          src="data:text/html,<button>Inside the frame</button>"
          className="h-24 w-64"
        />
      </Reveal>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector('iframe')!
    await waitFor(() => expect(seenOpacity(frame)).toBe(0))
    frame.contentWindow!.focus()
    await waitFor(() => expect(document.activeElement).toBe(frame))
    await twoFrames()
    await expect(seenOpacity(frame)).toBe(1)
  },
}

/**
 * The observer is the trigger, not the only one. If it never reports — a
 * browser that drops the notification — a block the reader has scrolled onto
 * still enters, rather than sitting invisible over its band's ground.
 */
export const RevealsWhenTheObserverMisses: Story = {
  beforeEach: () => {
    const real = window.IntersectionObserver
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as unknown as typeof IntersectionObserver
    return () => {
      window.IntersectionObserver = real
    }
  },
  render: () => (
    <div className="bg-bone px-6 py-16">
      <div className="h-[200vh]" />
      <Reveal>
        <p id="reveal-missed" className="text-body-heading">
          Scrolled onto, observer or not
        </p>
      </Reveal>
      <div className="h-screen" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = canvasElement.querySelector('#reveal-missed')!
    await waitFor(() => expect(seenOpacity(block)).toBe(0))
    try {
      block.scrollIntoView({ block: 'center', behavior: 'instant' })
      await waitFor(() => expect(seenOpacity(block)).toBe(1), { timeout: 3000 })
    } finally {
      window.scrollTo(0, 0)
    }
  },
}
