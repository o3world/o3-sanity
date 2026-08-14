import { blockRootPath, isNestedBlockGroqPath, nearestArrayItemPath } from './groqPath'

/**
 * WHAT THE CURSOR IS ON — the whole decision the overlay resolver makes,
 * expressed as a pure function of the hovered element's GROQ path.
 *
 * It is a separate module from the resolver for two reasons. It is the part
 * with rules in it, and it is the part a unit test can reach: the `unit`
 * vitest project is `.test.ts` only, so anything that imports a component is
 * out of its reach by construction (ADR 0004).
 *
 * **No cache, by design.** The prior art keyed a block-reference cache by
 * block path and filled it when the band was hovered — and then needed a
 * cold-cache fallback, because hover order is not guaranteed: after a scroll
 * or a navigation the pointer can already be parked on a panel, so the band
 * never fires a hover and every panel in the section resolved to nothing.
 * Here the subject is derived from the path alone, so there is no order to get
 * wrong and nothing to warm up. What the cache existed to carry — the
 * component's identity — is read from the draft snapshot instead (`_type` at
 * the block path), which the toolbar can do on its own.
 */

/**
 * Which of the three attributed levels (#107) the pointer is on.
 *
 *   `band`  — the dispatch seam's wrapper: the block itself.
 *   `item`  — a keyed member of one of the block's arrays: a panel, a screen.
 *   `field` — anything else under the band: the header, a stega'd run of copy.
 */
export type CanvasLevel = 'band' | 'item' | 'field'

export interface CanvasSubject {
  level: CanvasLevel
  /** The enclosing block's GROQ path — what the section bar names and docks to. */
  blockPath: string
  /**
   * The innermost keyed item under the cursor, when one sits between the
   * hovered element and the block. Absent on the band and on a block-level
   * field, which is what makes "is there an item here" one question.
   */
  itemPath?: string
  /** The block sits in another block's array (#115) — `visibleKnobs` needs it. */
  nested: boolean
}

/**
 * The subject for a hovered path, or undefined where the toolbar does not
 * attach: the `sections` container (Presentation's own reorder target) and
 * plain document fields (`seo.title`) have no block to name.
 *
 * Nothing here inspects a segment *name*. #107 built its paths by composition
 * for the same reason: a portable-text field can be called the same thing as a
 * block array, so a rule that pattern-matches names is a rule that will one
 * day pick the wrong prefix. Depth decides instead.
 */
export function canvasSubject(path: string): CanvasSubject | undefined {
  const blockPath = blockRootPath(path)
  if (!blockPath) return undefined

  const nested = isNestedBlockGroqPath(blockPath)
  if (path === blockPath) return { level: 'band', blockPath, nested }

  const nearest = nearestArrayItemPath(path)
  if (nearest && nearest !== blockPath) {
    return { level: 'item', blockPath, itemPath: nearest, nested }
  }
  return { level: 'field', blockPath, nested }
}
