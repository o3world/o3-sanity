import { afterEach, expect, it, vi } from 'vitest'
import { startStartupSky } from './startup-sky-bootstrap'
import { createStartupSky } from './startup-sky'
import { starHash } from './star-seed'
import { readGlobeEntranceTiming, readSkyEntranceOffset } from './globe-entrance'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('shares the pre-hydration scene clock without changing React-owned hero attributes', () => {
  vi.useFakeTimers()
  vi.spyOn(performance, 'now').mockReturnValue(100)
  const canvas = { getContext: () => null }
  const globe = { querySelector: () => canvas }
  const hero = { dataset: { surface: 'ink' }, querySelector: () => globe }
  vi.stubGlobal('location', { pathname: '/', search: '' })
  vi.stubGlobal('matchMedia', () => ({ matches: true, removeEventListener: vi.fn() }))
  vi.stubGlobal('document', {
    documentElement: { dataset: {}, hasAttribute: () => true },
    querySelector: (selector: string) => (selector === '.hero-band:has(.hero-lead)' ? hero : null),
    removeEventListener: vi.fn(),
  })
  vi.stubGlobal(
    'MutationObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )

  startStartupSky(createStartupSky, starHash, readSkyEntranceOffset, readGlobeEntranceTiming)

  expect(hero.dataset).toEqual({ surface: 'ink' })
  expect(readGlobeEntranceTiming(hero as unknown as HTMLElement, 350).elapsed).toBe(250)
})

function runningSky() {
  vi.useFakeTimers()
  vi.spyOn(performance, 'now').mockReturnValue(100)
  const reduced = new EventTarget() as EventTarget & { matches: boolean }
  reduced.matches = false
  const root = {
    dataset: {} as Record<string, string>,
    hasAttribute: () => root.dataset.spatialEntrance !== undefined,
    __o3SpatialMotion: undefined as { now(timestamp: number): number } | undefined,
  }
  const canvas = {
    isConnected: true,
    width: 0,
    height: 0,
    dataset: {} as Record<string, string>,
    style: {},
    getContext: () => ({ setTransform: vi.fn(), clearRect: vi.fn() }),
  }
  const globe = {
    isConnected: true,
    querySelector: () => canvas,
    hasAttribute: () => true,
    getBoundingClientRect: () => ({ top: 700, left: 0, width: 680 }),
  }
  let ready = false
  const hero = {
    isConnected: true,
    querySelector: () => globe,
    hasAttribute: () => ready,
    getBoundingClientRect: () => ({ top: 0, bottom: 900, left: 0, width: 1200, height: 900 }),
  }
  vi.stubGlobal('location', { pathname: '/', search: '' })
  vi.stubGlobal('matchMedia', () => reduced)
  const document = new EventTarget()
  Object.assign(document, {
    documentElement: root,
    querySelector: (selector: string) =>
      selector === '.hero-band:has(.hero-lead)' || ready ? hero : null,
  })
  vi.stubGlobal('document', document)
  vi.stubGlobal('window', new EventTarget())
  vi.stubGlobal('innerWidth', 1200)
  vi.stubGlobal('innerHeight', 1000)
  vi.stubGlobal('scrollY', 0)
  vi.stubGlobal('devicePixelRatio', 1)
  vi.stubGlobal(
    'MutationObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  let frame!: FrameRequestCallback
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frame = callback
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const offset = vi.fn(readSkyEntranceOffset)
  // Match the pre-hydration script's serialization boundary: no module closure.
  const bootstrap = new Function(
    `return (${startStartupSky.toString()})`,
  )() as typeof startStartupSky
  bootstrap(() => () => [], starHash, offset, readGlobeEntranceTiming)
  return {
    root,
    canvas,
    hero,
    offset,
    frame: (now: number) => frame(now),
    ready: () => {
      ready = true
    },
    reduce: (matches: boolean) => {
      reduced.matches = matches
      reduced.dispatchEvent(new Event('change'))
    },
  }
}

it('retires copy entrance after reduced motion is enabled without replaying on disable', () => {
  const sky = runningSky()
  expect(sky.root.dataset.spatialEntrance).toBe('true')
  sky.reduce(true)
  expect(sky.root.dataset.spatialEntrance).toBe('still')
  sky.reduce(false)
  expect(sky.root.dataset.spatialEntrance).toBe('still')
})

it('does not re-arm the copy entrance after a client route clears it', () => {
  const sky = runningSky()
  delete sky.root.dataset.spatialEntrance
  sky.reduce(true)
  sky.reduce(false)
  sky.frame(200)
  expect(sky.root.dataset.spatialEntrance).toBeUndefined()
  expect(sky.canvas.width).toBe(0)
})

it('uses raw timestamps before hydration and the installed motion clock on subsequent frames', () => {
  const sky = runningSky()
  expect(sky.offset).toHaveBeenLastCalledWith(
    sky.hero,
    100,
    expect.closeTo(230),
    readGlobeEntranceTiming,
  )
  sky.root.__o3SpatialMotion = { now: vi.fn(() => 150) }
  sky.frame(2000)
  expect(sky.root.__o3SpatialMotion.now).toHaveBeenCalledWith(2000)
  expect(sky.offset).toHaveBeenLastCalledWith(
    sky.hero,
    150,
    expect.closeTo(230),
    readGlobeEntranceTiming,
  )
})

it('finishes the GPU crossfade after 220 wall-clock milliseconds while motion is paused', () => {
  const sky = runningSky()
  sky.root.__o3SpatialMotion = { now: () => 100 }
  sky.ready()
  sky.frame(2000)
  sky.frame(2219)
  expect(sky.canvas.width).toBe(1200)
  sky.frame(2220)
  expect(sky.canvas.width).toBe(0)
})

it('expires the startup deadline on wall time while motion is paused', () => {
  const sky = runningSky()
  sky.root.__o3SpatialMotion = { now: () => 100 }
  vi.advanceTimersByTime(10000)
  expect(sky.root.dataset.spatialChrome).toBeUndefined()
  sky.frame(10100)
  expect(sky.canvas.width).toBe(0)
})
