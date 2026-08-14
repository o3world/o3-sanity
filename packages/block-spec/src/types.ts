/**
 * The knob vocabulary (ADR 0020). Every type here is plain data with no
 * runtime dependency, because the same declaration has to bundle into the
 * Studio, the site's preview overlay and Storybook.
 */

/**
 * A knob's icon.
 *
 * Deliberately structural rather than React's `ComponentType`: this package
 * has **zero dependencies**, so it cannot name `react` — not even in an
 * `import type`, which still needs the types installed to typecheck. A
 * `@sanity/icons` component is a callable object, so it satisfies this
 * signature, and the packages that render one (`@o3/editor-chrome/canvas`,
 * `@o3/sanity`) already depend on React and narrow it there. `never` in the
 * parameter position is what makes any props shape assignable.
 *
 * Typing it as bare `unknown` was the alternative. This catches a string or a
 * JSX element passed by mistake and costs nothing.
 */
export type KnobIcon = (props: never) => unknown

/**
 * How a knob's chosen option is STORED, as opposed to how it is declared.
 *
 * **Declared, never inferred** (#119). Option values are strings everywhere on
 * this side of the seam — `optionKey` coerces a stored number back to one, so
 * every comparison, gate, arg and data attribute stays a string — and this says
 * what the document field underneath holds. `layoutSection.columns` is the
 * first `'number'`: the field is `type: 'number'` with `1 | 2 | 3`, and it has
 * to stay that way or the generated types move under the renderer.
 *
 * Inferring it from the option set (`['1','2','3']` looks numeric, so emit a
 * number field) was the cheaper half. It is rejected for the reason ADR 0020
 * exists: a knob whose values happen to read as numbers but mean strings — a
 * version, a grade, a zero-padded code — would flip the schema field's type
 * with nothing at the call site saying so, and the failure lands in
 * `generated.ts` and the renderer's props rather than here. The same argument
 * `knob()` already makes about enum-ness: shape publishes nothing, declarations
 * do. Saying `valueType: 'number'` costs one line and cannot be a guess.
 */
export type KnobValueType = 'string' | 'number'

/** One member of a knob's closed value set. */
export type KnobOption = {
  /**
   * What is stored in the document, as a string. A `number`-typed knob stores
   * `Number(value)` and this is its exact decimal spelling — the adapter
   * converts at the schema boundary, and `optionKey` converts back on the way
   * in, so the two directions round-trip.
   */
  value: string
  /** What an editor reads. */
  title: string
  /**
   * A captured screenshot of this option. Nothing produces one yet — the
   * variant-capture pipeline is deferred (map #101) — and the field is here
   * so that landing it later touches neither the toolbar nor this type.
   */
  previewUrl?: string
}

/** What an author may write for an option: a bare value, or the whole thing. */
export type KnobOptionInput = string | (Omit<KnobOption, 'title'> & { title?: string })

/**
 * A gate that reads exactly one path, relative to the block root.
 *
 * `at` is a path, never a closure. A closure can only be evaluated by the
 * Studio form; a declaration is read by the form, the toolbar and Storybook
 * alike, which is the whole reason visibility is data here (ADR 0020). The
 * prior art tried to recover intent from a predicate's serialised source and
 * the gate silently inverted — vitest and tsx stringify differently.
 */
export type LeafShowWhen =
  /**
   * Show when the path holds a value. `undefined`, `null`, `''` and `[]` are
   * empty; `emptyValues` names more (`decoration: 'none'` stores a value that
   * means "nothing to configure").
   */
  | { at: string; mode: 'present'; emptyValues?: readonly string[] }
  /**
   * Show when the stored value is one of `values`. An unset path does **not**
   * match unless `emptyMatches` says so — which it must whenever the gate
   * names the field's own default, since Sanity never writes `initialValue`
   * into documents saved before the field existed.
   */
  | { at: string; mode: 'oneOf'; values: readonly string[]; emptyMatches?: boolean }
  /**
   * Show when the stored value is not one of `values`. An unset path is not
   * one of them, so it shows — no modifier, because the symmetric case is
   * `oneOf` with `emptyMatches`.
   */
  | { at: string; mode: 'notOneOf'; values: readonly string[] }

/**
 * A knob's declared visibility gate. `allOf` takes leaves only: a gate is a
 * conjunction of single-path tests, and nesting conjunctions inside each other
 * buys nothing an author can use.
 */
export type ShowWhen = LeafShowWhen | { mode: 'allOf'; all: readonly LeafShowWhen[] }

/**
 * Which editorial surface owns a knob — the element whose chrome delivers it.
 *
 * Not to be confused with the `surface` **knob** (`white | bone | ink`), which
 * is a design token on the band. The two words collide because both were
 * settled before the other existed; this one is always spelled `KnobSurface`.
 *
 * - `band` — the band the block occupies when it is a page-root section. A
 *   nested block forms no band, so these knobs drop (see `visibleKnobs`).
 * - `block` — the block itself: its identity and its layout. The default.
 * - `item` — a keyed array item inside the block, delivered in that item's
 *   own knob menu.
 *
 * `item` IS NOT A VALUE THE PREFIX TABLE COMPUTES. It is a fact about which
 * spec you are holding: `defineItemKnobs` stamps it on every knob it takes, and
 * `defineBlockKnobs` refuses one. An item knob configures a member the block
 * cannot name, so a block-rooted path could only ever write somewhere the
 * writer would have to invent — see `ItemKnobs`.
 */
export type KnobSurface = 'band' | 'block' | 'item'

/** One row of the surface-ownership table. */
export type SurfaceRule = {
  /** A block-relative knob path, or the prefix of a family of them. */
  prefix: string
  surface: KnobSurface
}

/** One design option on a block, as declared. */
export type Knob = {
  /** Block-relative dot path — `variant`, `media.ratio`. Also the field it patches. */
  name: string
  /** What an editor reads on the control. */
  title: string
  /**
   * The sentence an editor needs in order to choose. Not decoration: it is
   * where a block says what `orbital` means as opposed to `band`, and it
   * carries into the Studio field's `description` and the knob menu's help
   * text alike. Absent when the title and the option labels already say it.
   */
  description?: string
  icon?: KnobIcon
  /** The closed value set, normalised. Never empty. */
  options: readonly KnobOption[]
  /** The schema default. Always names one of `options` when `knob()` built it. */
  initialValue?: string
  /** What the document field holds. Resolved to `'string'` when unstated. */
  valueType: KnobValueType
  showWhen?: ShowWhen
  /** Resolved from the prefix table at declaration time, or overridden. */
  surface: KnobSurface
  /** Does the hover bar carry it? The bar is a curated subset; the menu is not. */
  bar: boolean
}

/** What an author passes to `knob()`. */
export type KnobInput = {
  name: string
  title: string
  description?: string
  icon?: KnobIcon
  options: readonly KnobOptionInput[]
  initialValue?: string
  /** Defaults to `'string'`, which is what every design option but one is. */
  valueType?: KnobValueType
  showWhen?: ShowWhen
  surface?: KnobSurface
  bar?: boolean
}

/**
 * Which registry the block belongs to (`registry.ts`). Carried so an adapter
 * can route a spec to `defineSectionBlock` or `defineBaseBlock` without a
 * second lookup.
 */
export type BlockTier = 'section' | 'base'

/**
 * AN ARRAY MEMBER IS ITS OWN KNOB ROOT (#122), not a longer path from the block.
 *
 * Every reader and writer in the repo takes a path relative to the root it was
 * handed. A member's design options have no such path from the block: the
 * member they configure is not identified until an editor points at one, so
 * `screens[].tone` names no field, resolves to one answer for five screens, and
 * — the reason this type exists — writes a `setIfMissing({})` at a field
 * literally called `screens[]` without any layer objecting.
 *
 * So the member gets a root of its own. `tone` is then an ordinary knob path,
 * `visibleKnobs` resolves it against ONE named screen, `knobPatch` writes to
 * that screen through the two-level keyed path it already handles, and a gate
 * on a sibling (`span` shown only for a `wide` screen) is an ordinary
 * same-root gate.
 */
export type ItemKnobs = {
  /**
   * The member's `_type` — `screen`. **Local to its array, never global.** Two
   * blocks may each declare a `screen` member with different fields, which is
   * why a spec is reached through its host block rather than through a map
   * keyed on this (ADR 0021).
   */
  type: string
  title: string
  /** Discriminates against `BlockTier`, which deliberately has no `item`. */
  tier: 'item'
  knobs: readonly Knob[]
}

/**
 * The content one newly inserted block starts with — the second authored
 * artifact a block declares (#112), beside its knobs.
 *
 * Typed structurally here for the same reason `KnobIcon` is: this package has
 * zero dependencies and cannot name a generated type. The declaration site
 * does, and that is where the guarantee lives — every placeholder in this repo
 * is written `satisfies HeroSection`, against the type typegen publishes for
 * its own block, so a placeholder cannot carry a field the schema dropped.
 *
 * `_type` is required and redundant on purpose. `defineBlockKnobs` checks it
 * against the spec's own `type`, which is what makes `satisfies HeroSection`
 * — the whole reason the placeholder is typed at all — impossible to write
 * against the wrong block and have it pass.
 */
export type BlockPlaceholder = { _type: string } & Record<string, unknown>

/** Every knob one block declares. */
export type BlockKnobs = {
  /** The Sanity type name — `heroSection`. */
  type: string
  title: string
  tier: BlockTier
  knobs: readonly Knob[]
  /**
   * What an editor gets when they insert this block from the canvas. Absent
   * means the block is not offered by the insert menu — see `placeholder.ts`
   * for the commit-safety rule that governs what may go in one.
   */
  placeholder?: BlockPlaceholder
  /**
   * The block's arrays whose members declare knobs of their own, keyed by the
   * block-relative field name — `screens`.
   *
   * Declared here rather than in a registry keyed on the member's `_type`,
   * because a member name is local to its array and two blocks can collide on
   * one (ADR 0021). A hovered item already knows its block and the array it
   * sits in, so the host answers the lookup and the collision cannot happen.
   */
  items?: Readonly<Record<string, ItemKnobs>>
}

/**
 * Anything a knob path is relative to: a block, or one member of its arrays.
 *
 * Every query in this package takes one of these, because the questions they
 * answer — what applies here, what is it set to, what does a gate read — are
 * the same questions at either root.
 */
export type KnobRoot = BlockKnobs | ItemKnobs

/**
 * Reads a path **relative to the knob root** out of whatever the consumer
 * has: a document snapshot in the preview, a fixture in Storybook, the form's
 * `parent` in the Studio. The root is the block for a `BlockKnobs` and the
 * hovered member for an `ItemKnobs`.
 *
 * A reader rather than a value object, because a compound gate reads more than
 * one path and the caller cannot know how many before it has looked at the
 * gate.
 */
export type KnobReader = (relPath: string) => unknown

/** What a control displays for a knob's stored value. */
export type KnobValue = {
  /** The option to check; absent when nothing resolved. */
  value?: string
  title: string
  /** The value was inherited rather than chosen. */
  isDefault: boolean
}

/** A knob that survived every gate, with its current value already resolved. */
export type ResolvedKnob = {
  knob: Knob
  surface: KnobSurface
  current: KnobValue
}
