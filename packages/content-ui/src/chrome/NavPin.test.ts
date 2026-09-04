// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'

import { syncNavPin, watchNavPin } from './NavPin'

/**
 * The header's `top` is CSS arithmetic over `--nav-scroll`; what this pins
 * down is that the variable is the scroll, clamped at the resting offset —
 * the pill rides up with the strip and never reports past where `max()` has
 * already parked it.
 */
describe('watchNavPin', () => {
  const stops: Array<() => void> = []

  afterEach(() => {
    stops.splice(0).forEach((stop) => stop())
    document.body.innerHTML = ''
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    vi.restoreAllMocks()
  })

  function mount(rest = '124px') {
    const header = document.createElement('header')
    header.style.setProperty('--spacing-nav-offset', rest)
    document.body.append(header)
    stops.push(watchNavPin(header))
    return header
  }

  function scrollTo(y: number) {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }

  it('reports the scroll while the strip is still leaving', async () => {
    const header = mount()
    expect(header.style.getPropertyValue('--nav-scroll')).toBe('0px')
    await scrollTo(40)
    expect(header.style.getPropertyValue('--nav-scroll')).toBe('40px')
  })

  it('clamps at the resting offset once the pill has parked', async () => {
    const header = mount()
    await scrollTo(3000)
    expect(header.style.getPropertyValue('--nav-scroll')).toBe('124px')
  })

  it('keeps following scroll after a synchronous route restoration', async () => {
    const header = mount()
    await scrollTo(3000)
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    syncNavPin(header)
    expect(header.style.getPropertyValue('--nav-scroll')).toBe('0px')
    await scrollTo(3000)
    expect(header.style.getPropertyValue('--nav-scroll')).toBe('124px')
  })

  it('stops writing when torn down', async () => {
    const header = mount()
    stops.pop()?.()
    await scrollTo(40)
    expect(header.style.getPropertyValue('--nav-scroll')).toBe('0px')
  })
})
