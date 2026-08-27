/**
 * The production gate: a load into `production` must be asked for twice.
 *
 * `production` stopped being disposable the day editors started authoring in
 * it (2026-08-27). A load deletes and recreates every unlocked pipeline-owned
 * document and clears any draft shadowing one, so pointed at `production` it
 * destroys Studio edits that exist nowhere else. The committed corpus is still
 * the source of truth for `development` — this gate changes nothing there.
 *
 * Pure — dataset name and argv in, a refusal message or null out — so the rule
 * is pinned by a fixture rather than by a dataset with no backups.
 */
export const ALLOW_FLAG = '--allow-production'

export function productionGate(
  dataset: string | undefined,
  argv: readonly string[],
): string | null {
  if (dataset !== 'production' || argv.includes(ALLOW_FLAG)) return null
  return [
    `REFUSED: this load targets the "production" dataset, which holds user-authored content.`,
    'A load deletes and recreates every unlocked pipeline-owned document and clears any',
    'draft shadowing one — Studio edits to those documents would be lost.',
    '',
    'Before loading into production:',
    '  pnpm dataset:drift      # which documents an editor changed since the corpus was committed',
    '  pnpm dataset:backup     # export production to a local tarball first',
    '',
    `Then say it out loud:  pnpm --filter @o3/migration load -- ${ALLOW_FLAG}`,
  ].join('\n')
}
