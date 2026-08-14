import { humanize } from './humanize'
import { surfaceForKnobPath } from './surfaces'
import type { BlockKnobs, BlockTier, Knob, KnobInput, KnobOption, KnobOptionInput } from './types'

function normaliseOption(input: KnobOptionInput): KnobOption {
  if (typeof input === 'string') return { value: input, title: humanize(input) }
  const { title, ...rest } = input
  return { ...rest, title: title ?? humanize(input.value) }
}

/**
 * Declare one design option on a block.
 *
 * Everything an editorial surface needs sits on the returned object, because
 * the alternative is what ADR 0020 is about: the icon in one package, the
 * gate in another, the surface in a third, and no way to tell whether a knob
 * is missing on purpose. **Enum-ness publishes nothing** — a field becomes a
 * control by being declared here and by nothing else.
 *
 * Invariants are checked at declaration time so a bad knob fails when the
 * module loads rather than rendering an empty control on a canvas.
 */
export function knob({
  name,
  title,
  icon,
  options,
  initialValue,
  showWhen,
  surface,
  bar,
}: KnobInput): Knob {
  const resolved = options.map(normaliseOption)
  if (resolved.length === 0) {
    throw new Error(`knob("${name}"): a knob needs at least one option.`)
  }
  const seen = new Set<string>()
  for (const option of resolved) {
    if (seen.has(option.value)) {
      throw new Error(`knob("${name}"): duplicate option value "${option.value}".`)
    }
    seen.add(option.value)
  }
  if (initialValue !== undefined && !seen.has(initialValue)) {
    throw new Error(
      `knob("${name}"): initialValue "${initialValue}" names no option. ` +
        `A default outside the value set displays a value the control cannot re-pick.`,
    )
  }
  return {
    name,
    title,
    ...(icon ? { icon } : {}),
    options: resolved,
    ...(initialValue !== undefined ? { initialValue } : {}),
    ...(showWhen ? { showWhen } : {}),
    // Resolved once, here, so a `Knob` is complete wherever it travels. An
    // author overrides when the block's own shape disagrees with the table.
    surface: surface ?? surfaceForKnobPath(name),
    // The bar is a curated subset and the menu carries everything (CONTEXT.md),
    // so bar membership is opt-in. Never derived from `icon` being present —
    // that is the accident that put a machine field in front of an editor in
    // the prior art.
    bar: bar ?? false,
  }
}

/**
 * The knobs one block declares. This is the object an adapter reads: the
 * Sanity schema, the Storybook stories and the canvas toolbar are all
 * generated from it, so none of them can disagree about what a block offers.
 */
export function defineBlockKnobs({
  type,
  title,
  tier,
  knobs,
}: {
  type: string
  title: string
  tier: BlockTier
  knobs: readonly Knob[]
}): BlockKnobs {
  const seen = new Set<string>()
  for (const k of knobs) {
    if (seen.has(k.name)) {
      throw new Error(`defineBlockKnobs("${type}"): two knobs declare the path "${k.name}".`)
    }
    seen.add(k.name)
  }
  return { type, title, tier, knobs }
}
