import type { HashDiff } from './diff'
import type { ChangeKind, ChangedEntry, Report, TrackedManifest } from './types'

/**
 * Report assembly (#78). The JSON schema is **fixed** here: later tickets fill
 * `changedComponentSets`, `untrackedFrames` and `assets`, they never reshape
 * them, so every section is present-but-empty from the first run. Anything
 * that would change a key's meaning bumps `schemaVersion`.
 */

export interface ReportInput {
  readonly ranAt: string
  readonly fileVersion: string
  readonly shortCircuited: boolean
  readonly manifest: TrackedManifest
  readonly diff?: HashDiff
  readonly errors?: readonly string[]
}

function entryFor(manifest: TrackedManifest, nodeId: string, change: ChangeKind): ChangedEntry {
  const tracked = manifest.entries.find((node) => node.nodeId === nodeId)
  // A removed node can be one the manifest no longer describes — it is still
  // worth reporting, so it falls back to naming itself.
  if (!tracked) return { nodeId, name: nodeId, route: null, variant: null, change }
  return {
    nodeId,
    name: tracked.name,
    route: tracked.route ?? null,
    variant: tracked.variant,
    change,
  }
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
    untrackedFrames: [],
    assets: { regenerated: [], lockedConflicts: [], failures: [] },
    errors: [...(input.errors ?? [])],
  }
}

const describe = (entry: ChangedEntry): string => {
  const where = entry.route ? ` → \`${entry.route}\`` : ''
  const variant = entry.variant ? ` (${entry.variant})` : ''
  return `- **${entry.name}**${variant}${where} — ${entry.change} \`${entry.nodeId}\``
}

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

  if (report.errors.length > 0) {
    lines.push('## Errors', '', ...report.errors.map((error) => `- ${error}`), '')
  }

  return lines.join('\n')
}
