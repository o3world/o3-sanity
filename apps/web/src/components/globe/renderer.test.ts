import { beforeEach, expect, it, vi } from 'vitest'
import { startSpatialGlobe } from './renderer'

const gpu = vi.hoisted(() => ({ dispose: vi.fn() }))
const surface = vi.hoisted(() => vi.fn())
vi.mock('vgpu', () => ({ init: vi.fn(async () => gpu), surface, draw: vi.fn(), frame: vi.fn() }))
beforeEach(() => vi.clearAllMocks())

it('disposes the allocated GPU when surface setup fails before listeners are registered', async () => {
  const error = new Error('WebGPU canvas context unavailable')
  surface.mockImplementationOnce(() => {
    throw error
  })
  const controller = new AbortController()
  await expect(
    startSpatialGlobe(
      {} as HTMLCanvasElement,
      {} as HTMLElement,
      {} as HTMLElement,
      controller.signal,
      {
        arcs: [],
        preset: 'hero',
        motion: 'orbit',
        opacity: 1,
        electronOpacity: 1,
        stars: true,
        onReady: vi.fn(),
      },
    ),
  ).rejects.toBe(error)
  expect(gpu.dispose).toHaveBeenCalledOnce()
  controller.abort()
  expect(gpu.dispose).toHaveBeenCalledOnce()
})

it('disposes a device returned after the request was aborted without creating a surface', async () => {
  const controller = new AbortController()
  controller.abort()
  await startSpatialGlobe(
    {} as HTMLCanvasElement,
    {} as HTMLElement,
    {} as HTMLElement,
    controller.signal,
    {
      arcs: [],
      preset: 'hero',
      motion: 'orbit',
      opacity: 1,
      electronOpacity: 1,
      stars: true,
      onReady: vi.fn(),
    },
  )
  expect(gpu.dispose).toHaveBeenCalledOnce()
  expect(surface).not.toHaveBeenCalled()
})

it.each(['hero', 'cta'] as const)(
  'updates the %s glow before measuring the globe for each GPU frame and releases it on abort',
  async (range) => {
    const values = new Map<string, string>()
    const style = {
      setProperty: (name: string, value: string) => values.set(name, value),
      getPropertyValue: (name: string) => values.get(name) ?? '',
      getPropertyPriority: () => '',
      removeProperty: (name: string) => values.delete(name),
    }
    const glow = { style, matches: (selector: string) => selector === `.${range}-lag` }
    let top = 844
    const hero = {
      matches: (selector: string) => selector === '.cta-band',
      dataset: {},
      getBoundingClientRect: () => ({ top, height: 500 }),
    }
    const measured: string[] = []
    const globe = {
      closest: (selector: string) => (selector === '.hero-lag, .cta-lag' ? glow : hero),
      getBoundingClientRect: () => {
        measured.push(values.get('translate') ?? '')
        return { left: 0, top: 0, width: 585, height: 585 }
      },
    }
    const canvas = {
      style: {},
      dataset: {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 500 }),
    }
    const listeners = { addEventListener: vi.fn(), removeEventListener: vi.fn() }
    let tick: FrameRequestCallback = () => {}
    const observer = class {
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('window', listeners)
    vi.stubGlobal('document', {
      ...listeners,
      hidden: false,
      documentElement: { clientHeight: 844 },
    })
    vi.stubGlobal('location', { search: '' })
    vi.stubGlobal('innerWidth', 390)
    vi.stubGlobal('matchMedia', () => ({ ...listeners, matches: false }))
    vi.stubGlobal('IntersectionObserver', observer)
    vi.stubGlobal('ResizeObserver', observer)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      tick = callback
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('navigator', { gpu: { getPreferredCanvasFormat: () => 'bgra8unorm' } })
    Object.assign(gpu, { onError: vi.fn(), gpu: { lost: new Promise(() => {}) } })
    const controller = new AbortController()
    try {
      await startSpatialGlobe(
        canvas as unknown as HTMLCanvasElement,
        hero as unknown as HTMLElement,
        globe as unknown as HTMLElement,
        controller.signal,
        {
          arcs: [],
          preset: 'hero',
          motion: 'orbit',
          opacity: 1,
          electronOpacity: 1,
          stars: false,
          onReady: vi.fn(),
        },
      )
      tick(0)
      expect(measured[0]).toBe(range === 'hero' ? '0 0vh' : '0 -50px')
      expect(values.get('animation')).toBe('none')
      top = -500
      tick(2000)
      const position = Number(measured[1]?.split(' ')[1]?.replace(/px|vh/, ''))
      expect(position).toBeGreaterThan(range === 'hero' ? 0 : -50)
      expect(position).toBeLessThan(range === 'hero' ? 2 : -40)
      controller.abort()
      expect(values.has('animation')).toBe(false)
      expect(values.has('translate')).toBe(false)
    } finally {
      controller.abort()
      vi.unstubAllGlobals()
    }
  },
)
