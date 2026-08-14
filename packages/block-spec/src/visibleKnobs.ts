import { resolveKnobValue } from './resolveKnobValue'
import { showWhenSatisfied } from './showWhen'
import type { BlockKnobs, Knob, KnobReader, KnobSurface, ResolvedKnob } from './types'

/**
 * The knobs a knob at `name` inherits its gate from: every knob in the spec
 * whose path is a proper ancestor of this one, on segment boundaries.
 *
 * `media.ratio` shows only where `media` itself does. Without this a subfield
 * of a gated group publishes no gate of its own and the toolbar offers a
 * control the form hides — the failure the prior art hit and fixed in its
 * schema walker.
 */
function ancestorsOf(name: string, knobs: readonly Knob[]): Knob[] {
  return knobs.filter((other) => other.name !== name && name.startsWith(`${other.name}.`))
}

const EMPTY_BY_SURFACE = (): Record<KnobSurface, ResolvedKnob[]> => ({
  band: [],
  block: [],
  item: [],
})

/**
 * THE ONE QUESTION: what does this block offer, under this document state?
 *
 * Every gate lives behind this call — the nesting gate, inherited gates,
 * `showWhen`, option resolution, default resolution and surface ownership —
 * because the prior art's callers assembled the same answer in six steps each,
 * which meant a new axis multiplied the steps instead of answering the
 * question.
 *
 * `read` is a reader rather than a value object: a compound gate reads more
 * than one path and the caller cannot know how many before inspecting it.
 *
 * `nested` says the block is hosted inside another block's arrays (a
 * `layoutSection` column) rather than forming its own band at page root. Band
 * knobs drop there, because the container they configure is not the nested
 * block's to configure — its host owns it. Every other surface is unaffected.
 *
 * Both groupings come back because they answer different questions off the
 * same walk: `all` is the roster a knob menu renders, `bySurface` is where
 * each knob is delivered.
 */
export function visibleKnobs({
  spec,
  read,
  nested = false,
}: {
  spec: BlockKnobs
  read: KnobReader
  nested?: boolean
}): { all: ResolvedKnob[]; bySurface: Record<KnobSurface, ResolvedKnob[]> } {
  const all: ResolvedKnob[] = []
  const bySurface = EMPTY_BY_SURFACE()

  for (const knob of spec.knobs) {
    if (nested && knob.surface === 'band') continue
    const gates = [...ancestorsOf(knob.name, spec.knobs), knob]
    if (!gates.every((gated) => showWhenSatisfied(gated.showWhen, read))) continue

    const resolved: ResolvedKnob = {
      knob,
      surface: knob.surface,
      current: resolveKnobValue(knob, read(knob.name)),
    }
    all.push(resolved)
    bySurface[knob.surface].push(resolved)
  }

  return { all, bySurface }
}
