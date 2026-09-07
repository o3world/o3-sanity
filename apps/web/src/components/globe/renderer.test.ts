import { beforeEach, expect, it, vi } from 'vitest'
import { frame, type Draw, type FramePass } from 'vgpu'
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
  target.size = [128, 128]
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
  { range: 'cta', stars: true, width: 1023 },
  { range: 'cta', stars: true, width: 1024 },
  { range: 'cta', stars: true, width: 1440 },
  { range: 'cta', stars: true, width: 1440, search: '?spatial-still' },
  { range: 'hero', stars: true, search: '?spatial-still' },
  { range: 'cta', stars: true, search: '?spatial-still' },
  { range: 'cta', stars: true, search: '?footer-stars=animated' },
])(
  'renders and releases $range (quiet sky: $stars, width: $width, query: $search)',
  async ({ range, stars, width = 390, search = '' }) => {
    const cached = range === 'cta' && stars && width < 1024
    const still = cached || search.includes('spatial-still')
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
    let globeLeft = 0
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
        return { left: globeLeft, top, width: 585, height: 585 }
      },
    }
    const canvas = {
      style: {},
      dataset: {},
      getBoundingClientRect: () => ({
        left: 0,
        top,
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
    vi.stubGlobal('location', { search })
    vi.stubGlobal('innerWidth', width)
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
    const rendered = vi.fn()
    const submission = {
      done: new Promise<void>((resolve) => {
        complete = resolve
      }),
    } as ReturnType<typeof frame>
    vi.mocked(frame).mockImplementation((_gpu, submit) => {
      submit?.({
        pass: (_target: unknown, draw: (pass: FramePass) => void) =>
          draw({ draw: rendered } as unknown as FramePass),
      } as unknown as Parameters<NonNullable<typeof submit>>[0])
      return submission
    })
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
      expect(hero.dataset).not.toHaveProperty('footerTest')
      expect(measured[0]).toBe(range === 'hero' ? '0 0vh' : still ? '0 0px' : '0 -50px')
      expect(values.get('animation')).toBe('none')
      top = -500
      const scroll = listeners.addEventListener.mock.calls.find(([name]) => name === 'scroll')![1]
      scroll()
      tick(2000)
      expect(frame).toHaveBeenCalledTimes(cached && search.includes('spatial-still') ? 1 : 2)
      expect(scene.resize).toHaveBeenCalledTimes(cached ? 1 : 2)
      if (cached) {
        const lease: Awaited<ReturnType<GlobeRuntime['acquire']>> = await vi.mocked(runtime.acquire)
          .mock.results[0]!.value
        const draw = vi.mocked(lease.draw)
        const sky =
          draw.mock.results[draw.mock.calls.findIndex(([kind]) => kind === 'quietStars')]!.value
        const composite =
          draw.mock.results[draw.mock.calls.findIndex(([kind]) => kind === 'cachedComposite')]!
            .value
        expect(rendered.mock.calls.slice(-2).map(([item]) => item)).toEqual([sky, composite])
        const skyTime = vi.mocked(sky.set).mock.calls.at(-1)![0] as { p: { motion: number[] } }
        if (search.includes('spatial-still')) expect(skyTime.p.motion[0]).toBe(0)
        else expect(skyTime.p.motion[0]).toBeGreaterThan(0)
      }
      if (cached && !search.includes('spatial-still')) {
        target.size = [256, 256]
        tick(2100)
        expect(scene.resize).toHaveBeenCalledTimes(2)
        globeLeft = 12
        tick(2200)
        expect(scene.resize).toHaveBeenCalledTimes(3)
        complete()
        await Promise.resolve()
        tick(2300)
        expect(scene.resize).toHaveBeenCalledTimes(3)
        vi.stubGlobal('innerWidth', 1200)
        tick(2400)
        tick(2500)
        expect(scene.resize).toHaveBeenCalledTimes(5)
        expect(hero.dataset).not.toHaveProperty('spatialStill')
        vi.stubGlobal('innerWidth', width)
        tick(2600)
        tick(2700)
        expect(scene.resize).toHaveBeenCalledTimes(6)
        expect(hero.dataset).toHaveProperty('spatialStill', 'true')
      }
      const position = Number(measured.at(-1)?.split(' ')[1]?.replace(/px|vh/, ''))
      if (still) expect(position).toBe(0)
      else {
        expect(position).toBeGreaterThan(range === 'hero' ? 0 : -50)
        expect(position).toBeLessThan(range === 'hero' ? 2 : -40)
      }
      if (range === 'cta' && stars) {
        const lease: Awaited<ReturnType<GlobeRuntime['acquire']>> = await vi.mocked(runtime.acquire)
          .mock.results[0]!.value
        const draw = vi.mocked(lease.draw)
        const sky =
          draw.mock.results[draw.mock.calls.findIndex(([kind]) => kind === 'quietStars')]!.value
        const readSky = () =>
          vi.mocked(sky.set).mock.calls.at(-1)![0] as {
            p: { camera: number[]; viewport: number[] }
          }
        const departedY = readSky().p.camera[1]!
        if (search.includes('spatial-still')) {
          expect(departedY).toBeCloseTo(0)
        } else {
          expect(departedY).toBeGreaterThan(0)
          expect(readSky().p.viewport[2]).toBe(0)
          top = 422
          tick(3800)
          const enteringY = readSky().p.camera[1]!
          expect(enteringY).toBeGreaterThan(0)
          expect(enteringY).toBeLessThan(departedY)
          top = 700
          tick(4800)
          expect(readSky().p.camera[1]).toBeLessThan(enteringY)
        }
      }
      controller.abort()
      expect(hero.dataset).not.toHaveProperty('footerTest')
      expect(values.has('animation')).toBe(false)
      expect(values.has('translate')).toBe(false)
      if (range === 'cta' && !cached) {
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
  vi.stubGlobal('location', { search: '' })
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
    vi.unstubAllGlobals()
  }
})
