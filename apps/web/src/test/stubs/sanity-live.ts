/**
 * Stands in for `@/sanity/live` in the `render` test layer (aliased in
 * vitest.config.ts). Routes call `sanityFetch` exactly as they do in
 * production; the test decides what comes back.
 *
 * Install a dataset with `installDataset()` — or, far more usually, let
 * `renderRoute()` do it for you.
 */
import type { ReactNode } from 'react'

import { draftMode } from './next-headers'

export interface FetchCall {
  readonly query: string
  readonly params?: Record<string, unknown>
  readonly tags?: string[]
  /**
   * The read mode the route resolved for this request (#266). Under Cache
   * Components every read declares its own perspective and stega flag rather
   * than letting `sanityFetch` resolve them from `draftMode()`, so both are
   * assertable here.
   */
  readonly perspective?: string
  readonly variant?: string
  readonly stega?: boolean
  readonly insight?: string
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

/**
 * The read-mode half of the seam. The real one resolves the perspective from
 * a Presentation cookie; a render test has no cookie jar, so a draft render
 * gets the state a plain Presentation session is in — the drafts perspective,
 * no editing variant, overlays on.
 */
export interface ReadMode {
  readonly perspective: string
  readonly variant?: string
  readonly stega: boolean
}

export const publishedRead: ReadMode = { perspective: 'published', stega: false }

export async function currentReadMode(): Promise<ReadMode> {
  const { isEnabled } = await draftMode()
  return isEnabled ? { perspective: 'drafts', stega: true } : publishedRead
}
