import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  createGlobeEntrance,
  readSkyEntranceOffset,
  type GlobeSceneElement,
} from './globe-entrance'

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
    __o3SceneStart: 50,
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
  } as unknown as GlobeSceneElement
  const entrance = createGlobeEntrance(globe, hero)
  const update = (elapsed: number, still = false) => {
    return entrance.update(elapsed + 50, still)
  }
  const offset = () => Number(globe.style.getPropertyValue('transform').match(/-?[\d.]+/)?.[0] ?? 0)
  return { globe, hero, entrance, update, offset }
}

it('starts at 160ms independently of the headline and preserves its release', () => {
  const { globe, update, offset } = scene()
  update(0)
  expect(offset()).toBe(230)
  update(100)
  expect(offset()).toBe(230)
  update(160)
  expect(offset()).toBe(230)
  update(185)
  expect(offset()).toBeLessThan(230)
  update(528.75)
  expect(offset()).toBeGreaterThan(0)
  update(710)
  expect(offset()).toBeGreaterThan(0)
  update(3060)
  expect(globe.style.getPropertyValue('transform')).toBe('')
  expect(globe.style.getPropertyValue('translate')).toBe('-50% 0px')
})

it('catches up to the scene when the GPU becomes visible later', () => {
  const { update, offset } = scene()
  update(535)
  expect(offset()).toBeLessThan(207)
  expect(offset()).toBeGreaterThan(0)
  update(1835)
  expect(offset()).toBeLessThan(0)
  update(3060)
  expect(offset()).toBe(0)
})

it('starts at rest when GPU readiness misses the hero sequence', () => {
  const { update, offset } = scene()
  update(3085)
  expect(offset()).toBe(0)
})

it('keeps the same scene timing when optional text is absent', () => {
  const complete = scene()
  const shorter = scene(0, 320)
  for (const elapsed of [0, 160, 600, 1500, 2350, 2398]) {
    expect(shorter.update(elapsed)).toBeCloseTo(complete.update(elapsed), 6)
  }
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
  update(685)
  expect(offset()).toBeLessThan(55.2)
  expect(offset()).toBeGreaterThan(0)
  update(3060)
  expect(globe.style.getPropertyValue('transform')).toBe('')
  expect(globe.style.getPropertyValue('translate')).toBe('-50% 0px')
})

it.each([1155, 402])('slows early, overshoots gently, and returns to rest at %ipx', (width) => {
  vi.stubGlobal('innerWidth', width)
  const { update, offset } = scene()
  update(0)
  const distance = offset()
  update(670)
  const beforePeak = offset()
  update(873.75)
  const afterPeak = offset()
  update(1078.75)
  const later = offset()
  expect(afterPeak - later).toBeLessThan(beforePeak - afterPeak)
  update(2022.5)
  const overshoot = offset()
  expect(overshoot).toBeLessThan(0)
  expect(overshoot).toBeGreaterThanOrEqual(-Math.min(6, distance * 0.03))
  update(2897.5)
  expect(offset()).toBeLessThan(0)
  expect(offset()).toBeGreaterThan(overshoot)
  expect(Math.abs(offset())).toBeLessThan(distance * 0.002)
  update(3060)
  expect(offset()).toBe(0)
})

it('keeps the static fallback when there is no scene clock', () => {
  const { hero, update, offset } = scene()
  delete hero.__o3SceneStart
  update(0)
  expect(offset()).toBe(0)
})

it('supplies the same displacement to the camera and the glow, then returns zero at rest', () => {
  const { update, offset } = scene()
  expect(update(160)).toBeCloseTo(offset(), 3)
  expect(update(2022.5)).toBeCloseTo(offset(), 3)
  expect(update(3060)).toBe(0)
  expect(update(3135)).toBe(0)
})

it('preserves the camera motion when the CTA gets a longer reading pause', () => {
  const original = scene()
  const spaced = scene(0, 620, 4)
  for (const elapsed of [0, 240, 260, 600, 1500, 1878, 2350, 2480]) {
    expect(spaced.update(elapsed)).toBeCloseTo(original.update(elapsed), 6)
  }
})

it('keeps the sky moving after the nav ends and while the globe is arriving', () => {
  const { hero } = scene()
  const at = (elapsed: number) => readSkyEntranceOffset(hero, elapsed + 50, 230)
  expect(at(0)).toBe(230)
  expect(at(160)).toBeLessThan(at(0))
  expect(at(1900)).toBeGreaterThan(0)
  expect(at(2100)).toBeLessThan(at(1900))
  expect(at(2957.5)).toBe(0)
})

it('keeps the sky rising without the globe overshoot and downward return', () => {
  const { hero } = scene()
  for (const distance of [55.2, 198.74, 460]) {
    let previous = distance
    for (let now = 0; now <= 3050; now += 16) {
      const offset = readSkyEntranceOffset(hero, now, distance)
      expect(offset).toBeGreaterThanOrEqual(0)
      expect(offset).toBeLessThanOrEqual(previous)
      previous = offset
    }
    expect(previous).toBe(0)
  }
})

it('starts the globe at 160ms even when text animations change or disappear', () => {
  const { hero, entrance } = scene()
  hero.querySelectorAll = () => {
    throw new Error('Scene must not read text animations')
  }
  expect(entrance.update(50 + 160, false)).toBeCloseTo(230, 6)
  expect(entrance.update(50 + 180, false)).toBeLessThan(230)
  expect(entrance.update(50 + 2957.5, false)).toBe(0)
})
