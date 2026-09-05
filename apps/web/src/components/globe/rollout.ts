/** Preview builds opt in; production always retains the existing SVG treatment. */
export function spatialGlobeEnabled(env: {
  NODE_ENV?: string
  VERCEL_ENV?: string
  O3_SPATIAL_GLOBE?: string
}): boolean {
  return (
    env.VERCEL_ENV !== 'production' &&
    (env.NODE_ENV === 'development' || env.O3_SPATIAL_GLOBE === '1')
  )
}
