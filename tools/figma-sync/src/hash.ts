import { createHash } from 'node:crypto'

import { normalizeNode } from './normalize'

/**
 * JSON with object keys sorted at every depth. `normalizeNode` already emits
 * sorted objects, but the hash's determinism should not depend on that — this
 * is the thing the digest is taken over, so it does its own sorting.
 *
 * Arrays are never reordered: a Figma node's `children` are its z-order.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, v]) => `${JSON.stringify(key)}:${stableStringify(v)}`)
  return `{${entries.join(',')}}`
}

/** sha256 of the normalized, stably-stringified subtree — the baseline unit. */
export function hashSubtree(node: unknown): string {
  return createHash('sha256')
    .update(stableStringify(normalizeNode(node)))
    .digest('hex')
}
