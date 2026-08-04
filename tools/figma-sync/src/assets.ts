/**
 * The asset stage of a sync run (#81): when a committed seed asset's **source
 * node** moves, reproduce the asset from Figma and overwrite it in place — or,
 * if the asset is locked, refuse and say so.
 *
 * ## Keyed off the node, never off the bytes
 *
 * Figma renders PNGs non-deterministically. Comparing a fresh export against
 * the committed file would churn every photographic asset on every run and the
 * git diff — which is the whole review surface here — would stop meaning
 * anything. So an asset is "changed" when the **normalized hash of its source
 * node's subtree** differs from the baseline's, exactly the same hash the
 * tracked page frames use (`normalize.ts` → `hash.ts`). No export call is made
 * for an asset whose node did not move.
 *
 * ## The decision is pure; only the executor touches anything
 *
 * `decideAssetAction` is `(entry × previous hash × current hash) → action`, and
 * it is the whole matrix:
 *
 * | Entry             | Node hash          | Action                                   |
 * | ----------------- | ------------------ | ---------------------------------------- |
 * | `unresolved`      | —                  | `skip` — no node to watch                |
 * | resolved          | not in the file    | `fail` — the manifest names a dead node  |
 * | resolved          | same as baseline   | `nothing`                                |
 * | resolved, locked  | changed or new     | `conflict` — the file is never touched   |
 * | resolved, unlocked| changed or new     | `export` — overwrite in place            |
 *
 * `applyAssetDecisions` is the only half that calls Figma or writes a file, and
 * it takes both as ports, so the tests run the real client over an injected
 * `fetch` and assert on how many calls it made.
 *
 * ## What a locked conflict does to the baseline
 *
 * It **records the new hash anyway** — the short-circuit needs the baseline to
 * cover every asset node, and holding the hash back would mean this package
 * never took its cheap path again. But the hash advancing must not make the
 * conflict disappear: an unreconciled conflict is *visible, not silent* (#81),
 * so the baseline also carries an `OpenAssetConflict` record and every later
 * run re-reports it as `stillOpen`.
 *
 * **One thing closes a conflict: the manifest entry changes.** `nodeId`
 * remapped, `locked` lifted, the entry deleted, or the `note` rewritten — that
 * last one is how a human says "I reconciled this by hand", and
 * `asset-manifest.test.ts` already requires every locked entry to carry a note.
 * `fingerprintAssetEntry` is the digest of exactly those fields. A source node
 * that moves *again* does not close a conflict either: it supersedes it with a
 * newer one, dated to the run that saw the newer move.
 *
 * A failure is the opposite case throughout: its hash is *not* recorded, so the
 * next run retries.
 */

import { createHash } from 'node:crypto'

import { lockedAssets, resolvedAssets } from './asset-manifest'

import type { FigmaClient } from './figma-api'
import type {
  AssetChangeReason,
  AssetEntry,
  AssetFailure,
  AssetManifest,
  LockedAssetConflict,
  OpenAssetConflict,
  RegeneratedAsset,
} from './types'

/** What a run does about one manifest entry. See the table above. */
export type AssetAction = 'skip' | 'nothing' | 'export' | 'conflict' | 'fail'

export interface AssetDecision {
  readonly entry: AssetEntry
  readonly action: AssetAction
  /** Why, for `export` and `conflict`. */
  readonly reason?: AssetChangeReason
  /** Why not, for `fail`. */
  readonly error?: string
}

/** The nodes a run has to hash on the assets' behalf — resolved entries, deduped. */
export function assetSourceNodeIds(manifest: AssetManifest): string[] {
  const ids = resolvedAssets(manifest)
    .map((entry) => entry.nodeId)
    .filter((nodeId): nodeId is string => nodeId !== undefined)
  return [...new Set(ids)]
}

/**
 * The digest an open conflict compares itself against — the entry's
 * **reconcilable** fields and nothing else. Change any of them and the conflict
 * clears; a `figmaName` correction or a `scale` fix is not a reconciliation and
 * deliberately does not count.
 */
export function fingerprintAssetEntry(entry: AssetEntry): string {
  return createHash('sha256')
    .update(JSON.stringify([entry.nodeId ?? null, entry.locked, entry.note ?? null]))
    .digest('hex')
}

/** Open conflicts split by whether this run still has to report them. */
export interface CarriedConflicts {
  readonly stillOpen: OpenAssetConflict[]
  readonly cleared: OpenAssetConflict[]
}

/**
 * The baseline's open conflicts against what the manifest and the file say now.
 * Pure — the reconciliation mechanic in one place, and the whole of it.
 */
export function carryOpenConflicts(
  manifest: AssetManifest,
  previous: readonly OpenAssetConflict[],
  currentHashes: Readonly<Record<string, string>>,
): CarriedConflicts {
  const locked = new Map(lockedAssets(manifest).map((entry) => [entry.path, entry]))
  const stillOpen: OpenAssetConflict[] = []
  const cleared: OpenAssetConflict[] = []

  for (const conflict of previous) {
    const entry = locked.get(conflict.path)
    const open =
      entry !== undefined &&
      entry.nodeId === conflict.nodeId &&
      fingerprintAssetEntry(entry) === conflict.entryFingerprint &&
      // Gone from the file → a `fail`, not a stale conflict. Moved again → a
      // fresh conflict this run, which supersedes this one.
      currentHashes[conflict.nodeId] === conflict.conflictHash
    if (open) stillOpen.push(conflict)
    else cleared.push(conflict)
  }

  return { stillOpen, cleared }
}

export function decideAssetAction(
  entry: AssetEntry,
  previousHash: string | undefined,
  currentHash: string | undefined,
): AssetDecision {
  // Nothing to watch and nothing to export from: the hand-authored SVGs and
  // the prototype leftovers sit this stage out entirely.
  if (entry.unresolved || !entry.nodeId) return { entry, action: 'skip' }

  if (currentHash === undefined) {
    // Locked or not: an entry naming a node the file does not have is a broken
    // manifest, and a silent skip is how it stays broken.
    return {
      entry,
      action: 'fail',
      error: `source node ${entry.nodeId} (${entry.figmaName ?? 'unnamed'}) not found in the file`,
    }
  }

  if (previousHash === currentHash) return { entry, action: 'nothing' }

  const reason: AssetChangeReason = previousHash === undefined ? 'new-to-baseline' : 'node-changed'
  return entry.locked ? { entry, action: 'conflict', reason } : { entry, action: 'export', reason }
}

/** Every entry decided, in manifest order. */
export function planAssetSync(
  manifest: AssetManifest,
  previousHashes: Readonly<Record<string, string>>,
  currentHashes: Readonly<Record<string, string>>,
): AssetDecision[] {
  return manifest.assets.map((entry) =>
    decideAssetAction(
      entry,
      entry.nodeId ? previousHashes[entry.nodeId] : undefined,
      entry.nodeId ? currentHashes[entry.nodeId] : undefined,
    ),
  )
}

/**
 * The first image fill in a node's subtree, depth-first, the node itself first.
 *
 * An `imageFill` asset is the fill's uploaded original, and the only route from
 * a node to it is the `imageRef` on one of its `fills` — so the export needs
 * the node document, not just its id. Every resolved `imageFill` entry in the
 * committed manifest was verified in #80 by hashing the file's bytes against
 * that `imageRef`, and the descent exists because a couple of them name the
 * card frame rather than the rectangle inside it that carries the paint.
 * First-match is deliberate: a node with two image fills is a manifest entry
 * pointing at the wrong layer, and the failure it produces says so.
 */
export function findImageRef(document: unknown): string | null {
  if (document === null || typeof document !== 'object') return null
  const node = document as { fills?: unknown; children?: unknown }

  if (Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      const candidate = fill as { type?: unknown; imageRef?: unknown } | null
      if (candidate?.type === 'IMAGE' && typeof candidate.imageRef === 'string') {
        return candidate.imageRef
      }
    }
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findImageRef(child)
      if (found !== null) return found
    }
  }
  return null
}

/** Everything the executor is allowed to reach — all of it injectable. */
export interface AssetSyncPorts {
  readonly fileKey: string
  readonly client: Pick<FigmaClient, 'getRenderUrls' | 'getImageFillUrls' | 'downloadBinary'>
  /** The node documents this run already fetched to hash — `imageFill` reads their fills. */
  readonly documents: ReadonlyMap<string, unknown>
  /** Overwrite a committed asset. Repo-relative path, exactly as the manifest spells it. */
  readonly writeAsset: (path: string, bytes: Uint8Array) => void
}

export interface AssetSyncOutcome {
  readonly regenerated: RegeneratedAsset[]
  readonly lockedConflicts: LockedAssetConflict[]
  readonly failures: AssetFailure[]
  /** nodeId → hash the baseline should carry forward. A failure's is missing. */
  readonly hashes: Record<string, string>
  /** What the **next** baseline should carry: this run's conflicts plus the unreconciled ones. */
  readonly openConflicts: OpenAssetConflict[]
}

/** The run's own facts — what the executor needs but cannot look up. */
export interface AssetSyncContext {
  /** The run's timestamp; a conflict opened now is dated with it. */
  readonly ranAt: string
  /** Conflicts the baseline is still carrying, already reconciled (`carryOpenConflicts`). */
  readonly stillOpen?: readonly OpenAssetConflict[]
}

/** A download URL for one export, or the reason there is not one. */
type Source = { readonly url: string } | { readonly error: string }

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const isExport = (decision: AssetDecision): boolean => decision.action === 'export'

/**
 * URLs for everything this run intends to write, resolved up front so the
 * `/images` calls can be batched by format and scale and the image library
 * fetched once. A call that fails takes down only the assets that needed it.
 */
async function resolveSources(
  exports: readonly AssetDecision[],
  ports: AssetSyncPorts,
): Promise<Map<string, Source>> {
  const sources = new Map<string, Source>()
  if (exports.length === 0) return sources

  const renders = exports.filter((decision) => decision.entry.export === 'render')
  const groups = new Map<string, AssetDecision[]>()
  for (const decision of renders) {
    const key = `${decision.entry.format}@${decision.entry.scale ?? 1}`
    groups.set(key, [...(groups.get(key) ?? []), decision])
  }

  for (const group of groups.values()) {
    const first = group[0]?.entry
    if (!first) continue
    const ids = group.map((decision) => decision.entry.nodeId as string)
    try {
      const urls = await ports.client.getRenderUrls(ports.fileKey, ids, {
        format: first.format,
        scale: first.scale ?? 1,
      })
      for (const decision of group) {
        const url = urls.get(decision.entry.nodeId as string) ?? null
        sources.set(
          decision.entry.path,
          // Figma answers `null` for an id it cannot export rather than
          // failing the call — a deleted node, or one with nothing to draw.
          url === null
            ? { error: `Figma returned no image URL for ${decision.entry.nodeId}` }
            : { url },
        )
      }
    } catch (error) {
      for (const decision of group) sources.set(decision.entry.path, { error: messageOf(error) })
    }
  }

  const fills = exports.filter((decision) => decision.entry.export === 'imageFill')
  if (fills.length === 0) return sources

  let library: Map<string, string>
  try {
    library = await ports.client.getImageFillUrls(ports.fileKey)
  } catch (error) {
    for (const decision of fills) sources.set(decision.entry.path, { error: messageOf(error) })
    return sources
  }

  for (const decision of fills) {
    const nodeId = decision.entry.nodeId as string
    const imageRef = findImageRef(ports.documents.get(nodeId))
    if (imageRef === null) {
      sources.set(decision.entry.path, { error: `node ${nodeId} carries no image fill any more` })
      continue
    }
    const url = library.get(imageRef)
    sources.set(
      decision.entry.path,
      url === undefined
        ? { error: `imageRef ${imageRef} is not in the file's image library` }
        : { url },
    )
  }

  return sources
}

/**
 * Carry out a plan. Writes only unlocked, changed assets; records a hash only
 * for the entries this run is willing to call settled.
 */
export async function applyAssetDecisions(
  decisions: readonly AssetDecision[],
  currentHashes: Readonly<Record<string, string>>,
  ports: AssetSyncPorts,
  context: AssetSyncContext,
): Promise<AssetSyncOutcome> {
  const outcome: AssetSyncOutcome = {
    regenerated: [],
    lockedConflicts: [],
    failures: [],
    hashes: {},
    openConflicts: [],
  }
  const settle = (entry: AssetEntry) => {
    const hash = entry.nodeId ? currentHashes[entry.nodeId] : undefined
    if (entry.nodeId && hash) outcome.hashes[entry.nodeId] = hash
  }

  const sources = await resolveSources(decisions.filter(isExport), ports)

  for (const { entry, action, reason, error } of decisions) {
    if (action === 'skip') continue

    if (action === 'fail') {
      outcome.failures.push({
        path: entry.path,
        nodeId: entry.nodeId ?? null,
        error: error ?? 'unknown failure',
      })
      continue
    }

    if (action === 'nothing') {
      settle(entry)
      continue
    }

    if (action === 'conflict') {
      const nodeId = entry.nodeId as string
      const note = entry.note ?? 'locked, with no note — the manifest should not have allowed that'
      outcome.lockedConflicts.push({
        path: entry.path,
        nodeId,
        reason: reason as AssetChangeReason,
        note,
        state: 'firstSeen',
        firstSeenAt: context.ranAt,
      })
      // The hash advances (see the header), so this record is the only thing
      // that will still know about the conflict on the next run.
      outcome.openConflicts.push({
        path: entry.path,
        nodeId,
        conflictHash: currentHashes[nodeId] as string,
        entryFingerprint: fingerprintAssetEntry(entry),
        firstSeenAt: context.ranAt,
        reason: reason as AssetChangeReason,
        note,
      })
      settle(entry)
      continue
    }

    const source = sources.get(entry.path) ?? { error: 'no export was attempted' }
    if ('error' in source) {
      outcome.failures.push({ path: entry.path, nodeId: entry.nodeId ?? null, error: source.error })
      continue
    }

    try {
      // Download first, write second: a failed download must not leave a
      // truncated asset behind for the git diff to review.
      const bytes = await ports.client.downloadBinary(source.url)
      ports.writeAsset(entry.path, bytes)
    } catch (failure) {
      outcome.failures.push({
        path: entry.path,
        nodeId: entry.nodeId ?? null,
        error: messageOf(failure),
      })
      continue
    }

    outcome.regenerated.push({
      path: entry.path,
      nodeId: entry.nodeId as string,
      export: entry.export ?? 'render',
      reason: reason as AssetChangeReason,
    })
    settle(entry)
  }

  // Everything still unreconciled, reported again. A path this run opened a
  // fresh conflict on is already spoken for: the new one supersedes the old.
  const opened = new Set(outcome.openConflicts.map((conflict) => conflict.path))
  for (const conflict of context.stillOpen ?? []) {
    if (opened.has(conflict.path)) continue
    outcome.openConflicts.push(conflict)
    outcome.lockedConflicts.push({
      path: conflict.path,
      nodeId: conflict.nodeId,
      reason: conflict.reason,
      note: conflict.note,
      state: 'stillOpen',
      firstSeenAt: conflict.firstSeenAt,
    })
  }

  return outcome
}
