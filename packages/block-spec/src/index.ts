/**
 * `@o3/block-spec` — the knob vocabulary and the one query (ADR 0020).
 *
 * A **knob** is one design option on a block: a closed value set with a title,
 * an icon and a declared rule for when it applies. It is declared once, here,
 * and the Sanity field, the Storybook control and the canvas toolbar are all
 * derived from that declaration — so none of them can disagree about what a
 * block offers.
 *
 * **Zero runtime dependencies, and it stays that way.** The declaration has to
 * bundle into the Studio, into the site's Presentation overlay and into
 * Storybook alike; a dependency on `sanity` or `react` here would put the
 * preview bundle back where the prior art was, deriving the pure artifact from
 * the impure one.
 *
 * An author learns four things:
 *
 * ```ts
 * const layout = knob({ name: 'layout', title: 'Layout', options: ['rail', 'cards'] })
 * const spec = defineBlockKnobs({ type: 'railPanelsSection', title: 'Rail + panels',
 *                                 tier: 'section', knobs: [layout] })
 * const { all, bySurface } = visibleKnobs({ spec, read, nested })
 * const { value, title, isDefault } = resolveKnobValue(layout, stored)
 * ```
 *
 * An array member declares its own, against its own root (#122). Everything
 * above works on it unchanged, because every path a reader takes is relative to
 * the root it was handed:
 *
 * ```ts
 * const screen = defineItemKnobs({ type: 'screen', title: 'Screen', knobs: [tone] })
 * const grid = defineBlockKnobs({ …, items: { screens: screen } })
 * ```
 */

export { defineBlockKnobs, defineItemKnobs, knob } from './knob'
export { humanize } from './humanize'
export { itemKnobsAt, patchableItemRoots } from './items'
export { patchableKnobRoots } from './patchableRoots'
export { resolveKnobValue, UNRESOLVED_KNOB_TITLE } from './resolveKnobValue'
export { showWhenSatisfied } from './showWhen'
// The read leg and the write leg, exported as the pair they are — see
// `optionValue.ts` for why having only one of them was #123.
export { optionKey, storedValue } from './optionValue'
export { DEFAULT_KNOB_SURFACE, SURFACE_RULES, surfaceForKnobPath } from './surfaces'
export { visibleKnobs } from './visibleKnobs'

export type {
  BlockKnobs,
  BlockTier,
  ItemKnobs,
  Knob,
  KnobIcon,
  KnobInput,
  KnobOption,
  KnobOptionInput,
  KnobReader,
  KnobRoot,
  KnobSurface,
  KnobValue,
  KnobValueType,
  LeafShowWhen,
  ResolvedKnob,
  ShowWhen,
  SurfaceRule,
} from './types'
