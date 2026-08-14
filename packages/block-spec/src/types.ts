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

/** One member of a knob's closed value set. */
export type KnobOption = {
  /** What is stored in the document. */
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

/** Every knob one block declares. */
export type BlockKnobs = {
  /** The Sanity type name — `heroSection`. */
  type: string
  title: string
  tier: BlockTier
  knobs: readonly Knob[]
}

/**
 * Reads a path **relative to the block root** out of whatever the consumer
 * has: a document snapshot in the preview, a fixture in Storybook, the form's
 * `parent` in the Studio.
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
