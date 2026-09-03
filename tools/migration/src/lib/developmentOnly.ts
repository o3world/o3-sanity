/**
 * The guard on a script that DELETES: it runs against `development` or it does
 * not run.
 *
 * Not a default that a flag can move — there is no flag. `--allow-production`
 * taught the lesson: a guard you can talk your way past is a guard that gets
 * talked past, and the thing on the other side of this one is production's
 * content with no Sanity backups on the plan.
 *
 * Pure — a dataset name in, a refusal or null out — so the rule is pinned by a
 * test rather than by a dataset nobody can restore.
 */
export function developmentOnly(dataset: string | undefined): string | null {
  if (dataset === 'development') return null
  return [
    `REFUSED: this deletes documents and only ever runs against "development".`,
    `This checkout points at "${dataset ?? 'an unset dataset'}".`,
    '',
    'There is no flag that aims it elsewhere. Point the checkout instead:',
    '  pnpm dataset development',
  ].join('\n')
}
