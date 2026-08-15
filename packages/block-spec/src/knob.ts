import { humanize } from './humanize'
import { placeholderReferences } from './placeholder'
import { surfaceForKnobPath } from './surfaces'
import type {
  BlockKnobs,
  BlockPlaceholder,
  BlockTier,
  ItemKnobs,
  Knob,
  KnobInput,
  KnobOption,
  KnobOptionInput,
  ObjectKnobs,
} from './types'

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
  description,
  icon,
  options,
  initialValue,
  valueType = 'string',
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
    // A numeric knob is written as strings and stored as numbers, so the two
    // spellings have to be the same string in both directions. `'01'` parses
    // to 1 and comes back as `'1'`, which would make a stored value match no
    // option and the control read "Default" for a value the editor chose —
    // `resolveKnobValue`'s branch 3, arrived at silently. Checked here so the
    // module fails to load rather than the canvas failing to agree with itself.
    if (valueType === 'number' && String(Number(option.value)) !== option.value) {
      throw new Error(
        `knob("${name}"): option "${option.value}" is declared number-valued but does not survive ` +
          `the round trip through Number() — a stored value would match no option.`,
      )
    }
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
    ...(description ? { description } : {}),
    ...(icon ? { icon } : {}),
    options: resolved,
    ...(initialValue !== undefined ? { initialValue } : {}),
    // Always present, like `surface` and `bar`: a `Knob` answers what its
    // values are wherever it travels, so no consumer has to spell the default.
    valueType,
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

/** One path declared twice is one control writing over another. */
function refuseDuplicatePaths(where: string, knobs: readonly Knob[]): void {
  const seen = new Set<string>()
  for (const k of knobs) {
    if (seen.has(k.name)) {
      throw new Error(`${where}: two knobs declare the path "${k.name}".`)
    }
    seen.add(k.name)
  }
}

/**
 * The knobs one block declares. This is the object an adapter reads: the
 * Sanity schema, the Storybook stories and the canvas toolbar are all
 * generated from it, so none of them can disagree about what a block offers.
 *
 * `items` carries the arrays whose MEMBERS declare knobs of their own, keyed
 * by the block-relative field name. A member is its own knob root (#122), so
 * its options never appear in `knobs` — which is also why an item knob cannot
 * reach `patchableKnobRoots` and overlay a whole array by accident.
 */
export function defineBlockKnobs({
  type,
  title,
  tier,
  knobs,
  items,
  placeholder,
}: {
  type: string
  title: string
  tier: BlockTier
  knobs: readonly Knob[]
  items?: Readonly<Record<string, ItemKnobs>>
  /** What one insert of this block writes (#112). See `placeholder.ts`. */
  placeholder?: BlockPlaceholder
}): BlockKnobs {
  refuseDuplicatePaths(`defineBlockKnobs("${type}")`, knobs)
  if (placeholder) {
    // A placeholder is written `satisfies HeroSection`, and the generated type
    // pins `_type` to a literal — so this can only fail when a file was copied
    // and half-renamed, which is exactly when it is worth failing. The spec
    // would otherwise insert content under a type nothing renders.
    if (placeholder._type !== type) {
      throw new Error(
        `defineBlockKnobs("${type}"): its placeholder declares _type "${placeholder._type}". ` +
          `An insert would write a member of a type this block does not answer to.`,
      )
    }
    // THE COMMIT-SAFE RULE, at declaration time. A placeholder may be written
    // to a real document by an editor who never reviewed it, so a document
    // reference in one asserts a relationship nobody authored — and it
    // publishes looking exactly like an authored one. Asset references are not
    // checked here: whether an asset is seeded is a fact about the dataset,
    // which this package cannot see (`tools/migration/src/placeholder.test.ts`
    // holds that half, against the manifest).
    const documentRefs = placeholderReferences(placeholder).document
    if (documentRefs.length > 0) {
      throw new Error(
        `defineBlockKnobs("${type}"): its placeholder references a document at ` +
          `${documentRefs.map((found) => `${found.path || '<root>'} → ${found.ref}`).join(', ')}. ` +
          `A placeholder is commit-safe content and may never point at a document — leave the ` +
          `field empty and let the editor pick.`,
      )
    }
  }
  for (const k of knobs) {
    // The failure this replaces was silent in the one place it mattered.
    // `knobFields` threw at schema load, but `knobPatch` split `screens[].tone`
    // on the dot and wrote the value into a field literally called `screens[]`
    // — a real mutation, into a field no schema declares (#122).
    if (k.surface === 'item') {
      throw new Error(
        `defineBlockKnobs("${type}"): knob "${k.name}" claims the item surface, but a block cannot ` +
          `name which member it configures. Declare it with defineItemKnobs() and hang that spec ` +
          `off the array in \`items\`.`,
      )
    }
    // Same refusal, one root over. A block that declared an instance's options
    // would be declaring them per placement, which is the thing ADR 0023
    // forbids: four blocks carry a `mark`, and four copies of its roster drift
    // apart with nothing failing.
    if (k.surface === 'instance') {
      throw new Error(
        `defineBlockKnobs("${type}"): knob "${k.name}" claims the instance surface, but a block ` +
          `does not configure the components placed in it. Declare it with defineObjectKnobs() ` +
          `against the shared object's own type name.`,
      )
    }
  }
  const roots = new Set(knobs.map((k) => k.name.split('.')[0]))
  for (const field of Object.keys(items ?? {})) {
    if (field === '') {
      throw new Error(
        `defineBlockKnobs("${type}"): an item spec is filed under an empty field name.`,
      )
    }
    if (roots.has(field)) {
      throw new Error(
        `defineBlockKnobs("${type}"): "${field}" is both a knob and an array with item knobs. ` +
          `One field cannot be a design option and hold members that have their own.`,
      )
    }
  }
  return {
    type,
    title,
    tier,
    knobs,
    ...(items ? { items } : {}),
    ...(placeholder ? { placeholder } : {}),
  }
}

/**
 * The knobs one ARRAY MEMBER declares — a screen in a grid, a panel in a rail.
 *
 * Same vocabulary, different root. Every path here is relative to the member,
 * so `tone` is the member's own field and a gate at `span` reads the member's
 * own `span`; nothing in this spec can see the block above it, which is the
 * property that makes every existing reader and writer work unchanged.
 *
 * **Surface is stamped, not computed.** The prefix table answers ownership for
 * a block-rooted path and has no array vocabulary to answer with here — and it
 * should not grow one, because `item` is a fact about the spec rather than
 * about the path. Every knob this takes is delivered in the member's own knob
 * menu, so it is marked as such once, here, and no author has to remember an
 * override on each one.
 */
export function defineItemKnobs({
  type,
  title,
  knobs,
}: {
  /** The member's `_type` — `screen`. Local to its array. */
  type: string
  title: string
  knobs: readonly Knob[]
}): ItemKnobs {
  refuseDuplicatePaths(`defineItemKnobs("${type}")`, knobs)
  return {
    type,
    title,
    tier: 'item',
    knobs: knobs.map((k) => (k.surface === 'item' ? k : { ...k, surface: 'item' })),
  }
}

/**
 * The knobs one SHARED OBJECT declares — a mark, a button (#145, ADR 0023).
 *
 * Same vocabulary, a third root. Every path here is relative to the instance,
 * so `kind` is the instance's own field wherever that instance sits: a mark on
 * a discipline row, a mark inside a rail panel and a mark in a layout column
 * are one component with one spec, and nothing is re-declared per placement.
 *
 * **Keyed on the type name, unlike an array member** (ADR 0021). Sanity
 * registers a shared object globally, so two types cannot silently agree on
 * `cta` the way two blocks can each declare a `screen` — the silent collision
 * that forced host-routing for members has no path here.
 *
 * **Surface is stamped, not computed**, for the reason `defineItemKnobs`
 * stamps `item`: `instance` is a fact about the spec rather than about the
 * path, and every knob this takes is delivered in the instance's own knob menu.
 */
export function defineObjectKnobs({
  type,
  title,
  knobs,
}: {
  /** The shared object's registered Sanity type name — `mark`. Global. */
  type: string
  title: string
  knobs: readonly Knob[]
}): ObjectKnobs {
  refuseDuplicatePaths(`defineObjectKnobs("${type}")`, knobs)
  return {
    type,
    title,
    tier: 'object',
    knobs: knobs.map((k) => (k.surface === 'instance' ? k : { ...k, surface: 'instance' })),
  }
}
