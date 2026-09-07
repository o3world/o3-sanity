import { expect, it } from 'vitest'
import { resolveColor } from './resolve-color'

it.each(['#ff1000', '#e9edf5', '#ABCDEF', '#000000'])(
  'resolves the opaque hex color %s without DOM or canvas work',
  (color) => {
    expect(resolveColor(color, {} as HTMLElement)).toBe(color)
  },
)
