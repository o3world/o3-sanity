import type { Baseline } from './types'

export interface HashDiff {
  /** Tracked now, never hashed before — a first run, or a manifest addition. */
  readonly added: string[]
  /** Hashed before, hashes differently now — the change we are looking for. */
  readonly modified: string[]
  /** In the baseline, not tracked (or not found) now. */
  readonly removed: string[]
}

/** Per-node hash comparison. Order follows the current map, then the baseline. */
export function diffHashes(
  baseline: Readonly<Record<string, string>>,
  current: Readonly<Record<string, string>>,
): HashDiff {
  const added: string[] = []
  const modified: string[] = []
  for (const [nodeId, hash] of Object.entries(current)) {
    const before = baseline[nodeId]
    if (before === undefined) added.push(nodeId)
    else if (before !== hash) modified.push(nodeId)
  }
  const removed = Object.keys(baseline).filter((nodeId) => current[nodeId] === undefined)
  return { added, modified, removed }
}

/**
 * Can this run stop after the single version-check call?
 *
 * Only when the file has not moved **and** the baseline already covers exactly
 * the nodes the manifest tracks — adding a frame to the manifest has to make
 * the next run fetch it, even though the Figma file itself is untouched.
 */
export function isBaselineFresh(
  baseline: Baseline | null,
  meta: { version: string; lastModified: string },
  trackedNodeIds: readonly string[],
): boolean {
  if (!baseline) return false
  if (baseline.version !== meta.version) return false
  if (baseline.lastModified !== meta.lastModified) return false
  const hashed = new Set(Object.keys(baseline.hashes))
  if (hashed.size !== trackedNodeIds.length) return false
  return trackedNodeIds.every((nodeId) => hashed.has(nodeId))
}
