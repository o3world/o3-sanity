/**
 * GROQ path arithmetic for the canvas overlay.
 *
 * Presentation hands every hovered element a `SanityNode.path`: a string like
 * `sections[_key=="abc"].panels[_key=="p1"].heading`. These parse it, resolve
 * it against a document snapshot, and answer the two structural questions the
 * toolbar asks — which block am I in, and which of its items.
 *
 * Kept dependency-free on purpose. `@sanity/mutate` consumes the same string
 * form directly, so nothing here is needed for writes; it is a read vocabulary
 * that a unit test can compile without a browser or a Studio.
 */

export type GroqPathSegment = string | { _key: string }

const SEGMENT = /^([A-Za-z_][A-Za-z0-9_]*)(\[_key=="([^"]+)"\])?$/

/** `sections[_key=="a"].heading` → `['sections', {_key:'a'}, 'heading']` */
export function parseGroqPath(path: string): GroqPathSegment[] {
  if (path === '') return []
  const out: GroqPathSegment[] = []
  for (const part of path.split('.')) {
    const m = SEGMENT.exec(part)
    if (!m) return [] // unknown syntax (a numeric index) — treat as unresolvable
    out.push(m[1]!)
    if (m[3]) out.push({ _key: m[3] })
  }
  return out
}

/**
 * Value at `path` under `root`, or undefined as soon as a segment misses.
 *
 * UNPARSEABLE IS NOT THE ROOT. `parseGroqPath` reports "I do not know this
 * syntax" as an empty list, which is also what the empty path legitimately
 * produces — so without the guard below the loop body never runs and
 * `resolveGroqPath(doc, 'sections[0].heading')` hands back the WHOLE DOCUMENT
 * instead of undefined. That reached two live callers: `typeAt` in
 * CanvasToolbar, where only `typeName`'s `typeof === 'string'` check stood
 * between a document and a component name, and `blockKnobReader` for any
 * composed path that failed to parse. `keyedItemParts` guards against the same
 * thing by hand a few lines down, which is the tell that the guard belongs
 * here instead.
 */
export function resolveGroqPath(root: unknown, path: string): unknown {
  const segments = parseGroqPath(path)
  if (path !== '' && segments.length === 0) return undefined
  let current: unknown = root
  for (const segment of segments) {
    if (current == null) return undefined
    if (typeof segment === 'string') {
      current = (current as Record<string, unknown>)[segment]
    } else {
      current = Array.isArray(current)
        ? current.find((item) => (item as { _key?: string } | null)?._key === segment._key)
        : undefined
    }
  }
  return current
}

/**
 * The longest prefix ending in a keyed segment — the innermost array **item**
 * the path sits inside.
 *
 *   `sections[_key=="a"].panels[_key=="b"].heading` → the panel
 *   `sections[_key=="a"].heading`                   → the block
 *   `sections`                                      → undefined
 *
 * This is the identity chip's subject, and it is the same innermost-item rule
 * Presentation's own context menu uses — extended to elements (a header, a
 * stega'd run of text) whose own paths are not keyed.
 */
export function nearestArrayItemPath(path: string): string | undefined {
  const m = /^(.*\[_key=="[^"]+"\])(?:\.|$)/.exec(path)
  return m?.[1]
}

/**
 * The **block root**: the keyed item of a document-level array that a
 * dispatched block occupies. `sections[_key=="a"].panels[_key=="b"].heading`
 * → `sections[_key=="a"]`.
 *
 * The *first* keyed segment, not a search for a known array name. Every block
 * in this repo is a keyed item of a root array — `page.sections`,
 * `caseStudy.story` — so depth decides it and no list of field names has to be
 * kept in step with the schema. That is also what makes the rule survive
 * `layoutSection`, whose columns nest blocks inside blocks: the enclosing band
 * stays the outermost keyed segment either way.
 *
 * Undefined when the path has no keyed segment at all — the `sections`
 * container itself, or a plain document field. Neither is a block, and the
 * toolbar does not attach to them.
 */
export function blockRootPath(path: string): string | undefined {
  const m = /^[A-Za-z_][A-Za-z0-9_]*\[_key=="[^"]+"\]/.exec(path)
  return m?.[0]
}

/** An array item's own two coordinates: the array it sits in, and its key. */
export interface KeyedItemParts {
  /** The PARENT array's path — what an item action patches. */
  arrayPath: string
  key: string
}

/**
 * Split a keyed item's path into the array that holds it and its own key:
 * `sections[_key=="a"].panels[_key=="b"]` → `sections[_key=="a"].panels` + `b`.
 *
 * Undefined for anything that is not itself an array item — a field
 * (`sections[_key=="a"].heading`), a container (`sections`), a numeric index.
 * Item actions patch the PARENT array (#111), so this is the one question they
 * have to ask about a path, and asking it here rather than by string surgery at
 * the call site is what keeps the parse in one place.
 *
 * The prefix is greedy, so the LAST keyed segment is the item and everything
 * before it is the array. A nested item therefore resolves against its own
 * array rather than the document's.
 */
export function keyedItemParts(path: string): KeyedItemParts | undefined {
  const m = /^(.+)\[_key=="([^"]+)"\]$/.exec(path)
  if (!m) return undefined
  const arrayPath = m[1]!
  // The prefix has to be a path we can resolve. `parseGroqPath` returns an
  // empty list for syntax it does not know, and an unresolvable array path
  // would aim a truncate at the document root.
  if (parseGroqPath(arrayPath).length === 0) return undefined
  return { arrayPath, key: m[2]! }
}

/** Where an array hangs: the thing that owns it, and what it is called there. */
export interface ArrayHostParts {
  /**
   * The path of the type-bearing thing the array is a field of — a block for a
   * nested array, and the EMPTY STRING for one on the document itself. Empty
   * rather than undefined because "the document" is a real host with a real
   * `_type`, and a caller that has to distinguish "no host" from "the root
   * host" ends up with two rules where the address needs one.
   */
  hostPath: string
  /** The array's own field name, relative to that host — `sections`, `panels`. */
  field: string
}

/**
 * Split an array's path into the host that declares it and the field it is:
 * `sections[_key=="a"].panels` → `sections[_key=="a"]` + `panels`.
 *
 * This is what addresses an array's declared members (#112). The overlay knows
 * nothing about any schema, so "what does this array accept" has to be looked
 * up — and the only key that cannot collide is the host's `_type` plus the
 * field name, both of which are already in hand: the type from the draft
 * snapshot, the field from here. A bare field name would not do, for the same
 * reason ADR 0021 refused a registry keyed on a member's `_type` — `items` is a
 * plausible field on more than one type, and the wrong roster on the
 * right-looking band is a live editorial surface offering the wrong content.
 *
 * Undefined for anything that is not `<path>.<identifier>` or a bare
 * identifier. A trailing keyed segment cannot match, which is what keeps a
 * `_key` containing a dot from being read as a field boundary.
 */
export function arrayHostParts(arrayPath: string): ArrayHostParts | undefined {
  const m = /^(?:(.*)\.)?([A-Za-z_][A-Za-z0-9_]*)$/.exec(arrayPath)
  if (!m) return undefined
  return { hostPath: m[1] ?? '', field: m[2]! }
}

/**
 * WHICH OF THE BLOCK'S ARRAYS THE HOVERED ITEM SITS IN — the second half of the
 * key that reaches a member's knob declaration (#122).
 *
 *   block `sections[_key=="a"]`, item `sections[_key=="a"].screens[_key=="b"]`
 *     → `screens`
 *
 * The item's `_type` is the obvious key and it is the wrong one: a member name
 * is local to its array, so two blocks may each declare a `screen` and a map
 * keyed on `_type` would have to arbitrate (ADR 0021). The block type is
 * already read from the snapshot, and this is the rest of the address —
 * available from the path the overlay was handed, with nothing to look up.
 *
 * Undefined when the item is not a DIRECT member of one of the block's arrays:
 * an item inside another item is a second root question this does not answer,
 * and returning its outer array would attach the wrong spec.
 */
export function itemArrayField(blockPath: string, itemPath: string): string | undefined {
  const parts = keyedItemParts(itemPath)
  if (!parts) return undefined
  const prefix = `${blockPath}.`
  if (!parts.arrayPath.startsWith(prefix)) return undefined
  const relative = parts.arrayPath.slice(prefix.length)
  // A keyed segment in the remainder means another item stands between this one
  // and the block.
  return relative === '' || relative.includes('[') ? undefined : relative
}

/**
 * EVERY PATH FROM THE CURSOR OUTWARD TO A FLOOR, innermost first.
 *
 *   path  `sections[_key=="a"].panels[_key=="p"].mark.kind`
 *   floor `sections[_key=="a"]`
 *     → the leaf, the mark, the panel — and then it stops.
 *
 * The ancestor chain a resolution walks when the thing it is looking for
 * cannot be recognised from the path alone. Instances are the case (#145): a
 * `mark` is not keyed and its field name is not a type, so the only way to
 * know one is under the cursor is to ask the draft snapshot what `_type` sits
 * at each step — which is a question for a caller holding the snapshot, not
 * for this module. What belongs here is the chain.
 *
 * Every segment is a candidate, keyed ones included: a mark in a layout column
 * is an array member whose own `_type` is the shared object, so a walk that
 * skipped keyed segments would miss the placement the whole thing is for.
 *
 * The floor itself is excluded, and a path that does not sit under it produces
 * nothing — the caller passes the block root, and the block is a component of
 * another kind with its own registry.
 */
export function enclosingPaths(path: string, floor: string): string[] {
  if (floor === '' || !path.startsWith(`${floor}.`)) return []
  const parts = path.split('.')
  const chain: string[] = []
  for (let end = parts.length; end > 0; end--) {
    const prefix = parts.slice(0, end).join('.')
    if (prefix === floor) break
    chain.push(prefix)
  }
  return chain
}

/**
 * A block hosted inside another block's array rather than in a document array
 * — two or more keyed segments in its own root path.
 *
 * Nothing produces one **today**: the only nesting host is `layoutSection.items`,
 * which the overlay cannot attach inside at `sanity@6.8.0` (#115), so it is
 * deliberately unattributed. It is answered here anyway because it is the
 * question `visibleKnobs({nested})` asks — a nested block forms no band, so
 * its band knobs drop — and answering it from the path costs one regex where
 * discovering it later costs a second notion of what a block root is.
 */
export function isNestedBlockGroqPath(blockPath: string): boolean {
  return (blockPath.match(/\[_key==/g) ?? []).length >= 2
}
