/**
 * THE BLANKET LOAD IS RETIRED FOR o3. There is no flag.
 *
 * `load` deletes and recreates every unlocked pipeline-owned document and
 * clears any draft shadowing one. That was the right shape while the corpus
 * was the source of truth and the dataset was disposable. It stopped being so
 * the day editors started authoring (2026-08-27), and `production` holding
 * user content made the committed JSON the *older* copy of most documents —
 * ADR 0003 inverted.
 *
 * `--allow-production` was the first answer and it was not enough: it guarded
 * the dataset and not the shape of the operation, so a load into `development`
 * still reverted whatever had been authored or synced there, and `development`
 * mirrors `production` now (`pnpm dataset:sync`). A command whose safe uses are
 * all narrower than the command is one to remove rather than to warn about.
 *
 * **What replaces it**: a targeted script under `src/migrations/`, scoped to
 * exactly the documents a change is about. `statsToBand.ts` is the worked
 * example — it reports before it writes, refuses a dataset it was not told
 * about out loud, reruns as a no-op, and overwrites no field.
 *
 * **o3xo is not retired**, and the asymmetry is the point rather than an
 * oversight: `tunpgire/production` is that brand's only dataset, it holds
 * nothing but this pipeline's output, and no editor authors in it. There is
 * no content there for a load to destroy. When o3xo launches, this gate takes
 * a second brand and the pipeline is deleted outright (ADR 0002).
 *
 * Pure — a brand in, a refusal or null out — so the rule is pinned by a test
 * rather than by a dataset with no backups.
 */
import type { Brand } from '@o3/sanity/brand'

export function loadRetired(brand: Brand): string | null {
  if (brand !== 'o3') return null
  return [
    'REFUSED: the blanket load is retired for o3.',
    '',
    'It deletes and recreates every unlocked pipeline-owned document, in whichever',
    'dataset. Editors author in `production` and `development` mirrors it, so there',
    'is no longer a dataset where that is the harmless operation it once was.',
    '',
    'Ship the change as a targeted migration instead — a script scoped to exactly',
    'the documents it is about, under tools/migration/src/migrations/:',
    '',
    '  tools/migration/src/migrations/statsToBand.ts   # the worked example',
    '',
    'Still useful, and unaffected:',
    '  pnpm dataset:drift      # which documents an editor changed',
    '  pnpm dataset:backup     # export production to a local tarball',
    '  pnpm dataset:sync       # production → development',
    '  pnpm --filter @o3/migration verify    # read-only: is the dataset what data/ says?',
  ].join('\n')
}
