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
