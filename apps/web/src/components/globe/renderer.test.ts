import { beforeEach, expect, it, vi } from 'vitest'
import { frame, type Draw } from 'vgpu'
import { drawGlobeGeometry, startSpatialGlobe } from './renderer'
import type { GlobeRuntime } from './globe-runtime'

const gpu = vi.hoisted(() => ({ dispose: vi.fn() }))
const target = { dispose: vi.fn(), size: [128, 128], format: 'bgra8unorm' }
const scene = vi.hoisted(() => ({
  color: { destroy: vi.fn() },
  depth: { destroy: vi.fn() },
  resize: vi.fn(),
}))
const release = vi.fn()
const runtime = {
  acquire: vi.fn(async () => ({
    gpu,
    release,
    onError: vi.fn(),
    draw: vi.fn(() => ({ set: vi.fn() })),
  })),
} as unknown as GlobeRuntime
const surface = vi.hoisted(() => vi.fn())
vi.mock('vgpu', () => ({
  init: vi.fn(async () => gpu),
  surface,
  target: vi.fn(() => scene),
  draw: vi.fn(),
  frame: vi.fn(),
}))
beforeEach(() => {
  vi.clearAllMocks()
  surface.mockReturnValue(target)
})

it('releases its lease without destroying the shared GPU when surface setup fails', async () => {
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
      runtime,
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
  expect(release).toHaveBeenCalledOnce()
  expect(gpu.dispose).not.toHaveBeenCalled()
  controller.abort()
  expect(release).toHaveBeenCalledOnce()
  expect(gpu.dispose).not.toHaveBeenCalled()
})

it('releases an aborted lease without creating a surface or destroying the shared GPU', async () => {
  const controller = new AbortController()
  controller.abort()
  await startSpatialGlobe(
    {} as HTMLCanvasElement,
    {} as HTMLElement,
    {} as HTMLElement,
    controller.signal,
    runtime,
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
  expect(release).toHaveBeenCalledOnce()
  expect(gpu.dispose).not.toHaveBeenCalled()
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
    let complete!: () => void
    vi.mocked(frame).mockReturnValue({
      done: new Promise<void>((resolve) => {
        complete = resolve
      }),
    } as ReturnType<typeof frame>)
    vi.stubGlobal('getComputedStyle', () => ({ transitionDuration: '0.2s' }))
    const onReady = vi.fn()
    try {
      await startSpatialGlobe(
        canvas as unknown as HTMLCanvasElement,
        hero as unknown as HTMLElement,
        globe as unknown as HTMLElement,
        controller.signal,
        runtime,
        {
          arcs: [],
          preset: 'hero',
          motion: 'orbit',
          opacity: 1,
          electronOpacity: 1,
          stars: false,
          onReady,
        },
      )
      tick(0)
      expect(onReady).not.toHaveBeenCalled()
      if (range === 'hero') {
        complete()
        await Promise.resolve()
        expect(onReady).toHaveBeenCalledWith(true)
      }
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
      if (range === 'cta') {
        complete()
        await Promise.resolve()
        expect(onReady).not.toHaveBeenCalledWith(true)
      }
      expect(target.dispose).toHaveBeenCalledOnce()
      expect(scene.color.destroy).toHaveBeenCalledOnce()
      expect(scene.depth.destroy).toHaveBeenCalledOnce()
      expect(release).toHaveBeenCalledOnce()
      expect(gpu.dispose).not.toHaveBeenCalled()
    } finally {
      controller.abort()
      vi.unstubAllGlobals()
    }
  },
)

it('paints solid planets before translucent rails can write depth over them', () => {
  const planet = { label: 'planet' } as unknown as Draw
  const planetDepth = { label: 'planetDepth' } as unknown as Draw
  const rail = { label: 'rail' } as unknown as Draw
  const railDepth = { label: 'railDepth' } as unknown as Draw
  const draw = vi.fn()
  drawGlobeGeometry(
    { draw },
    {
      rings: [rail],
      ringDepths: [railDepth],
      electrons: [[planet]],
      electronDepths: [[planetDepth]],
    },
  )
  expect(draw.mock.calls.map(([item]) => item)).toEqual([planetDepth, planet, railDepth, rail])
})
