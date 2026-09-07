import { draw, geometry, init, type Gpu, type DrawOptions } from 'vgpu'
import {
  dotShader,
  globeCompositeShader,
  heatHazeShader,
  orbitShader,
  shootingStarShader,
  starsShader,
} from './shaders'

const recipes = {
  orbit: { shader: orbitShader },
  dot: { shader: dotShader },
  composite: { shader: globeCompositeShader, vertices: 3, depth: false },
  cachedComposite: {
    shader: globeCompositeShader,
    vertices: 3,
    depth: false,
    blend: 'premultiplied',
  },
  heatHaze: {
    shader: heatHazeShader,
    vertices: 288 * 6,
    blend: 'alpha',
    depth: false,
  },
  stars: {
    shader: starsShader,
    vertices: 6,
    instances: 4180,
    blend: 'alpha',
    depth: false,
  },
  quietStars: {
    shader: starsShader,
    vertices: 6,
    instances: 1100,
    blend: 'alpha',
    depth: false,
  },
  shootingStar: {
    shader: shootingStarShader,
    vertices: 6,
    blend: 'alpha',
    depth: false,
  },
} satisfies Record<string, DrawOptions>

type Kind = keyof typeof recipes
type Drawing = ReturnType<typeof draw>
type State = {
  gpu: Gpu
  recipes: Record<Kind, DrawOptions>
  pool: Map<Kind, Drawing[]>
  errors: Set<(error: unknown) => void>
  stopErrors: () => void
}

/** Keep every original triangle, sharing its corner vertices within each solid mesh. */
function solidGrid(gpu: Gpu, columns: number, rows: number) {
  const indices = new Uint16Array(columns * rows * 6)
  let cursor = 0
  for (let column = 0; column < columns; column++) {
    for (let row = 0; row < rows; row++) {
      const a = column * (rows + 1) + row
      const b = a + rows + 1
      indices.set([a, b, a + 1, a + 1, b, b + 1], cursor)
      cursor += 6
    }
  }
  return geometry(gpu, { buffers: [], indices })
}

/** One device and pipeline cache per mounted site provider; draws recycle between placements. */
export function createGlobeRuntime() {
  let pending: Promise<State> | undefined
  let current: State | undefined
  let generation = 0

  function dispose() {
    generation++
    pending = undefined
    current?.stopErrors()
    current?.errors.clear()
    current?.gpu.dispose()
    current = undefined
  }

  function load(): Promise<State> {
    if (pending) return pending
    const version = generation
    const task = (async () => {
      const gpu = await init({ powerPreference: 'low-power' })
      if (version !== generation) {
        gpu.dispose()
        throw new Error('Globe startup cancelled')
      }
      const state: State = {
        gpu,
        recipes: { ...recipes },
        pool: new Map(),
        errors: new Set(),
        stopErrors: () => {},
      }
      current = state
      state.stopErrors = gpu.onError((error) => {
        for (const listener of [...state.errors]) listener(error)
      })
      void gpu.gpu.lost.then((info) => {
        if (current !== state) return
        for (const listener of [...state.errors]) listener(new Error(info.message || 'Device lost'))
        dispose()
      })
      try {
        state.recipes.orbit = { ...recipes.orbit, geometry: solidGrid(gpu, 576, 12) }
        state.recipes.dot = { ...recipes.dot, geometry: solidGrid(gpu, 32, 16) }
        const signature = {
          colors: [navigator.gpu.getPreferredCanvasFormat()],
          sampleCount: 1 as const,
        }
        await Promise.all(
          (Object.keys(recipes) as Kind[]).map(async (kind) => {
            const item = draw(gpu, state.recipes[kind])
            state.pool.set(kind, [item])
            await item.compile(
              kind === 'composite' || kind === 'cachedComposite'
                ? signature
                : { ...signature, sampleCount: 4, depth: 'depth24plus' },
            )
          }),
        )
        if (version !== generation) throw new Error('Globe startup cancelled')
        return state
      } catch (error) {
        if (current === state) dispose()
        throw error
      }
    })()
    pending = task
    void task.catch(() => {
      if (pending === task) pending = undefined
    })
    return task
  }

  return {
    warm: async () => {
      await load()
    },
    dispose,
    async acquire() {
      const state = await load()
      const borrowed: [Kind, Drawing][] = []
      const listeners = new Set<(error: unknown) => void>()
      let released = false
      return {
        gpu: state.gpu,
        draw(kind: Kind) {
          const item = state.pool.get(kind)?.pop() ?? draw(state.gpu, state.recipes[kind])
          borrowed.push([kind, item])
          return item
        },
        onError(listener: (error: unknown) => void) {
          state.errors.add(listener)
          listeners.add(listener)
        },
        release() {
          if (released) return
          released = true
          for (const listener of listeners) state.errors.delete(listener)
          if (current !== state) return
          for (const [kind, item] of borrowed) state.pool.get(kind)!.push(item)
        },
      }
    },
  }
}

export type GlobeRuntime = ReturnType<typeof createGlobeRuntime>
