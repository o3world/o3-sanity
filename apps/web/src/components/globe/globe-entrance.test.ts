import { afterEach, expect, it, vi } from 'vitest'
import { createGlobeEntrance } from './globe-entrance'

afterEach(() => vi.unstubAllGlobals())

function scene(top = 0) {
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
    getBoundingClientRect: () => ({ top, bottom: 900 }),
  } as unknown as HTMLElement
  return { globe, entrance: createGlobeEntrance(globe, hero) }
}

it('starts immediately with a gentle rise and settles at its original position', () => {
  const { globe, entrance } = scene()
  const offset = () => Number(globe.style.getPropertyValue('transform').match(/[\d.]+/)?.[0] ?? 0)
  entrance.update(100, false)
  expect(offset()).toBe(200)
  entrance.update(200, false)
  expect(offset()).toBeLessThan(200)
  expect(offset()).toBeGreaterThan(195)
  entrance.update(600, false)
  expect(offset()).toBeGreaterThan(150)
  expect(offset()).toBeLessThan(160)
  entrance.update(2600, false)
  expect(offset()).toBeLessThan(12)
  expect(globe.style.getPropertyValue('translate')).toBe('-50% 0px')
  entrance.update(5100, false)
  expect(globe.style.getPropertyValue('transform')).toBe('')
  expect(globe.style.getPropertyValue('translate')).toBe('-50% 0px')
})

it('starts a late GPU immediately and gives it the same gentle rise', () => {
  const { globe, entrance } = scene()
  entrance.update(2500, false)
  expect(globe.style.getPropertyValue('transform')).toBe('translateY(200.000px)')
  entrance.update(7500, false)
  expect(globe.style.getPropertyValue('transform')).toBe('')
})

it('keeps reduced-motion and restored scroll positions at rest', () => {
  const reduced = scene()
  reduced.entrance.update(100, true)
  expect(reduced.globe.style.getPropertyValue('transform')).toBe('')
  const restored = scene(-200)
  restored.entrance.update(100, false)
  expect(restored.globe.style.getPropertyValue('transform')).toBe('')
})

it('restores the original style when interrupted', () => {
  const { globe, entrance } = scene()
  entrance.update(100, false)
  entrance.dispose()
  expect(globe.style.getPropertyValue('transform')).toBe('')
})
