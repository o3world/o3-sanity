/**
 * `pnpm --filter @o3/migration load` refuses, always, and says what to run
 * instead.
 *
 * A blanket load deletes and recreates every unlocked pipeline-owned document.
 * Editors author in `production` and `development` mirrors it, so no dataset is
 * left where that is harmless, and the command does nothing else.
 *
 * The script stays as a guard because agents and docs have named
 * `pnpm --filter @o3/migration load` for weeks. A missing script would fail
 * with no pointer to the targeted-migration route; this one prints it.
 */
console.error(
  [
    'REFUSED: the blanket load is retired.',
    '',
    'It deletes and recreates every unlocked pipeline-owned document in the target',
    'dataset. Editors author in `production` and `development` mirrors it, so no',
    'dataset is left where that is harmless.',
    '',
    'Ship the change as a targeted migration instead: a script scoped to exactly',
    'the documents it is about, under tools/migration/src/migrations/:',
    '',
    '  tools/migration/src/migrations/statsToBand.ts   # the worked example',
    '',
    'Still useful:',
    "  pnpm --filter @o3/migration sync-docs -- '<type>/<file>'   # named committed documents",
    '  pnpm dataset:drift      # which documents an editor changed',
    '  pnpm dataset:backup     # export production to a local tarball',
    '  pnpm dataset:sync       # production → development',
    '  pnpm --filter @o3/migration verify    # read-only: is the dataset what data/ says?',
  ].join('\n'),
)
process.exitCode = 1
