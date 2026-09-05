import { expect, it } from 'vitest'
import { spatialGlobeEnabled } from './rollout'

it.each([
  [{ NODE_ENV: 'development' }, true],
  [{ NODE_ENV: 'production', VERCEL_ENV: 'preview', O3_SPATIAL_GLOBE: '1' }, true],
  [{ NODE_ENV: 'production', VERCEL_ENV: 'preview' }, false],
  [{ NODE_ENV: 'production', VERCEL_ENV: 'production', O3_SPATIAL_GLOBE: '1' }, false],
  [{ NODE_ENV: 'production' }, false],
])('gates the spatial globe for %j', (env, expected) => {
  expect(spatialGlobeEnabled(env)).toBe(expected)
})
