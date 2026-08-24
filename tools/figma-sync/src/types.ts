/**
 * The shapes the three committed data files agree on (#78).
 *
 * `tracked-nodes.json` is hand-maintained, `baseline.json` and `report.json`
 * are machine-written. The report schema is **fixed** by #78: later tickets
 * fill sections (component sets, untracked frames, assets), they never
 * reshape them — bump `schemaVersion` if that ever stops being true.
 */

export type TrackedKind = 'pageFrame' | 'componentSet'
export type TrackedVariant = 'desktop' | 'mobile'

export interface TrackedNode {
  /** Verified *frame* id, `:`-separated — not the child a share URL links to. */
  readonly nodeId: string
  readonly kind: TrackedKind
  /** The page layer this frame is, in this project's language (CONTEXT.md). */
  readonly name: string
  /** What Figma calls it, when that differs — two frames are named "Insights". */
  readonly figmaName?: string
  /** Route the frame designs, for `kind: "pageFrame"`. */
  readonly route?: string
  /**
   * `path#Symbol` of the code a `kind: "componentSet"` routes to, or **`null`
   * spelled out** for a set `docs/figma-components.md` says maps to nothing —
   * absent would be indistinguishable from unaudited (#79).
   */
  readonly codeComponent?: string | null
  /** Why a set maps to nothing, in that document's words. */
  readonly note?: string
  /** The breakpoint a page frame designs. A component set is neither. */
  readonly variant?: TrackedVariant
}

/** A node the probe has already been told about and must stay quiet on (#79). */
export interface IgnoredNode {
  readonly nodeId: string
  readonly name?: string
  /** Why it is not canonical. A standing decision, so it carries its reason. */
  readonly note: string
}

export interface TrackedManifest {
  readonly fileKey: string
  /**
   * The nodes the untracked-node probe lists the direct children of (#79) —
   * O3's Design Concept section, or the O3XO kit's watched canvases (#242).
   */
  readonly sectionNodeIds: readonly string[]
  /**
   * Child node types the probe reports. A site file's sections hold page
   * frames; a UI kit's canvases hold library nodes and the frames beside them
   * are spec sheets. Defaults to `["FRAME"]`.
   */
  readonly probeNodeTypes?: readonly string[]
  readonly entries: readonly TrackedNode[]
  /** Section residents that are neither canonical nor news. See `probe.ts`. */
  readonly ignoredNodeIds?: readonly IgnoredNode[]
}

export type AssetFormat = 'svg' | 'png'
/**
 * How a resolved asset came out of Figma, because #81 has to reproduce it:
 * `render` is `/v1/images` at `scale`, `imageFill` is the node's fill original
 * downloaded whole (Figma keys a fill by the SHA-1 of its bytes, so `scale`
 * means nothing there and is always `1`).
 */
export type AssetExport = 'render' | 'imageFill'

/** One committed seed asset and where in Figma it came from (#80). */
export interface AssetEntry {
  /** Repo-relative, under `tools/migration/data/seed/assets/`. */
  readonly path: string
  /** The node it was exported from, `:`-separated. Absent when `unresolved`. */
  readonly nodeId?: string
  /** What Figma calls that layer. Absent when `unresolved`. */
  readonly figmaName?: string
  readonly format: AssetFormat
  /** The `/v1/images` scale a `render` was taken at. `png` + resolved only. */
  readonly scale?: number
  readonly export?: AssetExport
  /**
   * A re-export must never overwrite this file — it was hand-edited after
   * export (the animated SVGs, the two cropped Live cards) or its source node
   * no longer produces it. Every locked entry says which, in `note`.
   */
  readonly locked: boolean
  /** **No source node could be found.** Never a guess — always with a `note`. */
  readonly unresolved?: true
  /** The evidence, and how confident it is. Required when locked/unresolved. */
  readonly note?: string
}

/** Provenance for every file in the seed assets directory (#80). */
export interface AssetManifest {
  readonly fileKey: string
  readonly assets: readonly AssetEntry[]
}

export interface Baseline {
  readonly fileKey: string
  /** Figma's file `version` — the short-circuit key. */
  readonly version: string
  readonly lastModified: string
  readonly syncedAt: string
  /** nodeId → sha256 of its normalized subtree. */
  readonly hashes: Readonly<Record<string, string>>
  /**
   * nodeId → what kind of thing it was when it was last hashed.
   *
   * Only removal needs this, and only removal can need it: a node that is
   * *gone* is a node the manifest may no longer describe, and without a memory
   * of its kind a deleted component set files itself under `changedFrames` and
   * reads as a page that vanished. Absent on a baseline written before this.
   */
  readonly kinds?: Readonly<Record<string, TrackedKind>>
  /**
   * The same hash, for the nodes committed **assets** were exported from
   * (#81) — a separate map because these are not tracked nodes: they are
   * never diffed into `changedFrames`, and the short-circuit counts the two
   * lists separately. Absent on a baseline written before #81.
   */
  readonly assetHashes?: Readonly<Record<string, string>>
  /**
   * Locked-asset conflicts nobody has reconciled yet (#81). The hash of a
   * conflicted node still advances — the short-circuit needs the baseline to
   * cover every asset node — so *this* is what makes a conflict outlive the
   * run that found it. See `carryOpenConflicts` for the one thing that
   * closes one.
   */
  readonly openAssetConflicts?: readonly OpenAssetConflict[]
}

/**
 * A locked-asset conflict as the **baseline** carries it between runs (#81) —
 * the durable half of `LockedAssetConflict`, which is what a report says.
 *
 * It clears when the manifest entry it names changes: a different `nodeId`,
 * `locked` lifted, the entry deleted, or the `note` rewritten (which is how a
 * human says "I reconciled this"). A source node that moves *again* does not
 * clear it either — it supersedes it with a newer conflict.
 */
export interface OpenAssetConflict {
  readonly path: string
  readonly nodeId: string
  /** The source-node hash that opened it. A later run seeing another supersedes it. */
  readonly conflictHash: string
  /** Digest of the entry's reconcilable fields — see `fingerprintAssetEntry`. */
  readonly entryFingerprint: string
  /** `ranAt` of the run that first reported it. Carried, never refreshed. */
  readonly firstSeenAt: string
  readonly reason: AssetChangeReason
  /** The manifest's own words for the lock, as of the run that opened this. */
  readonly note: string
}

export type ChangeKind = 'added' | 'modified' | 'removed'

export interface ChangedEntry {
  readonly nodeId: string
  readonly name: string
  readonly route: string | null
  readonly variant: TrackedVariant | null
  /** Component sets only: the code the change routes to, `null` if none (#79). */
  readonly codeComponent?: string | null
  readonly change: ChangeKind
}

/** A frame in the Design Concept section the manifest has never heard of (#79). */
export interface UntrackedFrame {
  readonly nodeId: string
  readonly name: string
  /** 1440 or 402 says "page frame"; anything else usually says "study". */
  readonly width: number | null
}

/**
 * Why an asset's stage acted (#81). `node-changed` is the case the ticket is
 * about; `new-to-baseline` is a source node this baseline has never hashed —
 * a first run, or a manifest entry that just resolved.
 */
export type AssetChangeReason = 'node-changed' | 'new-to-baseline'

/** An asset re-exported and overwritten in place this run (#81). */
export interface RegeneratedAsset {
  readonly path: string
  readonly nodeId: string
  /** How it was reproduced — the manifest's recorded mode, never a guess. */
  readonly export: AssetExport
  readonly reason: AssetChangeReason
}

/** A locked asset whose source node moved: the file was **not** touched (#81). */
export interface LockedAssetConflict {
  readonly path: string
  readonly nodeId: string
  readonly reason: AssetChangeReason
  /** The manifest's own words for why the lock exists — what to reconcile against. */
  readonly note: string
  /**
   * `firstSeen` this run, or `stillOpen` from an earlier one. A conflict is
   * reported **every** run until it is reconciled, so this is the difference
   * between news and a standing debt.
   */
  readonly state: 'firstSeen' | 'stillOpen'
  /** `ranAt` of the run that first reported it — equal to `ranAt` when `firstSeen`. */
  readonly firstSeenAt: string
}

/** An asset the run tried to reproduce and could not. Never a silent skip (#81). */
export interface AssetFailure {
  readonly path: string
  /** `null` only if a resolved entry somehow reached here without a node. */
  readonly nodeId: string | null
  readonly error: string
}

export interface Report {
  readonly schemaVersion: 1
  readonly ranAt: string
  readonly fileVersion: string
  readonly shortCircuited: boolean
  readonly changedFrames: readonly ChangedEntry[]
  readonly changedComponentSets: readonly ChangedEntry[]
  readonly untrackedFrames: readonly UntrackedFrame[]
  readonly assets: {
    readonly regenerated: readonly RegeneratedAsset[]
    readonly lockedConflicts: readonly LockedAssetConflict[]
    readonly failures: readonly AssetFailure[]
  }
  readonly errors: readonly string[]
}
