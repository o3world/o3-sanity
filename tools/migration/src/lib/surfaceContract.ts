import { showWhenSatisfied } from '@o3/block-spec'
import { BLOCK_KNOBS } from '@o3/sanity/knobs'

/**
 * DOES THIS STORED SECTION OWE A `surface`?
 *
 * Three tests ask it — the seed corpus, the converted corpus and the WordPress
 * mapper — and each of them used to answer it from `paintsOwnSurface` alone.
 * That reading went wrong the moment a knob could be gated: the hero offers a
 * surface on its band composition and hides the control on the orbital one, so
 * "the block declares a surface knob" stopped being the same question as "this
 * section can be given a surface".
 *
 * The answer is per SECTION rather than per block for exactly that reason, and
 * it is read off the declaration rather than a list of block names: a knob that
 * is present and whose gate this section's own values satisfy is a control an
 * editor can reach, and a document is expected to carry what an editor could
 * have chosen. `initialValue` only runs in Studio, so a loaded document with no
 * stored surface takes the renderer's fallback rather than a value anyone
 * picked.
 */
export function offersSurface(section: Record<string, unknown>): boolean {
  const spec = BLOCK_KNOBS[String(section._type) as keyof typeof BLOCK_KNOBS]
  const knob = spec?.knobs.find((candidate) => candidate.name === 'surface')
  if (!knob) return false
  return showWhenSatisfied(knob.showWhen, (path) => section[path])
}
