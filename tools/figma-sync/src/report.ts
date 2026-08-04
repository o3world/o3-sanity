import type { HashDiff } from './diff'
import type {
  AssetFailure,
  ChangeKind,
  ChangedEntry,
  LockedAssetConflict,
  RegeneratedAsset,
  Report,
  TrackedManifest,
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
  readonly errors?: readonly string[]
}

function entryFor(manifest: TrackedManifest, nodeId: string, change: ChangeKind): ChangedEntry {
  const tracked = manifest.entries.find((node) => node.nodeId === nodeId)
  // A removed node can be one the manifest no longer describes — it is still
  // worth reporting, so it falls back to naming itself.
  if (!tracked) return { nodeId, name: nodeId, route: null, variant: null, change }
  const base = {
    nodeId,
    name: tracked.name,
    route: tracked.route ?? null,
    variant: tracked.variant ?? null,
  }
  // A set that maps to nothing says `null` out loud: "we checked" reads
  // differently from "nobody has looked".
  return tracked.kind === 'componentSet'
    ? { ...base, codeComponent: tracked.codeComponent ?? null, change }
    : { ...base, change }
}

export function buildReport(input: ReportInput): Report {
  const { manifest, diff } = input
  const changes: ChangedEntry[] = diff
    ? [
        ...diff.added.map((id) => entryFor(manifest, id, 'added')),
        ...diff.modified.map((id) => entryFor(manifest, id, 'modified')),
        ...diff.removed.map((id) => entryFor(manifest, id, 'removed')),
      ]
    : []
  const kindOf = (nodeId: string) =>
    manifest.entries.find((node) => node.nodeId === nodeId)?.kind ?? 'pageFrame'

  return {
    schemaVersion: 1,
    ranAt: input.ranAt,
    fileVersion: input.fileVersion,
    shortCircuited: input.shortCircuited,
    changedFrames: changes.filter((entry) => kindOf(entry.nodeId) === 'pageFrame'),
    changedComponentSets: changes.filter((entry) => kindOf(entry.nodeId) === 'componentSet'),
    untrackedFrames: [...(input.untrackedFrames ?? [])],
    assets: {
      regenerated: [...(input.assets?.regenerated ?? [])],
      lockedConflicts: [...(input.assets?.lockedConflicts ?? [])],
      failures: [...(input.assets?.failures ?? [])],
    },
    errors: [...(input.errors ?? [])],
  }
}

const describe = (entry: ChangedEntry): string => {
  const where = entry.route ? ` → \`${entry.route}\`` : ''
  const variant = entry.variant ? ` (${entry.variant})` : ''
  // Only component sets carry the key at all; `null` on one is a decision.
  const code =
    entry.codeComponent === undefined
      ? ''
      : entry.codeComponent
        ? ` → \`${entry.codeComponent}\``
        : ' → no code target'
  return `- **${entry.name}**${variant}${where}${code} — ${entry.change} \`${entry.nodeId}\``
}

const describeRegenerated = (asset: RegeneratedAsset): string =>
  `- \`${asset.path}\` — re-exported from \`${asset.nodeId}\` (${asset.export}, ${asset.reason})`

const describeConflict = (conflict: LockedAssetConflict): string => {
  const moved =
    conflict.reason === 'node-changed'
      ? 'changed'
      : 'is new to the baseline (nothing had hashed it before)'
  return `- \`${conflict.path}\` — \`${conflict.nodeId}\` ${moved}. Locked: ${conflict.note}`
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
      lines.push('## Changed frames', '', ...report.changedFrames.map(describe), '')
    }
    if (report.changedComponentSets.length > 0) {
      lines.push('## Changed component sets', '', ...report.changedComponentSets.map(describe), '')
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
