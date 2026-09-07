import { beforeEach, expect, it, vi } from 'vitest'
import { frame, type Draw } from 'vgpu'
import { drawGlobeGeometry, startSpatialGlobe } from './renderer'
import type { GlobeRuntime } from './globe-runtime'

vi.mock('./resolve-color', () => ({ resolveColor: () => '#ff1000' }))

const gpu = vi.hoisted(() => ({ dispose: vi.fn() }))
const target = { dispose: vi.fn(), size: [128, 128], format: 'bgra8unorm' }
const scene = vi.hoisted(() => ({
  color: { destroy: vi.fn() },
  depth: { destroy: vi.fn() },
  resize: vi.fn(),
  destroy: vi.fn(),
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

it.each([
  { range: 'hero', stars: false },
  { range: 'cta', stars: false },
  { range: 'hero', stars: true },
  { range: 'cta', stars: true },
])(
  'updates the $range glow before measuring geometry (quiet sky: $stars) and releases it on abort',
  async ({ range, stars }) => {
    const values = new Map<string, string>()
    const style = {
      setProperty: (name: string, value: string) => values.set(name, value),
      getPropertyValue: (name: string) => values.get(name) ?? '',
      getPropertyPriority: () => '',
      removeProperty: (name: string) => values.delete(name),
    }
    const glow = {
      style,
      matches: (selector: string) => selector === `.${range}-lag`,
    }
    let top = 844
    const hero = {
      matches: (selector: string) => range === 'cta' && selector === '.cta-band',
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
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 390,
        height: 500,
      }),
    }
    const listeners = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
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
    vi.stubGlobal('navigator', {
      gpu: { getPreferredCanvasFormat: () => 'bgra8unorm' },
    })
    Object.assign(gpu, {
      onError: vi.fn(),
      gpu: { lost: new Promise(() => {}) },
    })
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
          stars,
          quietStars: stars,
          onReady,
        },
      )
      tick(0)
      if (stars) {
        const lease: Awaited<ReturnType<GlobeRuntime['acquire']>> = await vi.mocked(runtime.acquire)
          .mock.results[0]!.value
        const draw = vi.mocked(lease.draw)
        const skyIndex = draw.mock.calls.findIndex(([kind]) => kind === 'quietStars')
        const sky = draw.mock.results[skyIndex]!.value
        expect(vi.mocked(sky.set).mock.calls[0]![0]).toMatchObject({
          p: {
            viewport: [390, 500, 0, 1],
            motion: [expect.any(Number), -0, 0, Number(range === 'cta')],
          },
        })
        expect(draw.mock.calls.filter(([kind]) => kind === 'quietStars')).toHaveLength(1)
        expect(draw.mock.calls.some(([kind]) => kind === 'stars' || kind === 'shootingStar')).toBe(
          false,
        )
      }
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
      expect(scene.destroy).toHaveBeenCalledOnce()
      expect(release).toHaveBeenCalledOnce()
      expect(gpu.dispose).not.toHaveBeenCalled()
    } finally {
      controller.abort()
      vi.unstubAllGlobals()
    }
  },
)

it('draws only the visible rings, planets, and rim', () => {
  const planet = { label: 'planet' } as unknown as Draw
  const rail = { label: 'rail' } as unknown as Draw
  const rim = { label: 'rim' } as unknown as Draw
  const draw = vi.fn()
  drawGlobeGeometry({ draw }, { rings: [rail], electrons: [[planet]], rim })
  expect(draw.mock.calls.map(([item]) => item)).toEqual([rail, planet, rim])
})

it('releases a partially prepared footer when navigation aborts a yielded setup', async () => {
  let clock = 0
  const now = vi.spyOn(performance, 'now').mockImplementation(() => (clock += 10))
  const controller = new AbortController()
  try {
    const pending = startSpatialGlobe(
      {} as HTMLCanvasElement,
      { matches: () => true } as unknown as HTMLElement,
      {} as HTMLElement,
      controller.signal,
      runtime,
      {
        arcs: [
          {
            u: [1, 0, 0],
            v: [0, 1, 0],
            col: '#ff1000',
            op: 1,
            w: 1,
            dots: [],
            colored: true,
            i: 0,
          },
        ],
        preset: 'hero',
        motion: 'orbit',
        opacity: 1,
        electronOpacity: 1,
        stars: true,
        quietStars: true,
        onReady: vi.fn(),
      },
    )
    await Promise.resolve()
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(frame).not.toHaveBeenCalled()
    expect(scene.destroy).toHaveBeenCalledOnce()
    expect(target.dispose).toHaveBeenCalledOnce()
    expect(release).toHaveBeenCalledOnce()
  } finally {
    now.mockRestore()
  }
})
