/**
 * The asset manifest's invariants (#80) — one entry per committed seed asset,
 * saying which Figma node it came from or saying out loud that nobody could
 * find one.
 *
 * Like `tracked-nodes.json`, `data/asset-manifest.json` is **hand-maintained
 * archaeology**: node ids were matched by hashing bytes against the file's
 * image fills (Figma keys a fill by the SHA-1 of its bytes, so a match is a
 * proof, not a resemblance) and by re-rendering candidate nodes and comparing
 * pixels. Nothing generates it, so this module is the gate on the mistakes
 * hand-editing it makes.
 *
 * `validate` takes the directory listing rather than reading it, so the whole
 * check is pure and the tests need no fixture tree on disk. It is the one seam
 * that answers both halves of the coverage question — *does every entry point
 * at a file?* and *does every file have an entry?* — because those two are the
 * same walk over the same two lists, and splitting them lets a file go missing
 * from one without the other noticing.
 *
 * It reports **every** problem it finds rather than throwing on the first.
 * A hand-edited manifest usually has more than one, and fixing them one
 * exception per run is how a five-minute correction becomes an afternoon.
 */

import type { AssetEntry, AssetManifest } from './types'

/** Where a seed asset has to live for `_localSrc` and this manifest to agree. */
export const ASSET_DIR = 'tools/migration/data/seed/assets'

const NODE_ID = /^\d+:\d+$/
const FORMATS = new Set(['svg', 'png'])
const EXPORTS = new Set(['render', 'imageFill'])

/** `path` is the manifest entry the problem is about, or the file with no entry. */
export interface AssetProblem {
  readonly path: string
  readonly message: string
}

function problemsForEntry(entry: AssetEntry): string[] {
  const problems: string[] = []

  if (!entry.path.startsWith(`${ASSET_DIR}/`)) {
    problems.push(`path is not under ${ASSET_DIR}/`)
  }
  if (!FORMATS.has(entry.format)) {
    problems.push(`format is "${entry.format}", not "svg" or "png"`)
  } else if (!entry.path.endsWith(`.${entry.format}`)) {
    problems.push(`format "${entry.format}" does not match the file extension`)
  }
  if (typeof entry.locked !== 'boolean') {
    problems.push('locked is missing — a manifest entry states it either way')
  }
  // Locked means "never overwrite this", which is a standing decision; an
  // unresolved entry is a dead end somebody has to be able to pick up. Both
  // are worthless without the reason.
  if (entry.locked && !entry.note) problems.push('locked without a note saying why')
  if (entry.unresolved && !entry.note) problems.push('unresolved without a note saying why')

  if (entry.unresolved) {
    if (entry.unresolved !== true) problems.push('unresolved is present but not `true`')
    // Half a match is a guess wearing a hedge. An unresolved entry claims
    // nothing about Figma at all.
    if (entry.nodeId !== undefined) problems.push('unresolved but still names a nodeId')
    if (entry.export !== undefined) problems.push('unresolved but still names an export mode')
    return problems
  }

  if (entry.nodeId === undefined) {
    problems.push('no nodeId and not marked unresolved')
  } else if (!NODE_ID.test(entry.nodeId)) {
    // Share URLs use `-`; the API takes `:`. Committing the URL form is the
    // easy mistake and produces a "node not found" run.
    problems.push(`nodeId "${entry.nodeId}" is not a \`:\`-separated node id`)
  }
  if (!entry.figmaName) problems.push('resolved without the Figma layer name')
  if (!entry.export || !EXPORTS.has(entry.export)) {
    problems.push('resolved without an export mode of "render" or "imageFill"')
  }
  if (entry.format === 'png') {
    if (typeof entry.scale !== 'number' || !(entry.scale > 0)) {
      problems.push('a resolved png needs a positive scale')
    } else if (entry.export === 'imageFill' && entry.scale !== 1) {
      // A fill original has no scale — it is the uploaded bytes. Anything but
      // 1 would tell #81 to render instead, which is a different image.
      problems.push('an imageFill is the uploaded original, so its scale is 1')
    }
  }

  return problems
}

/**
 * The manifest against the files that actually exist. `filesOnDisk` is
 * repo-relative paths, in any order; pass the real listing in a test that
 * means "the committed manifest is true", and a literal one everywhere else.
 */
export function validateAssetManifest(
  manifest: AssetManifest,
  filesOnDisk: readonly string[],
): AssetProblem[] {
  const problems: AssetProblem[] = []
  const seen = new Set<string>()
  const present = new Set(filesOnDisk)

  if (!manifest.fileKey) {
    problems.push({ path: '(manifest)', message: 'no fileKey — provenance of what?' })
  }

  for (const entry of manifest.assets) {
    for (const message of problemsForEntry(entry)) problems.push({ path: entry.path, message })

    // Two entries for one file is how a locked asset quietly acquires an
    // unlocked twin that #81 is happy to overwrite.
    if (seen.has(entry.path)) problems.push({ path: entry.path, message: 'listed twice' })
    seen.add(entry.path)

    if (!present.has(entry.path)) {
      problems.push({ path: entry.path, message: 'no such file — moved or deleted?' })
    }
  }

  for (const path of filesOnDisk) {
    if (!seen.has(path)) {
      problems.push({ path, message: 'committed asset with no manifest entry' })
    }
  }

  return problems
}

/** The entries #81 must never overwrite. */
export function lockedAssets(manifest: AssetManifest): readonly AssetEntry[] {
  return manifest.assets.filter((entry) => entry.locked)
}

/** The entries that name a node — everything a re-export could act on. */
export function resolvedAssets(manifest: AssetManifest): readonly AssetEntry[] {
  return manifest.assets.filter((entry) => !entry.unresolved)
}
