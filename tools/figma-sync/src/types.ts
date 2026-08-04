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
  /** Code component the set maps to, for `kind: "componentSet"` (later ticket). */
  readonly codeComponent?: string
  readonly variant: TrackedVariant
}

export interface TrackedManifest {
  readonly fileKey: string
  /** The Design Concept section — reserved for a later untracked-frame probe. */
  readonly sectionNodeId: string
  readonly entries: readonly TrackedNode[]
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
  readonly change: ChangeKind
}

export interface Report {
  readonly schemaVersion: 1
  readonly ranAt: string
  readonly fileVersion: string
  readonly shortCircuited: boolean
  readonly changedFrames: readonly ChangedEntry[]
  readonly changedComponentSets: readonly ChangedEntry[]
  readonly untrackedFrames: readonly unknown[]
  readonly assets: {
    readonly regenerated: readonly unknown[]
    readonly lockedConflicts: readonly unknown[]
    readonly failures: readonly unknown[]
  }
  readonly errors: readonly string[]
}
