import { storedValue } from './optionValue'
import type { BlockKnobs, BlockPlaceholder, KnobRoot } from './types'

/**
 * WHAT A NEWLY INSERTED BLOCK STARTS WITH (#112) — and the one rule that makes
 * it safe to write.
 *
 * A **placeholder is commit-safe**: it is content that may land in a real
 * document, published, in front of a reader, without anybody having reviewed
 * it. That is not a caveat on the feature, it is the feature — an insert that
 * produced an empty shell would leave an editor staring at a band with nothing
 * in it and no way to tell whether the block or the click was broken.
 *
 * Two consequences follow, and neither is negotiable:
 *
 * - **A document reference is never allowed.** A placeholder that points at a
 *   client, a case study or a person asserts a relationship nobody authored,
 *   and it survives publication looking exactly like an authored one.
 *   `defineBlockKnobs` refuses it at declaration time, so the Studio does not
 *   start with one in it.
 * - **An asset reference is allowed only against a seeded asset.** An image
 *   the dataset does not hold renders as a broken tile in production; one the
 *   pipeline seeded is there in every environment. This module reports asset
 *   references and where they sit; only something holding the seeded-asset
 *   manifest can check them, so the check lives in `tools/migration`.
 *
 * THE OTHER FIXTURE IS NOT THIS ONE. Every block also carries a story-complete
 * fixture — the `fixture` const in its `.stories.tsx`, written to exercise the
 * design with real-looking copy, references and images. That one is demo copy
 * and must never reach a document. They are deliberately spelled apart —
 * `placeholder` on the declaration, `fixture` in the story — because the
 * failure mode of confusing them is publishing demo copy as real content.
 */

/** A `_ref` this walk found, and the path it sits at. */
interface PlaceholderReference {
  /** Dot/bracket path from the placeholder root — `panels[0].media.image.asset`. */
  path: string
  /** The `_ref` value itself. `image-abc-100x100-png` for an asset. */
  ref: string
}

export interface PlaceholderReferences {
  /** Never allowed. A reference to a document the placeholder did not author. */
  document: readonly PlaceholderReference[]
  /** Allowed against a seeded asset, and only then. */
  asset: readonly PlaceholderReference[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Every `_ref` in a placeholder, split by the only thing that distinguishes the
 * two kinds: **where it sits**.
 *
 * Sanity spells an asset reference and a document reference identically —
 * `{_type: 'reference', _ref: '…'}` — and the difference is the field holding
 * it. An `image` or `file` puts its reference under `asset`; everything else
 * that carries one is pointing at a document. So position decides, which is a
 * fact this package can read without knowing a single schema.
 *
 * A reference is a leaf here: nothing inside one is worth walking, and
 * descending into it would report the same `_ref` twice.
 */
export function placeholderReferences(value: unknown): PlaceholderReferences {
  const document: PlaceholderReference[] = []
  const asset: PlaceholderReference[] = []

  const walk = (node: unknown, path: string, underAsset: boolean): void => {
    if (Array.isArray(node)) {
      node.forEach((entry, index) => walk(entry, `${path}[${index}]`, false))
      return
    }
    if (!isRecord(node)) return
    if (typeof node._ref === 'string') {
      ;(underAsset ? asset : document).push({ path, ref: node._ref })
      return
    }
    for (const [key, child] of Object.entries(node)) {
      walk(child, path === '' ? key : `${path}.${key}`, key === 'asset')
    }
  }

  walk(value, '', false)
  return { document, asset }
}

/**
 * The values a block's own knobs would have been created with.
 *
 * **Derived, not restated.** A placeholder declares CONTENT — headings, prose,
 * the two panels a rail needs to be a rail — and says nothing about design
 * options, because the knob declaration already answers for those and a second
 * copy of every `initialValue` is a mirror that drifts (ADR 0020's whole
 * argument, applied to one more artifact).
 *
 * It has to be applied by the inserter rather than left to Sanity, and that is
 * the part worth remembering: **`initialValue` is a form behaviour.** Sanity
 * writes it when the Studio's array input creates an item, and a canvas insert
 * is a plain `insert` patch that goes nowhere near the form. Without this, a
 * block added from the canvas and the same block added from the form would
 * differ in every knob — the form's would say "Ink", the canvas's would say
 * "Ink (inherited)", and the two surfaces would disagree about a document they
 * both just created.
 */
export function initialKnobValues(root: KnobRoot): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const knob of root.knobs) {
    if (knob.initialValue === undefined) continue
    const segments = knob.name.split('.')
    let container = out
    for (const segment of segments.slice(0, -1)) {
      const next = container[segment]
      container = isRecord(next) ? next : ((container[segment] = {}) as Record<string, unknown>)
    }
    container[segments[segments.length - 1]!] = storedValue(knob, knob.initialValue)
  }
  return out
}

/**
 * A fresh copy of `value` with every `_key` replaced.
 *
 * A placeholder's nested keys are authored — `panels[0]._key` is spelled in the
 * declaration, because the generated type requires one and a literal is the
 * only thing that typechecks. Shipping those literals as-is would put the same
 * key on every rail panel in the dataset: harmless, since a `_key` only has to
 * be unique inside its own array, and wrong to read, since every other key
 * beside it came from `randomKey()`.
 *
 * DEEP, unlike the duplicate action's re-key, and for the opposite reason. A
 * duplicate stays byte-comparable with the item it copied, so its children keep
 * their keys. A placeholder is new content that has never been anywhere, so
 * nothing is gained by making two inserts of it identical.
 */
function withFreshKeys<T>(value: T, newKey: () => string): T {
  if (Array.isArray(value)) return value.map((entry) => withFreshKeys(entry, newKey)) as T
  if (!isRecord(value)) return value
  const out: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    out[key] = key === '_key' ? newKey() : withFreshKeys(child, newKey)
  }
  return out as T
}

/**
 * The document content one insert writes — the placeholder, its block's knob
 * defaults under it, and a `_type`.
 *
 * `undefined` for a block that declares no placeholder, which is the same
 * answer every builder in this feature gives when it has nothing to do: the
 * caller offers no row rather than an insert that produces an empty object.
 * Nothing reaches that branch today (`placeholder.test.ts` in `@o3/sanity`
 * asserts every section block declares one) and it is not an error state
 * — a block declared outside this repo may well have none.
 *
 * The knob defaults go UNDER the placeholder, so a block whose starting look is
 * deliberately not its default can say so and win.
 *
 * `newKey` is injected rather than generated here for the reason everything in
 * this package is: `@o3/block-spec` has zero dependencies and its tests run in
 * the `unit` project, so a builder that reached for `crypto` would be one that
 * could not be asserted against a fixed output.
 */
export function newBlockContent({
  spec,
  newKey,
}: {
  spec: BlockKnobs
  newKey: () => string
}): Record<string, unknown> | undefined {
  if (!spec.placeholder) return undefined
  const content: Record<string, unknown> = {
    ...initialKnobValues(spec),
    ...spec.placeholder,
    _type: spec.type,
  }

  // A MEMBER GETS ITS OWN DEFAULTS TOO. An array member is its own knob root
  // (ADR 0021), so a screen's `tone` is nowhere in the block's roster and the
  // merge above cannot reach it. Same argument as for the block: a screen
  // added from the form is created with `tone: 'ink'`, so a screen added from
  // the canvas has to be as well or the two surfaces disagree about a member
  // they both just created.
  for (const [field, itemSpec] of Object.entries(spec.items ?? {})) {
    const members = content[field]
    if (!Array.isArray(members)) continue
    const defaults = initialKnobValues(itemSpec)
    content[field] = members.map((member) =>
      isRecord(member) ? { ...defaults, ...member } : member,
    )
  }

  return withFreshKeys(content, newKey)
}

/**
 * Does this array item still carry, verbatim, everything its block's
 * placeholder declared?
 *
 * THIS IS HOW PLACEHOLDER CONTENT IS FOUND LATER (#112), and it reuses the
 * `provisional` vocabulary `tools/migration` already has rather than inventing
 * a second one: `verify` lists what this matches under the same "not
 * authoritative, clear before launch" heading it lists provisional documents
 * under. A marker field was the alternative and it would have meant a schema
 * change on every block — a field in the form, in `generated.ts` and in
 * every renderer's props, to say something the content itself already says.
 *
 * **A SUBSET MATCH, and keys are ignored.** Subset, so an editor who picks a
 * surface or fills in the references the placeholder could not supply has not
 * hidden the copy that is still placeholder copy. Keys ignored, because
 * `newBlockContent` mints fresh ones and comparing them would match nothing.
 *
 * The limit is deliberate and worth saying out loud: **an edited placeholder is
 * content.** Change one word of the heading and this stops matching, which is
 * the right answer — someone looked at it and made it theirs. What this finds
 * is the block nobody came back to.
 */
export function retainsPlaceholder(item: unknown, placeholder: BlockPlaceholder): boolean {
  return containsSubset(item, placeholder)
}

function containsSubset(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return false
    return expected.every((entry, index) => containsSubset(actual[index], entry))
  }
  if (isRecord(expected)) {
    if (!isRecord(actual)) return false
    return Object.entries(expected).every(
      ([key, child]) => key === '_key' || containsSubset(actual[key], child),
    )
  }
  return actual === expected
}
