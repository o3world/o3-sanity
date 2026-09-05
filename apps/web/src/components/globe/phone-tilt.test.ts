import { afterEach, expect, it, vi } from 'vitest'
import { startPhoneTilt } from './phone-tilt'

afterEach(() => vi.unstubAllGlobals())

function setup(secure = true) {
  const listeners = new Map<string, (event: unknown) => void>()
  const events = {
    addEventListener: (name: string, callback: (event: unknown) => void) =>
      listeners.set(name, callback),
    removeEventListener: (name: string) => listeners.delete(name),
  }
  const permission = vi.fn()
  const screen = { orientation: { angle: 0 } }
  vi.stubGlobal('window', {
    ...events,
    isSecureContext: secure,
    DeviceOrientationEvent: { requestPermission: permission },
  })
  vi.stubGlobal('document', events)
  vi.stubGlobal('screen', screen)
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  const canvas = { dataset: {} } as HTMLCanvasElement
  const steer = vi.fn()
  let active = true
  const stop = startPhoneTilt(canvas, () => active, steer)
  return {
    listeners,
    permission,
    screen,
    steer,
    stop,
    active: (value: boolean) => {
      active = value
    },
    tilt: (beta: number | null, gamma: number | null) =>
      listeners.get('deviceorientation')?.({ beta, gamma }),
  }
}

it('waits without prompting and calibrates the holding angle before steering', () => {
  const input = setup()
  expect(input.permission).not.toHaveBeenCalled()
  expect(input.steer).not.toHaveBeenCalled()
  input.tilt(null, 0)
  expect(input.steer).not.toHaveBeenCalled()
  input.tilt(60, 0)
  expect(input.steer).toHaveBeenLastCalledWith(0, 0)
  input.tilt(60.5, 0.5)
  expect(input.steer).toHaveBeenLastCalledWith(0, 0)
  input.tilt(70, 10)
  const [x, y] = input.steer.mock.lastCall!
  expect(x).toBeCloseTo(0.53472)
  expect(y).toBeCloseTo(0.53472)
  input.stop()
  expect(input.listeners.size).toBe(0)
  expect(input.permission).not.toHaveBeenCalled()
})

it('pauses and recalibrates after inactivity or screen rotation', () => {
  const input = setup()
  input.tilt(60, 0)
  input.active(false)
  input.steer.mockClear()
  input.tilt(80, 10)
  expect(input.steer).not.toHaveBeenCalled()
  input.active(true)
  input.tilt(80, 10)
  expect(input.steer).toHaveBeenCalledWith(0, 0, true)
  input.steer.mockClear()
  input.screen.orientation.angle = 90
  input.tilt(40, 5)
  expect(input.steer).toHaveBeenCalledWith(0, 0, true)
  input.stop()
})

it('does not subscribe or request access outside a secure context', () => {
  const input = setup(false)
  expect(input.listeners.size).toBe(0)
  expect(input.permission).not.toHaveBeenCalled()
  input.stop()
})
