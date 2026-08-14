import { existsSync, readFileSync } from 'node:fs'

import { placeholderReferences } from '@o3/block-spec'
import { BLOCK_KNOBS } from '@o3/sanity/knobs'
import { describe, expect, it } from 'vitest'

import { ASSET_MAP } from './lib/paths'

/**
 * THE OTHER HALF OF THE COMMIT-SAFE RULE (#112): an asset a placeholder points
 * at has to be one the pipeline actually seeded.
 *
 * A placeholder is content that may be published without review, so a document
 * reference in one is refused outright, at declaration time, by
 * `defineBlockKnobs`. An **asset** reference is different — it is allowed, and
 * it is the only way a placeholder can arrive with a picture in it — but only
 * against an asset the dataset holds. One it does not renders as a broken tile
 * in production, and it renders as a broken tile in every environment at once,
 * because an asset id is global.
 *
 * This check lives here, in the pipeline, rather than beside the declarations,
 * because "which assets exist" is a fact about the dataset and `data/assets.json`
 * is the record of it. `@o3/sanity` cannot see this file and should not learn to.
 *
 * **It passes vacuously today, and that is the intended state.** No placeholder
 * in the repo carries an image: an image a placeholder chose is one an editor
 * has to notice is not theirs, and every block that needs one renders without
 * it. The check is here so the first one that wants an image has somewhere to
 * fail, rather than discovering the rule after it shipped.
 */

/** Every asset id `load` has uploaded, from the committed manifest. */
function seededAssetIds(): Set<string> {
  if (!existsSync(ASSET_MAP)) return new Set()
  const manifest = JSON.parse(readFileSync(ASSET_MAP, 'utf8')) as Record<
    string,
    { assetId: string }
  >
  return new Set(Object.values(manifest).map((entry) => entry.assetId))
}

const SPECS = Object.entries(BLOCK_KNOBS)

describe('a placeholder’s asset references are seeded', () => {
  const seeded = seededAssetIds()

  it.each(SPECS)('%s', (type, spec) => {
    const unseeded = placeholderReferences(spec.placeholder)
      .asset.filter((found) => !seeded.has(found.ref))
      .map((found) => `${found.path} → ${found.ref}`)

    expect(
      unseeded,
      `${type}'s placeholder points at an asset data/assets.json does not carry — ` +
        `seed it, or leave the image empty and let the editor pick`,
    ).toEqual([])
  })
})
