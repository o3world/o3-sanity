import { createContext, useContext, useEffect, useState } from 'react'
import { OrbitalRendererContext } from './orbital-sphere-renderer'
import type { OrbitalRendererProps } from './orbital-sphere-renderer'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, waitFor } from 'storybook/test'

import { OrbitalSphere } from './orbital-sphere'

/**
 * The wireframe atom, ported from the official export rather than traced off a
 * raster. See the component's own comment for what the export supersedes and
 * which two readings from the trace survive it.
 *
 * It is `position: absolute` and `aria-hidden` by construction: it is a field a
 * band sits in front of, never a thing on its own. Every placement story
 * therefore supplies the band, and **carries that call site's real values** —
 * these stories are the record of how each band crops the sphere, and the only
 * seam that catches placement drift.
 *
 * The thing to check is the **proportion**, not the numbers: the arcs should run
 * nearly parallel to whatever curve is beneath them. A sphere drawn a sixth too
 * small pulls its arcs up and away, which is the way this has historically
 * drifted — the previous hero story drew it a third small for a whole
 * generation without anything noticing.
 */
const meta = {
  title: 'UI/OrbitalSphere',
  component: OrbitalSphere,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof OrbitalSphere>

export default meta
type Story = StoryObj<typeof meta>

async function expectJoinedCircles(svg: SVGSVGElement) {
  const paths = [...svg.querySelectorAll('path')]
  await expect(paths).toHaveLength(14)
  for (let arc = 0; arc < paths.length; arc += 2) {
    const pair = paths.slice(arc, arc + 2)
    await expect(pair.reduce((length, path) => length + path.getTotalLength(), 0)).toBeGreaterThan(
      500,
    )
    const ends = pair.flatMap((path) =>
      [...path.getAttribute('d')!.matchAll(/M([^M]+)/g)].flatMap((match) => {
        const points = [...match[1]!.matchAll(/(-?\d+(?:\.\d+)?)[ ,]+(-?\d+(?:\.\d+)?)/g)].map(
          (point) => [Number(point[1]), Number(point[2])] as const,
        )
        return points.length > 1 ? [points[0]!, points.at(-1)!] : []
      }),
    )
    await expect(ends.length).toBeGreaterThan(0)
    for (const [index, point] of ends.entries()) {
      await expect(
        ends.some(
          (other, j) => index !== j && Math.hypot(point[0] - other[0], point[1] - other[1]) <= 0.2,
        ),
      ).toBe(true)
    }
  }
}

/** The drawing itself, still, at each preset — not a composition any band draws,
 *  but the only way to see the atom rather than a crop of it. */
export const Presets: Story = {
  args: {},
  globals: { backgrounds: { value: 'ink' } },
  render: () => (
    <div className="grid grid-cols-3">
      <div className="bg-ink relative isolate flex h-[360px] items-center justify-center">
        <OrbitalSphere
          preset="hero"
          className="left-1/2 top-1/2 w-[220px] -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      <div className="bg-ink-deep relative isolate flex h-[360px] items-center justify-center">
        <OrbitalSphere
          preset="background"
          className="left-1/2 top-1/2 w-[220px] -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      <div className="bg-bone relative isolate flex h-[360px] items-center justify-center">
        <OrbitalSphere
          preset="line"
          className="left-1/2 top-1/2 w-[220px] -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.getAnimations({ subtree: true })).toHaveLength(0)
    const globes = [...canvasElement.querySelectorAll('svg')].filter(
      (svg) => svg.querySelectorAll('path').length === 14,
    )
    await expect(globes).toHaveLength(3)
    for (const svg of globes) await expectJoinedCircles(svg)
  },
}

/** The same atom turning, with the coloured great circles breathing against it.
 *  `still` is the default deliberately — a decorative background that turns
 *  forever is what `prefers-reduced-motion` is about, so a band asks for motion
 *  rather than opting out of it. */
export const Turning: Story = {
  args: { motion: 'orbit' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink relative isolate flex h-[560px] items-center justify-center overflow-hidden">
      <OrbitalSphere
        {...args}
        className="left-1/2 top-1/2 w-[440px] -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const pulses = () =>
      canvasElement
        .getAnimations({ subtree: true })
        .filter(
          (animation): animation is CSSAnimation =>
            animation instanceof CSSAnimation && animation.animationName === 'globe-pulse',
        )

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await expect(pulses()).toHaveLength(0)
      return
    }

    await waitFor(() => expect(pulses()).toHaveLength(2))
    for (const pulse of pulses()) {
      const effect = pulse.effect as KeyframeEffect
      const { delay = 0, duration } = effect.getTiming()
      const arc = effect.target as Element
      const currentTime = pulse.currentTime
      pulse.pause()
      try {
        pulse.currentTime = delay
        await expect(Number(getComputedStyle(arc).opacity)).toBeCloseTo(1)
        pulse.currentTime = delay + Number(duration) / 2
        await expect(Number(getComputedStyle(arc).opacity)).toBeCloseTo(0.45)
        pulse.currentTime = delay + Number(duration)
        await expect(Number(getComputedStyle(arc).opacity)).toBeCloseTo(1)
      } finally {
        pulse.currentTime = currentTime
        pulse.play()
      }
    }
  },
}

/** A controlled display clock makes skipped geometry updates reproducible. */
export const FramePacing: Story = {
  ...Turning,
  play: async ({ mount, canvasElement }) => {
    const request = window.requestAnimationFrame
    const cancel = window.cancelAnimationFrame
    const now = performance.now
    const frames = new Map<number, FrameRequestCallback>()
    let time = 0
    let handle = 0
    window.requestAnimationFrame = (callback) => {
      frames.set(--handle, callback)
      return handle
    }
    window.cancelAnimationFrame = (id) => {
      frames.delete(id)
    }
    performance.now = () => time
    const step = (next: number) => {
      time = next
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach((callback) => callback(time))
    }
    try {
      await mount()
      const geometry = () =>
        [...canvasElement.querySelectorAll('path')].map((path) => path.getAttribute('d')).join('')
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const still = geometry()
        step(1000)
        await expect(geometry()).toBe(still)
        await expect(canvasElement.getAnimations({ subtree: true })).toHaveLength(0)
        return
      }
      step(0)
      const initial = geometry()
      step(1000 / 120)
      await expect(geometry()).not.toBe(initial)
      const next = geometry()
      step(1000 / 60)
      await expect(geometry()).not.toBe(next)

      // Captured from the published renderer at stable 30Hz, including its
      // first accepted step. Literals are independent of the new clock math.
      const references = [
        {
          pointer: false,
          dots: [
            [609.6, 878.8, 2.2],
            [675.1, 470.7, 2.1],
            [574.1, 283.1, 3.2],
            [368, 436.6, 2.3],
          ],
        },
        {
          pointer: true,
          dots: [
            [583.9, 851.9, 2.1],
            [627.8, 435.9, 2.1],
            [615.3, 308.1, 3.3],
            [336.5, 418.9, 2.4],
          ],
        },
      ]
      for (const reference of references) {
        for (const hz of [15, 30, 60, 120]) {
          time = 0
          await mount()
          if (reference.pointer) {
            window.dispatchEvent(
              new MouseEvent('mousemove', {
                clientX: innerWidth * 0.75,
                clientY: innerHeight * 0.25,
              }),
            )
          }
          for (let tick = 0; tick <= hz; tick++) step((tick * 1000) / hz)
          const svg = [...canvasElement.querySelectorAll('svg')].find(
            (svg) => svg.querySelectorAll('path').length === 14,
          )!
          const dots = [...svg.querySelectorAll('circle')].slice(0, 4)
          await expect(dots).toHaveLength(4)
          for (const [index, dot] of dots.entries()) {
            for (const [coordinate, attribute] of ['cx', 'cy', 'r'].entries()) {
              await expect(Number(dot.getAttribute(attribute))).toBeCloseTo(
                reference.dots[index]![coordinate]!,
                1,
              )
            }
          }
        }
      }
      time = 0
      await mount()
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: innerWidth * 0.75, clientY: innerHeight * 0.25 }),
      )
      step(0)
      const hidden = Object.getOwnPropertyDescriptor(document, 'hidden')
      try {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true })
        document.dispatchEvent(new Event('visibilitychange'))
        const paused = geometry()
        step(500)
        await expect(geometry()).toBe(paused)
      } finally {
        if (hidden) Object.defineProperty(document, 'hidden', hidden)
        else Reflect.deleteProperty(document, 'hidden')
        document.dispatchEvent(new Event('visibilitychange'))
      }
      step(1000)
      const svg = [...canvasElement.querySelectorAll('svg')].find(
        (svg) => svg.querySelectorAll('path').length === 14,
      )!
      const dot = svg.querySelector('circle')!
      // Published renderer with only two accepted paints: 0ms and 1000ms.
      await expect(Number(dot.getAttribute('cx'))).toBe(606.6)
      await expect(Number(dot.getAttribute('cy'))).toBe(873.7)
      for (const angleTime of [15000, 30000, 60000]) {
        step(angleTime)
        await expectJoinedCircles(svg)
      }
    } finally {
      frames.clear()
      window.requestAnimationFrame = request
      window.cancelAnimationFrame = cancel
      performance.now = now
      // Storybook's mount remounts the scene; leave its ordinary live clock
      // running for someone inspecting this story after the assertions.
      await mount()
    }
  },
}

/** Two on one page. The export found its host by a hardcoded global element id,
 *  so the second one never drew; this is the story that would have caught it. */
export const TwoOnAPage: Story = {
  args: { motion: 'orbit' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink relative isolate flex h-[420px] items-center justify-around overflow-hidden">
      <OrbitalSphere
        {...args}
        preset="hero"
        className="left-[8%] top-1/2 w-[280px] -translate-y-1/2"
      />
      <OrbitalSphere
        {...args}
        preset="background"
        className="right-[8%] top-1/2 w-[280px] -translate-y-1/2"
      />
    </div>
  ),
}

/* ---------------------------------------------------------------------------
 * The real call sites. Values below are copied from the renderers, not invented.
 * ------------------------------------------------------------------------- */

/** The Home opener. The sphere is 120% of the frame width, hung so only its cap
 *  shows, on a band that closes on a hard edge. The ratio deliberately does not
 *  carry to 402 — see the component comment. */
export const HomeOpener: Story = {
  args: { preset: 'hero', motion: 'orbit' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink relative isolate h-[520px] overflow-hidden">
      <OrbitalSphere
        {...args}
        className="bottom-[-111vw] left-1/2 w-[148vw] -translate-x-1/2 lg:bottom-[-100vw] lg:w-[120vw]"
      />
    </div>
  ),
}

/** The interior hero on ink — the red globe, off the band's right shoulder. */
export const InteriorHeroInk: Story = {
  args: { preset: 'hero', motion: 'orbit' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink relative isolate h-[520px] overflow-hidden">
      <OrbitalSphere
        {...args}
        className="left-[205px] top-[184px] -z-10 w-[918px] lg:left-auto lg:right-[-117px]"
      />
    </div>
  ),
}

/** The interior hero on bone — the line drawing, most of it past the right edge
 *  with the arcs crossing the copy's right shoulder. */
export const InteriorHeroBone: Story = {
  args: { preset: 'line', motion: 'orbit' },
  globals: { backgrounds: { value: 'bone' } },
  render: (args) => (
    <div className="bg-bone relative isolate h-[520px] overflow-hidden">
      <OrbitalSphere
        {...args}
        className="left-[171px] top-[178px] -z-10 w-[720px] lg:left-auto lg:right-[-147px] lg:top-[98px]"
      />
    </div>
  ),
}

/** The closing CTA band — centred so the band shows the sphere's underside. */
export const CtaBand: Story = {
  args: { preset: 'hero', motion: 'orbit' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink-deep relative isolate h-[520px] overflow-hidden">
      <OrbitalSphere
        {...args}
        className="bottom-[4%] left-1/2 w-[150vw] -translate-x-1/2 lg:w-[90vw]"
      />
    </div>
  ),
}

/** The pull quote's pair, on bone, both `lg:` only — the 402 frame has room for
 *  neither. This is the band where the `line` preset has to hold up. */
export const PullQuotePair: Story = {
  args: { preset: 'line' },
  globals: { backgrounds: { value: 'bone' } },
  render: (args) => (
    <div className="bg-bone relative isolate h-[560px] overflow-hidden">
      <OrbitalSphere
        {...args}
        className="-z-10 hidden lg:left-[-563px] lg:top-[258px] lg:block lg:w-[1155px]"
      />
      <OrbitalSphere
        {...args}
        className="-z-10 hidden lg:left-[734px] lg:top-[643px] lg:block lg:w-[1304px]"
      />
    </div>
  ),
}

const RendererReady = createContext<boolean | undefined>(undefined)
function HandoffProbe({ onReady }: OrbitalRendererProps) {
  const ready = useContext(RendererReady)
  useEffect(() => {
    onReady(ready)
  }, [ready, onReady])
  return null
}
function HandoffExample() {
  const [ready, setReady] = useState<boolean | undefined>(undefined)
  return (
    <>
      <button onClick={() => setReady(!ready)}>Toggle renderer readiness</button>
      <RendererReady.Provider value={ready}>
        <OrbitalRendererContext.Provider value={HandoffProbe}>
          <div className="bg-ink relative h-[500px]">
            <OrbitalSphere motion="orbit" className="inset-0 w-[400px]" />
          </div>
        </OrbitalRendererContext.Provider>
      </RendererReady.Provider>
    </>
  )
}

/** The pending scene stays hidden; success reveals the glow and failure restores SVG. */
export const RendererHandoff: Story = {
  render: () => <HandoffExample />,
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button')!
    const globe = canvasElement.querySelector('[data-orbital-preset]')!
    const moving = globe.querySelector('svg')!
    await expect(getComputedStyle(moving).visibility).toBe('hidden')
    await expect(globe.hasAttribute('data-orbital-loading')).toBe(true)
    await expect(getComputedStyle(globe.querySelector('svg:last-of-type')!).opacity).toBe('0')
    button.click()
    await waitFor(() => expect(globe.getAttribute('data-orbital-gpu')).toBe('true'))
    await expect(getComputedStyle(moving).visibility).toBe('hidden')
    await expect(getComputedStyle(globe.querySelector('svg:last-of-type')!).opacity).toBe('1')
    for (const group of moving.querySelectorAll('g')) {
      await expect(group.style.animation).toBe('')
    }
    button.click()
    await waitFor(() => expect(getComputedStyle(moving).visibility).toBe('visible'))
    await expect(globe.hasAttribute('data-orbital-gpu')).toBe(false)
  },
}
