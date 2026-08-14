import { humanize } from '@o3/block-spec'

/**
 * WHAT TO CALL THE THING UNDER THE CURSOR.
 *
 * Nothing on screen said what you were pointing at. Presentation's own tab, at
 * the top-LEFT, carries the DOCUMENT title for every element alike, so a hover
 * deep inside a grid names the page and not the card.
 *
 * IDENTITY COMES FROM THE DRAFT SNAPSHOT — `_type` at the path — and not from
 * the comlink schema node. That is the one place this port deliberately
 * diverges from the prior art, and it is what removes a merging block-ref
 * cache keyed by block path: Presentation serialises a registered block type
 * as an opaque `inline` reference, so an inner hover carries no schema for its
 * enclosing block and the prior art had to remember what a band hover taught
 * it. The stored `_type` is the same answer, available at any zone, in an
 * order-independent way.
 *
 * It is **not** a rescue for attachment. `ElementOverlay.tsx:286` returns an
 * undefined resolver context when the schema cannot resolve the field, and the
 * resolver is then never called at all (#104) — there is no degraded mode to
 * fall back into, and no fallback here pretends otherwise.
 *
 * The comlink ref is still used where it is free and better: when the hovered
 * node IS the subject, its own `field.title` is a resolved schema title
 * ("Person") that beats a humanised `_type` ("Reference"), and it is there
 * before the mutator machine has a snapshot.
 *
 * No stega cleaning: the snapshot is the mutator's raw document rather than a
 * stega-encoded query result, and `_type` is excluded from stega encoding
 * anyway. #109's knob values are read from the same snapshot but compared
 * against declared option values, and that is where cleaning starts to matter.
 */

/** A stored `_type` worth showing — a string, and not the array-of-references machinery. */
function typeName(storedType: unknown): string | undefined {
  if (typeof storedType !== 'string' || storedType === '') return undefined
  // An array of references stores `{_key, _type: 'reference', _ref}`, so the
  // stored type names the mechanism rather than the thing. The array field's
  // own name is closer to what the editor is pointing at.
  if (storedType === 'reference') return undefined
  return storedType
}

/** A path part's field name, whatever subscript follows it: `panels[_key=="b"]` → `panels`. */
const FIELD_NAME = /^([A-Za-z_][A-Za-z0-9_]*)/

/**
 * The last **field** name in a path, subscripts ignored: `panels` for
 * `sections[_key=="a"].panels[_key=="b"]`, `heading` for a header,
 * `headlineLines` for `sections[_key=="a"].headlineLines[0]`. The last-resort
 * label, and the only one available for a slot holding a reference.
 *
 * READS THE PATH, NOT THE PARSE. It used to walk `parseGroqPath`'s output,
 * which rejects a numeric index outright and returns an empty list — so the
 * label was undefined for exactly the paths that have nothing else to fall back
 * on. A stega-encoded run inside `heroSection.headlineLines` arrives as
 * `sections[_key=="a"].headlineLines[0]`: `field` level, no stored `_type`, no
 * schema title, and the identity chip rendered blank rather than "Headline
 * lines". This is a label, not a resolution — an index it cannot resolve is
 * still an index it can read a name off.
 */
export function lastFieldSegment(path: string): string | undefined {
  const parts = path.split('.')
  for (let i = parts.length - 1; i >= 0; i--) {
    const name = FIELD_NAME.exec(parts[i]!)?.[1]
    if (name) return name
  }
  return undefined
}

export interface NameSources {
  /** `_type` at the subject's path in the draft snapshot. */
  storedType?: unknown
  /** The comlink's resolved title — only when the hovered node IS the subject. */
  schemaTitle?: string | undefined
}

/**
 * The component the section bar names — a block's stored `_type`, humanised:
 * `railPanelsSection` → "Rail panels section".
 *
 * The `Section` suffix stays. The prior art trimmed a `Block` suffix because
 * it marked a type as an array member and named nothing an editor was looking
 * at; here the suffix is the tier marker (CONTEXT.md → Type names) — it says
 * this is the full-width strip rather than something inside one — and the bar
 * is docked at exactly that strip's corner.
 *
 * Undefined until something can name it. The bar renders nothing rather than
 * an empty chip: a bar that names no component is worse than no bar, and the
 * snapshot usually settles within a frame of the first hover.
 */
export function componentName({ storedType, schemaTitle }: NameSources): string | undefined {
  const stored = typeName(storedType)
  if (stored) return humanize(stored)
  return schemaTitle || undefined
}

export interface SubjectNameSources extends NameSources {
  /** The subject's own path — a keyed item's, or the hovered field's. */
  path: string
}

/**
 * The identity chip's label: the keyed item under the cursor, or the field the
 * cursor is on when no item sits between it and the block.
 *
 * Prefers the resolved schema title, which names a slot the editor recognises
 * ("Person") where the stored value names the storage ("Reference"); then the
 * stored `_type` ("Panel"); then the array or field name the slot lives in
 * ("People"), which is always available because it is in the path.
 */
export function subjectName({
  path,
  storedType,
  schemaTitle,
}: SubjectNameSources): string | undefined {
  if (schemaTitle) return schemaTitle
  const stored = typeName(storedType)
  if (stored) return humanize(stored)
  const field = lastFieldSegment(path)
  return field ? humanize(field) : undefined
}
