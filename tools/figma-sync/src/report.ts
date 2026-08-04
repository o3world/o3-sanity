import type { HashDiff } from './diff'
import type {
  AssetFailure,
  Baseline,
  ChangeKind,
  ChangedEntry,
  LockedAssetConflict,
  RegeneratedAsset,
  Report,
  TrackedKind,
  TrackedManifest,
  TrackedNode,
  UntrackedFrame,
} from './types'

/**
 * Report assembly (#78). The JSON schema is **fixed** here: later tickets fill
 * `changedComponentSets`, `untrackedFrames` and `assets`, they never reshape
 * them, so every section is present-but-empty from the first run. Anything
 * that would change a key's meaning bumps `schemaVersion`.
 *
 * #79 filled the first two of those sections without touching a key: a
 * component-set entry is a `changedFrames` entry plus `codeComponent`, which
 * page frames do not carry and consumers of `changedFrames` never saw. #81
 * filled the three `assets` arrays the same way — the arrays were always
 * there, and a consumer reading `report.assets.failures` got `[]` before this
 * ticket and gets entries after it.
 */

export interface ReportAssets {
  readonly regenerated: readonly RegeneratedAsset[]
  readonly lockedConflicts: readonly LockedAssetConflict[]
  readonly failures: readonly AssetFailure[]
}

export interface ReportInput {
  readonly ranAt: string
  readonly fileVersion: string
  readonly shortCircuited: boolean
  readonly manifest: TrackedManifest
  readonly diff?: HashDiff
  /** What the probe found in the section, already classified (`probe.ts`). */
  readonly untrackedFrames?: readonly UntrackedFrame[]
  /** What the asset stage did, already decided and carried out (`assets.ts`). */
  readonly assets?: ReportAssets
  /**
   * What the baseline remembers each node **was** (`baseline.kinds`). Only
   * `removed` needs it, and only `removed` can: a node the manifest no longer
   * describes has no other way to say it was a component set rather than a
   * page, and defaulting to `pageFrame` files a deleted set under
   * `changedFrames`.
   */
  readonly previousKinds?: Readonly<Record<string, TrackedKind>>
  readonly errors?: readonly string[]
}

/** A `changedComponentSets` entry is a `changedFrames` entry plus this one key (#79). */
const isComponentSet = (entry: ChangedEntry): boolean => entry.codeComponent !== undefined

function entryFor(
  tracked: TrackedNode | undefined,
  kind: TrackedKind,
  nodeId: string,
  change: ChangeKind,
): ChangedEntry {
  // A removed node can be one the manifest no longer describes — it is still
  // worth reporting, so it falls back to naming itself.
  const base = {
    nodeId,
    name: tracked?.name ?? nodeId,
    route: tracked?.route ?? null,
    variant: tracked?.variant ?? null,
  }
  // A set that maps to nothing says `null` out loud: "we checked" reads
  // differently from "nobody has looked".
  return kind === 'componentSet'
    ? { ...base, codeComponent: tracked?.codeComponent ?? null, change }
    : { ...base, change }
}

export function buildReport(input: ReportInput): Report {
  const { manifest, diff } = input
  const byId = new Map(manifest.entries.map((node) => [node.nodeId, node]))
  const previousKinds = input.previousKinds ?? {}
  const entryOf = (nodeId: string, change: ChangeKind) => {
    const tracked = byId.get(nodeId)
    return entryFor(tracked, tracked?.kind ?? previousKinds[nodeId] ?? 'pageFrame', nodeId, change)
  }
  const changes: ChangedEntry[] = diff
    ? [
        ...diff.added.map((id) => entryOf(id, 'added')),
        ...diff.modified.map((id) => entryOf(id, 'modified')),
        ...diff.removed.map((id) => entryOf(id, 'removed')),
      ]
    : []

  return {
    schemaVersion: 1,
    ranAt: input.ranAt,
    fileVersion: input.fileVersion,
    shortCircuited: input.shortCircuited,
    changedFrames: changes.filter((entry) => !isComponentSet(entry)),
    changedComponentSets: changes.filter(isComponentSet),
    untrackedFrames: [...(input.untrackedFrames ?? [])],
    assets: {
      regenerated: [...(input.assets?.regenerated ?? [])],
      lockedConflicts: [...(input.assets?.lockedConflicts ?? [])],
      failures: [...(input.assets?.failures ?? [])],
    },
    errors: [...(input.errors ?? [])],
  }
}

/** Markdown for the report, plain text for the console — the same four fragments. */
export type EntryStyle = 'markdown' | 'plain'

/**
 * One `ChangedEntry` line. Both callers used to compose these fragments
 * themselves, in two places, which is exactly how a report and the summary
 * that describes it drift apart.
 */
export function formatChangedEntry(entry: ChangedEntry, style: EntryStyle): string {
  const tick = style === 'markdown' ? '`' : ''
  const variant = entry.variant ? ` (${entry.variant})` : ''
  const where = entry.route ? ` → ${tick}${entry.route}${tick}` : ''
  // Only component sets carry the key at all; `null` on one is a decision.
  const code =
    entry.codeComponent === undefined
      ? ''
      : entry.codeComponent
        ? ` → ${tick}${entry.codeComponent}${tick}`
        : ' → no code target'
  return style === 'markdown'
    ? `- **${entry.name}**${variant}${where}${code} — ${entry.change} \`${entry.nodeId}\``
    : `  ${entry.change.padEnd(8)} ${entry.name}${variant}${where}${code}  ${entry.nodeId}`
}

const describeRegenerated = (asset: RegeneratedAsset): string =>
  `- \`${asset.path}\` — re-exported from \`${asset.nodeId}\` (${asset.export}, ${asset.reason})`

const describeConflict = (conflict: LockedAssetConflict): string => {
  const moved =
    conflict.reason === 'node-changed'
      ? 'changed'
      : 'is new to the baseline (nothing had hashed it before)'
  // A conflict nobody has acted on has to read as a debt, not as news.
  const age =
    conflict.state === 'stillOpen'
      ? ` **still open** since ${conflict.firstSeenAt}.`
      : ` First seen ${conflict.firstSeenAt}.`
  return `- \`${conflict.path}\` — \`${conflict.nodeId}\` ${moved}.${age} Locked: ${conflict.note}`
}

const describeFailure = (failure: AssetFailure): string =>
  `- \`${failure.path}\`${failure.nodeId ? ` (\`${failure.nodeId}\`)` : ''} — ${failure.error}`

const describeUntracked = (frame: UntrackedFrame): string =>
  `- **${frame.name}**${frame.width === null ? '' : ` (${frame.width}w)`} — \`${frame.nodeId}\``

/** The human half of the report. Overwritten each run; history lives in git. */
export function renderReportMarkdown(report: Report): string {
  const lines = [
    '# Figma sync',
    '',
    `- Ran: ${report.ranAt}`,
    `- File version: ${report.fileVersion}`,
    `- Short-circuited: ${report.shortCircuited ? 'yes (file unchanged)' : 'no'}`,
    '',
  ]

  const changed = [...report.changedFrames, ...report.changedComponentSets]
  if (changed.length === 0) {
    lines.push('No changes to any tracked node.', '')
  } else {
    if (report.changedFrames.length > 0) {
      lines.push(
        '## Changed frames',
        '',
        ...report.changedFrames.map((entry) => formatChangedEntry(entry, 'markdown')),
        '',
      )
    }
    if (report.changedComponentSets.length > 0) {
      lines.push(
        '## Changed component sets',
        '',
        ...report.changedComponentSets.map((entry) => formatChangedEntry(entry, 'markdown')),
        '',
      )
    }
  }

  if (report.untrackedFrames.length > 0) {
    lines.push(
      '## Untracked frames',
      '',
      'In the Design Concept section, not in the manifest. Each one is a decision:',
      'canonical → add it to `tracked-nodes.json`; noise → add it to `ignoredNodeIds`.',
      '',
      ...report.untrackedFrames.map(describeUntracked),
      '',
    )
  }

  const { regenerated, lockedConflicts, failures } = report.assets
  if (regenerated.length + lockedConflicts.length + failures.length > 0) {
    lines.push('## Assets', '')
    if (regenerated.length > 0) {
      lines.push(
        '### Regenerated',
        '',
        'Overwritten in place — the git diff is the review surface.',
        '',
        ...regenerated.map(describeRegenerated),
        '',
      )
    }
    if (lockedConflicts.length > 0) {
      lines.push(
        '### Locked conflicts',
        '',
        'Source changed, asset locked — **reconcile by hand**. Nothing was written.',
        'A conflict is re-reported every run until the manifest entry changes.',
        '',
        ...lockedConflicts.map(describeConflict),
        '',
      )
    }
    if (failures.length > 0) {
      lines.push(
        '### Failures',
        '',
        'Nothing was written and no baseline hash was recorded — the next run retries.',
        '',
        ...failures.map(describeFailure),
        '',
      )
    }
  }

  if (report.errors.length > 0) {
    lines.push('## Errors', '', ...report.errors.map((error) => `- ${error}`), '')
  }

  return lines.join('\n')
}

/**
 * The whole output of a short-circuited run. It writes **nothing** — no report,
 * no baseline — so `data/report.{json,md}` keeps describing the last real run
 * and two consecutive syncs leave an empty `git status`. That makes the console
 * the only place an unreconciled locked conflict can surface, so it does.
 */
export function shortCircuitSummary(baseline: Baseline): string[] {
  const lines = [`no changes since ${baseline.syncedAt}`]
  const open = baseline.openAssetConflicts ?? []
  if (open.length > 0) {
    lines.push(
      `${open.length} unreconciled locked-asset conflict${open.length === 1 ? '' : 's'} —` +
        ' nothing was written, and nothing has closed them:',
    )
    for (const conflict of open) {
      lines.push(
        `  conflict ${conflict.path}  ← ${conflict.nodeId} (open since ${conflict.firstSeenAt})`,
      )
    }
  }
  lines.push('nothing written — tools/figma-sync/data/ still describes the last real run')
  return lines
}
