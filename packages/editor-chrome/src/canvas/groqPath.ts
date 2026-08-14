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
