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
  /** The Design Concept section — what the untracked-frame probe reads (#79). */
  readonly sectionNodeId: string
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

export interface Report {
  readonly schemaVersion: 1
  readonly ranAt: string
  readonly fileVersion: string
  readonly shortCircuited: boolean
  readonly changedFrames: readonly ChangedEntry[]
  readonly changedComponentSets: readonly ChangedEntry[]
  readonly untrackedFrames: readonly UntrackedFrame[]
  readonly assets: {
    readonly regenerated: readonly unknown[]
    readonly lockedConflicts: readonly unknown[]
    readonly failures: readonly unknown[]
  }
  readonly errors: readonly string[]
}
