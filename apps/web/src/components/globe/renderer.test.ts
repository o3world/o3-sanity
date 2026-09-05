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
