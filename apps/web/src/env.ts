/**
 * Env validation entry point. Importing this module (root layout does)
 * evaluates the t3-env/Zod schemas in `@o3/env` — misconfigured or
 * empty-string env vars fail fast at build/boot instead of surfacing as
 * mysterious runtime 500s.
 */
export { clientEnv } from '@o3/env/client'
export { serverEnv } from '@o3/env/server'
