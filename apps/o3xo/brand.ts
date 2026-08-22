import type { Brand } from '@o3/sanity/brand'

/**
 * Which brand this app runs as — the one literal, read by everything that has
 * to say it out loud: `next.config.ts` (which puts it in the bundles as
 * `NEXT_PUBLIC_BRAND`) and `sanity.cli.ts` (which has no bundler to do that).
 *
 * Typed as `Brand` so a typo is a compile error rather than a thrown
 * `currentBrand()` at boot, and `o3xo` because ADR 0028 forbids the bare `xo`.
 */
export const BRAND: Brand = 'o3xo'
