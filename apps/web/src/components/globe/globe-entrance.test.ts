import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createGlobeEntrance, readSkyEntranceOffset } from './globe-entrance'

beforeEach(() => vi.stubGlobal('innerWidth', 1155))
afterEach(() => vi.unstubAllGlobals())

function scene(top = 0, delay = 480, itemCount = delay / 160 + 1) {
  const values = new Map<string, string>([['translate', '-50% 0px']])
  const globe = {
    style: {
      getPropertyValue: (name: string) => values.get(name) ?? '',
      getPropertyPriority: () => '',
      setProperty: (name: string, value: string) => values.set(name, value),
      removeProperty: (name: string) => values.delete(name),
    },
    getBoundingClientRect: () => ({ top: 700 }),
  } as unknown as HTMLElement
  const hero = {
    querySelectorAll: () =>
      Array.from({ length: itemCount }, () => ({
        getAnimations: () => [
          {
            startTime: 50,
            effect: {
              getKeyframes: () => [{ opacity: 0 }, { opacity: 1 }],
              getTiming: () => ({ delay, duration: 700 }),
            },
          },
        ],
      })),
    getBoundingClientRect: () => ({ top, bottom: 900 }),
  } as unknown as HTMLElement
  const entrance = createGlobeEntrance(globe, hero)
  const update = (elapsed: number, still = false) => {
    return entrance.update(elapsed + 50, still)
  }
  const offset = () => Number(globe.style.getPropertyValue('transform').match(/-?[\d.]+/)?.[0] ?? 0)
  return { globe, hero, entrance, update, offset }
}

it('starts half a beat after the second headline line and drifts back after the CTA finishes', () => {
  const { globe, update, offset } = scene()
  update(0)
  expect(offset()).toBe(230)
  update(100)
  expect(offset()).toBe(230)
  update(160)
  expect(offset()).toBe(230)
  update(240)
  expect(offset()).toBe(230)
  update(260)
  expect(offset()).toBeLessThan(230)
  update(455)
  expect(offset()).toBeGreaterThan(0)
  update(600)
  expect(offset()).toBeGreaterThan(0)
  update(2480)
  expect(globe.style.getPropertyValue('transform')).toBe('')
  expect(globe.style.getPropertyValue('translate')).toBe('-50% 0px')
})

it('catches up to the stagger when the GPU becomes visible later', () => {
  const { update, offset } = scene()
  update(460)
  expect(offset()).toBeLessThan(207)
  expect(offset()).toBeGreaterThan(0)
  update(1500)
  expect(offset()).toBeLessThan(0)
  update(2480)
  expect(offset()).toBe(0)
})

it('starts at rest when GPU readiness misses the hero sequence', () => {
  const { update, offset } = scene()
  update(2500)
  expect(offset()).toBe(0)
})

it('follows the shorter stagger when optional text is absent', () => {
  const { update, offset } = scene(0, 320)
  update(1500)
  expect(offset()).toBeLessThan(0)
  update(2350)
  expect(offset()).toBe(0)
})

it('keeps reduced motion and restored scroll positions at rest', () => {
  const reduced = scene()
  reduced.update(0, true)
  expect(reduced.offset()).toBe(0)
  const restored = scene(-200)
  restored.update(0)
  expect(restored.offset()).toBe(0)
})

it('restores the original style when interrupted', () => {
  const { globe, entrance, update } = scene()
  update(0)
  entrance.dispose()
  expect(globe.style.getPropertyValue('transform')).toBe('')
})

it('keeps the 55.2px mobile rise with the longer release', () => {
  vi.stubGlobal('innerWidth', 402)
  const { globe, update, offset } = scene()
  update(0)
  expect(offset()).toBe(55.2)
  update(580)
  expect(offset()).toBeLessThan(55.2)
  expect(offset()).toBeGreaterThan(0)
  update(2480)
  expect(globe.style.getPropertyValue('transform')).toBe('')
  expect(globe.style.getPropertyValue('translate')).toBe('-50% 0px')
})

it.each([1155, 402])('slows early, overshoots gently, and returns to rest at %ipx', (width) => {
  vi.stubGlobal('innerWidth', width)
  const { update, offset } = scene()
  update(0)
  const distance = offset()
  update(568)
  const beforePeak = offset()
  update(731)
  const afterPeak = offset()
  update(895)
  const later = offset()
  expect(afterPeak - later).toBeLessThan(beforePeak - afterPeak)
  update(1650)
  const overshoot = offset()
  expect(overshoot).toBeLessThan(0)
  expect(overshoot).toBeGreaterThanOrEqual(-Math.min(6, distance * 0.03))
  update(2350)
  expect(offset()).toBeLessThan(0)
  expect(offset()).toBeGreaterThan(overshoot)
  expect(Math.abs(offset())).toBeLessThan(distance * 0.002)
  update(2480)
  expect(offset()).toBe(0)
})

it('keeps the static fallback when there is no text animation clock', () => {
  const { hero, update, offset } = scene()
  hero.querySelectorAll = () => [] as unknown as NodeListOf<Element>
  update(0)
  expect(offset()).toBe(0)
})

it('supplies the same displacement to the camera and the glow, then returns zero at rest', () => {
  const { update, offset } = scene()
  expect(update(160)).toBeCloseTo(offset(), 3)
  expect(update(1650)).toBeCloseTo(offset(), 3)
  expect(update(2480)).toBe(0)
  expect(update(2540)).toBe(0)
})

it('preserves the camera motion when the CTA gets a longer reading pause', () => {
  const original = scene()
  const spaced = scene(0, 620, 4)
  for (const elapsed of [0, 240, 260, 600, 1500, 1878, 2350, 2480]) {
    expect(spaced.update(elapsed)).toBeCloseTo(original.update(elapsed), 6)
  }
})

it('holds the camera at its starting pose while the text clock waits for GPU readiness', () => {
  const { hero, update, offset } = scene()
  const animation = {
    currentTime: 0,
    startTime: null,
    effect: {
      getKeyframes: () => [{ opacity: 0 }, { opacity: 1 }],
      getTiming: () => ({ delay: 620, duration: 700 }),
    },
  }
  hero.querySelectorAll = () =>
    Array.from({ length: 4 }, () => ({
      getAnimations: () => [animation],
    })) as unknown as NodeListOf<Element>
  update(900)
  expect(offset()).toBe(230)
  animation.currentTime = 600
  update(1500)
  expect(offset()).toBeGreaterThan(0)
  expect(offset()).toBeLessThan(230)
})

it('moves the sky with the nav while the globe is still waiting for its text beat', () => {
  const animation = {
    animationName: 'hero-wave',
    startTime: null as number | null,
    currentTime: 0,
    effect: { getTiming: () => ({ duration: 1860 }) },
  }
  const { hero, update } = scene()
  Object.assign(hero, {
    ownerDocument: { getElementById: () => ({ getAnimations: () => [animation] }) },
  })
  expect(readSkyEntranceOffset(hero, 900, 230)).toBe(230)
  animation.startTime = 50
  expect(readSkyEntranceOffset(hero, 150, 230)).toBeLessThan(230)
  expect(update(100)).toBeCloseTo(230, 6)
  expect(readSkyEntranceOffset(hero, 1910, 230)).toBe(0)
  expect(update(1860)).toBeLessThan(0)
  Object.assign(hero, { ownerDocument: { getElementById: () => null } })
  expect(readSkyEntranceOffset(hero, 0, 230)).toBe(0)
})

it('keeps the sky rising without the globe overshoot and downward return', () => {
  const hero = {
    ownerDocument: {
      getElementById: () => ({
        getAnimations: () => [
          {
            animationName: 'hero-wave',
            startTime: 0,
            effect: { getTiming: () => ({ duration: 1860 }) },
          },
        ],
      }),
    },
  } as unknown as HTMLElement
  for (const distance of [55.2, 198.74, 460]) {
    let previous = distance
    for (let now = 0; now <= 2000; now += 16) {
      const offset = readSkyEntranceOffset(hero, now, distance)
      expect(offset).toBeGreaterThanOrEqual(0)
      expect(offset).toBeLessThanOrEqual(previous)
      previous = offset
    }
    expect(previous).toBe(0)
  }
})
