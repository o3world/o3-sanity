import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createGlobeRuntime } from './globe-runtime'

const mocks = vi.hoisted(() => ({ init: vi.fn(), draw: vi.fn() }))
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
