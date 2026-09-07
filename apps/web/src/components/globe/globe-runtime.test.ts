import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createGlobeRuntime } from './globe-runtime'

const mocks = vi.hoisted(() => ({ init: vi.fn(), draw: vi.fn(), geometry: vi.fn() }))
vi.mock('vgpu', () => mocks)

function device() {
  let lose!: (info: { message: string }) => void
  const lost = new Promise<{ message: string }>((resolve) => {
    lose = resolve
  })
  return { gpu: { lost }, lose, dispose: vi.fn(), onError: vi.fn(() => vi.fn()) }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.draw.mockImplementation(() => ({ compile: vi.fn(async () => {}) }))
  mocks.geometry.mockImplementation(() => ({ destroy: vi.fn() }))
  vi.stubGlobal('navigator', { gpu: { getPreferredCanvasFormat: () => 'bgra8unorm' } })
})
afterEach(() => vi.unstubAllGlobals())

it('warms once, shares one device between concurrent globes, and recycles draws across navigation', async () => {
  const gpu = device()
  mocks.init.mockResolvedValue(gpu)
  const runtime = createGlobeRuntime()
  const [, first, second] = await Promise.all([
    runtime.warm(),
    runtime.acquire(),
    runtime.acquire(),
  ])
  expect(mocks.init).toHaveBeenCalledOnce()
  const a = first.draw('orbit')
  const b = second.draw('orbit')
  expect(a).not.toBe(b)
  expect(first.gpu).toBe(second.gpu)
  first.release()
  first.release()
  expect(gpu.dispose).not.toHaveBeenCalled()
  const third = await runtime.acquire()
  expect(third.draw('orbit')).toBe(a)
  expect(third.draw('orbit')).not.toBe(a)
  second.release()
  third.release()
  runtime.dispose()
  expect(gpu.dispose).toHaveBeenCalledOnce()
})

it('shares the solid mesh buffers across concurrent placements and repeat visits', async () => {
  mocks.init.mockResolvedValue(device())
  const runtime = createGlobeRuntime()
  const first = await runtime.acquire()
  first.draw('orbit')
  first.draw('orbit')
  const second = await runtime.acquire()
  second.draw('orbit')
  second.draw('dot')
  first.release()
  const next = await runtime.acquire()
  next.draw('dot')
  expect(mocks.geometry).toHaveBeenCalledTimes(2)
  const meshes = mocks.geometry.mock.results.map(({ value }) => value)
  const orbitDraws = mocks.draw.mock.calls
    .map(([, options]) => options)
    .filter((options) => options.geometry === meshes[0])
  expect(orbitDraws).toHaveLength(3)
  expect(mocks.draw.mock.calls.some(([, options]) => options.geometry === meshes[1])).toBe(true)
  second.release()
  next.release()
  runtime.dispose()
})

it('keeps the quieter sky within one 1100-star draw using the shared star shader', async () => {
  mocks.init.mockResolvedValue(device())
  const runtime = createGlobeRuntime()
  const lease = await runtime.acquire()
  const hero = lease.draw('stars')
  const quiet = lease.draw('quietStars')
  const recipeFor = (item: unknown) =>
    mocks.draw.mock.calls[mocks.draw.mock.results.findIndex(({ value }) => value === item)]![1]
  const heroRecipe = recipeFor(hero)
  expect(recipeFor(quiet)).toMatchObject({
    shader: heroRecipe.shader,
    vertices: 6,
    instances: 1100,
  })
  lease.release()
  runtime.dispose()
})

it('drops a failed warm-up and retries with a new device', async () => {
  const first = device()
  const next = device()
  mocks.init.mockResolvedValueOnce(first).mockResolvedValueOnce(next)
  mocks.draw.mockImplementationOnce(() => ({
    compile: vi.fn(async () => {
      throw new Error('compile failed')
    }),
  }))
  const runtime = createGlobeRuntime()
  await expect(runtime.warm()).rejects.toThrow('compile failed')
  expect(first.dispose).toHaveBeenCalledOnce()
  const lease = await runtime.acquire()
  expect(lease.gpu).toBe(next)
  runtime.dispose()
})

it('disposes late initialization after provider teardown without disrupting the replacement', async () => {
  const old = device()
  const next = device()
  let resolve!: (value: typeof old) => void
  mocks.init
    .mockReturnValueOnce(
      new Promise((done) => {
        resolve = done
      }),
    )
    .mockResolvedValueOnce(next)
  const runtime = createGlobeRuntime()
  const pending = runtime.warm()
  runtime.dispose()
  const lease = await runtime.acquire()
  resolve(old)
  await expect(pending).rejects.toThrow('cancelled')
  expect(old.dispose).toHaveBeenCalledOnce()
  expect(lease.gpu).toBe(next)
  expect(next.dispose).not.toHaveBeenCalled()
  runtime.dispose()
})

it('reports device loss only to live globes and permits a fresh device on the next placement', async () => {
  const old = device()
  const next = device()
  mocks.init.mockResolvedValueOnce(old).mockResolvedValueOnce(next)
  const runtime = createGlobeRuntime()
  const first = await runtime.acquire()
  const second = await runtime.acquire()
  const removed = vi.fn()
  const active = vi.fn()
  first.onError(removed)
  second.onError(active)
  first.release()
  old.lose({ message: 'GPU reset' })
  await Promise.resolve()
  expect(removed).not.toHaveBeenCalled()
  expect(active).toHaveBeenCalledOnce()
  expect(old.dispose).toHaveBeenCalledOnce()
  expect((await runtime.acquire()).gpu).toBe(next)
  second.release()
  runtime.dispose()
})
