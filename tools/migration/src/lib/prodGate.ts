/**
 * The production gate: a write into `production` must be asked for twice.
 *
 * Editors author in `production`, so a write that replaces a document there
 * can destroy Studio edits that exist nowhere else. `development` is not
 * gated.
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
    `REFUSED: this run writes to the "production" dataset, which holds user-authored content.`,
    'Studio edits to the documents it replaces would be lost.',
    '',
    'Before writing to production:',
    '  pnpm dataset:drift      # which documents an editor changed since the corpus was committed',
    '  pnpm dataset:backup     # export production to a local tarball first',
  ].join('\n')
}
