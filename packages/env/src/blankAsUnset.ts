import { z } from 'zod'

/**
 * Treats an empty-string env var the same as "unset". Vercel's `.env.*.local`
 * files materialize an env-key-without-value as `KEY=`, which lands in the
 * process as `process.env.KEY === ''` — defined enough to defeat `.optional()`
 * but blank enough to fail validation.
 */
export function blankAsUnset<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((v) => (v === '' ? undefined : v), schema)
}
