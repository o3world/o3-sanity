import type { ComponentType } from 'react'

/**
 * One block's render binding. `serverOnly` bindings may only be authored in
 * server modules (registry.ts); client binding lists must never contain one —
 * enforced by `ClientBlockRenderBinding` below. (o3 currently has no
 * server-only blocks — every renderer is client-safe — but the seam is kept
 * so a future fs/fetch-touching block slots in without re-plumbing.)
 */
export interface BlockRenderBinding<
  K extends string = string,
  // Default only — every real binding infers its own concrete C via
  // defineBlockRender; this just widens an unparameterized reference.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  C = ComponentType<any>,
> {
  type: K
  component: C
  serverOnly?: true
}

/**
 * A `BlockRenderBinding` statically guaranteed not to be server-only — the
 * shape every entry in a client binding list must have. Intersecting with
 * `serverOnly?: never` makes assigning a `serverOnly: true` binding a type
 * error at the assignment site.
 */
export type ClientBlockRenderBinding<
  K extends string = string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- default only, see BlockRenderBinding above
  C = ComponentType<any>,
> = BlockRenderBinding<K, C> & {
  serverOnly?: never
}

// Generic over the component type `C` (not just the key `K`) so each binding
// keeps its own concrete component's prop shape instead of widening to
// `ComponentType<any>` — that widening is what would let a wrong-prop
// component on a valid key compile silently.
export function defineBlockRender<K extends string, C>(
  type: K,
  opts: { component: C },
): ClientBlockRenderBinding<K, C>
export function defineBlockRender<K extends string, C>(
  type: K,
  opts: { component: C; serverOnly: true },
): BlockRenderBinding<K, C> & { serverOnly: true }
export function defineBlockRender<K extends string, C>(
  type: K,
  opts: { component: C; serverOnly?: true },
): BlockRenderBinding<K, C> {
  return {
    type,
    component: opts.component,
    ...(opts.serverOnly ? { serverOnly: true as const } : {}),
  }
}

/**
 * Rebuilds a `{ [binding.type]: binding.component }` record from a binding
 * list, keying the result by each binding's own literal `type` (TS mapped-
 * type key remapping over the array's element union) rather than widening to
 * a generic string index. This is what lets the derived map still flow
 * through a `satisfies Record<SomeUnion, …>` clause with real teeth — a
 * binding list missing an entry for some member of the union fails that
 * `satisfies` the same way a hand-written object literal missing a key would.
 *
 * Callers must pass the binding list WITHOUT first widening it to
 * `ReadonlyArray<BlockRenderBinding<SomeUnion>>` — bind the completeness
 * check via `satisfies` on the array itself instead, so its inferred type
 * keeps each element's distinct literal type.
 */
export function bindingsToRecord<T extends readonly BlockRenderBinding<string>[]>(
  bindings: T,
): { [B in T[number] as B['type']]: B['component'] } {
  return Object.fromEntries(bindings.map((b) => [b.type, b.component])) as {
    [B in T[number] as B['type']]: B['component']
  }
}
