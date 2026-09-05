import { expect, it } from 'vitest'
import { createCtaParallax } from './cta-parallax'

function layer() {
  const values = new Map<string, string>()
  return {
    style: {
      getPropertyValue: (name: string) => values.get(name) ?? '',
      getPropertyPriority: () => '',
      setProperty: (name: string, value: string) => values.set(name, value),
      removeProperty: (name: string) => values.delete(name),
    },
  } as unknown as HTMLElement
}

it('owns the glow translation and returns that same position for the GPU frame', () => {
  const glow = layer()
  const parallax = createCtaParallax(glow)
  expect(glow.style.getPropertyValue('animation')).toBe('none')
  const initial = parallax.update({ top: 844, height: 500 }, 844, 1 / 60, false)
  expect(initial).toBeCloseTo(-50)
  expect(glow.style.getPropertyValue('translate')).toBe(`0 ${initial}px`)
  const next = parallax.update({ top: 172, height: 500 }, 844, 1 / 60, false)
  expect(next).toBeGreaterThan(initial)
  expect(next).toBeLessThan(0)
  expect(glow.style.getPropertyValue('translate')).toBe(`0 ${next}px`)
  parallax.dispose()
  expect(glow.style.getPropertyValue('animation')).toBe('')
  expect(glow.style.getPropertyValue('translate')).toBe('')
})

it('continues smoothly after a delayed mobile frame instead of snapping to the scroll target', () => {
  const parallax = createCtaParallax(layer())
  parallax.update({ top: 844, height: 500 }, 844, 1 / 60, false)
  const afterPause = parallax.update({ top: -500, height: 500 }, 844, 2, false)
  expect(afterPause).toBeGreaterThan(-50)
  expect(afterPause).toBeLessThan(-40)
  let settled = afterPause
  for (let i = 0; i < 360; i++)
    settled = parallax.update({ top: -500, height: 500 }, 844, 1 / 60, false)
  expect(settled).toBeCloseTo(50, 2)
  expect(parallax.update({ top: -500, height: 500 }, 844, 1 / 60, true)).toBe(0)
})

it('restores existing inline styles when the GPU yields to the SVG fallback', () => {
  const glow = layer()
  glow.style.setProperty('translate', '0 12px')
  const parallax = createCtaParallax(glow)
  parallax.update({ top: 0, height: 500 }, 844, 1 / 60, false)
  parallax.dispose()
  expect(glow.style.getPropertyValue('translate')).toBe('0 12px')
})
