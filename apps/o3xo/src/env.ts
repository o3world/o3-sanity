/**
 * Env validation entry point. Importing this module (root layout does)
 * evaluates the t3-env/Zod schemas in `@o3/env` — misconfigured or
 * empty-string env vars fail fast at build/boot instead of surfacing as
 * mysterious runtime 500s.
 *
 * It carries one assertion of its own, because this app has a failure mode the
 * schemas cannot see: `NEXT_PUBLIC_BRAND` unset resolves to `o3`, which is a
 * valid brand with a real project behind it (ADR 0028). The app would boot,
 * render, and serve o3world.com's content wearing O3XO's tokens. So the brand
 * is asserted rather than assumed — `next.config.ts` is what sets it.
 */
import { currentBrand } from '@o3/sanity/brand'

import { BRAND } from '../brand'

const resolved = currentBrand()
if (resolved !== BRAND) {
  throw new Error(
    `apps/o3xo resolved brand "${resolved}", not "${BRAND}". ` +
      `NEXT_PUBLIC_BRAND is not reaching this bundle — check the \`env\` block in next.config.ts.`,
  )
}

export { clientEnv } from '@o3/env/client'
export { serverEnv } from '@o3/env/server'
