import { afterEach, expect, it, vi } from 'vitest'
import { observeGlobeAvailability } from './observe-globe-availability'

afterEach(() => vi.unstubAllGlobals())

it('waits for both proximity and visible dimensions, and releases CSS-hidden globes', () => {
  let intersect: (entries: { isIntersecting: boolean }[]) => void = () => {}
  let resize: () => void = () => {}
  const disconnectIntersection = vi.fn()
  const disconnectResize = vi.fn()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: typeof intersect) {
        intersect = callback
      }
      observe() {}
      disconnect = disconnectIntersection
    },
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: typeof resize) {
        resize = callback
      }
      observe() {}
      disconnect = disconnectResize
    },
  )
  let width = 0
  const host = { getBoundingClientRect: () => ({ width, height: width }) } as HTMLElement
  const onChange = vi.fn()
  const stop = observeGlobeAvailability(host, host, onChange)
  intersect([{ isIntersecting: true }])
  expect(onChange).not.toHaveBeenCalled()
  width = 918
  resize()
  expect(onChange.mock.calls).toEqual([[true]])
  intersect([{ isIntersecting: false }])
  expect(onChange.mock.calls).toEqual([[true]])
  width = 0
  resize()
  expect(onChange.mock.calls).toEqual([[true], [false]])
  width = 918
  resize()
  expect(onChange.mock.calls).toEqual([[true], [false]])
  intersect([{ isIntersecting: true }])
  expect(onChange.mock.calls).toEqual([[true], [false], [true]])
  stop()
  expect(disconnectIntersection).toHaveBeenCalledOnce()
  expect(disconnectResize).toHaveBeenCalledOnce()
})
