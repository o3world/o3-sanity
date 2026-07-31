/**
 * Stands in for `@/sanity/live` in the `render` test layer (aliased in
 * vitest.config.ts). Routes call `sanityFetch` exactly as they do in
 * production; the test decides what comes back.
 *
 * Install a dataset with `installDataset()` — or, far more usually, let
 * `renderRoute()` do it for you.
 */
import type { ReactNode } from 'react'

export interface FetchCall {
  readonly query: string
  readonly params?: Record<string, unknown>
  readonly tags?: string[]
  readonly stega?: boolean
  readonly perspective?: string
}

/** Returns the document(s) a query resolves to, or `null` for a miss. */
export type DatasetResolver = (call: FetchCall) => unknown

let resolver: DatasetResolver | null = null
const calls: FetchCall[] = []

export function installDataset(next: DatasetResolver): void {
  resolver = next
  calls.length = 0
}

export function resetDataset(): void {
  resolver = null
  calls.length = 0
}

/**
 * Every `sanityFetch` the render recorded, in order — the seam for asserting
 * cache tags and the stega-off rule on metadata without reaching into the
 * route builder's internals.
 */
export function fetchCalls(): readonly FetchCall[] {
  return calls
}

export async function sanityFetch(call: FetchCall): Promise<{ data: unknown }> {
  if (!resolver) {
    throw new Error(
      'sanityFetch was called with no dataset installed. Render tests must go through ' +
        'renderRoute() from @/test, or call installDataset() directly.',
    )
  }
  calls.push(call)
  return { data: resolver(call) }
}

export function SanityLive(): ReactNode {
  return null
}

export const client = {} as never
