import type { NodePatch } from '@sanity/mutate'

import { keyedItemParts, parseGroqPath, resolveGroqPath } from './groqPath'

/**
 * DUPLICATE, REMOVE AND MOVE, on the keyed array item under the cursor (#111).
 *
 * GENERIC ARRAY PLUMBING, and nothing else. These take a GROQ path and a
 * document snapshot; they take no knob, no spec, and no block type. A block in
 * `page.sections` and a panel in `railPanelsSection.panels` are the same shape
 * of problem — a keyed member of an array — and the subject is whichever of
 * them the cursor is innermost inside. That subject is `canvasSubject`'s
 * `itemPath ?? blockPath` and there is deliberately no second rule for it here.
 *
 * WHY THESE EXIST AT ALL. Presentation ships its own context menu with the same
 * four actions, but it fires only where the hovered element's own path ends in
 * a keyed segment. Once #107 attributes bands, headers and inner elements, the
 * stock menu survives only in whatever whitespace the block element is still
 * hover-top for — arbitrary, and it looks broken. #110 preempts it outright, so
 * these actions have to come back.
 *
 * THE PATCHES MIRROR THE STOCK ONES EXACTLY, op for op, read from
 * `@sanity/visual-editing@5.7.3`'s own `mutations.js`:
 *
 *   duplicate  insert({_key}, 'after')       one patch
 *   remove     truncate(i, i + 1)            one patch
 *   move       truncate(i, i + 1)            two patches, applied in order
 *              + insert(index, before|after)
 *
 * `truncate` + `insert` against the parent array, never a whole-array `set`.
 * This is not a stylistic preference: a `set` of the whole array is one
 * mutation that claims every item changed, so two editors moving two different
 * sections in the same second resolve as one clobbering the other, and the
 * document history records a rewrite where a reorder happened. The stock menu
 * and ours have to agree about that or the same action means two things
 * depending on which menu produced it.
 *
 * The insert's reference is a NUMERIC INDEX for a move and the item's own KEY
 * for a duplicate — again exactly what the stock builders do. A move's indices
 * are read against the array AS TRUNCATED, because the two patches apply in
 * order: after removing index `i`, "after `i`" is the slot the next item used
 * to occupy. That off-by-one is the whole reason these are tested against an
 * applier rather than only against their own output.
 *
 * EVERY BUILDER RETURNS `undefined` RATHER THAN AN EMPTY LIST when there is
 * nothing to do — the snapshot has not loaded the item, the path is not an
 * array item, or the move is a no-op. The caller closes the menu and patches
 * nothing. Undefined and not `[]` because "no patches" and "a patch list that
 * happens to be empty" are the same value to a commit, and only one of them is
 * a question the row should have been offered for.
 */

export type ItemMove = 'first' | 'previous' | 'next' | 'last'

export type ItemActionId =
  | 'duplicate'
  | 'remove'
  | `move-${ItemMove}`
  // Insert rows are built from an array's declared members (#112), so the type
  // half of the id is only known at runtime. They are the same shape of thing
  // as the rows above — a row carrying its own patches, against the subject's
  // array — which is why they widen this union rather than starting a second.
  | `insert-${'before' | 'after'}-${string}`

/**
 * A duplicate's `_key`, in Sanity's own charset and length: 12 hex characters
 * from `crypto.getRandomValues`, which is `randomKey(12)` from
 * `@sanity/util/content` — the function the Studio's own array input calls
 * sixteen times over.
 *
 * Matching it matters because a `_key` is not private: it is in every URL the
 * Studio's form builder emits, in every `data-sanity` attribute #107 stamps,
 * and in every GROQ path this package parses. A longer or differently-shaped
 * key would still work and would still look wrong beside its siblings.
 *
 * Note this is the one place we do NOT copy `@sanity/visual-editing`, which
 * calls its own `randomKey()` with no argument and therefore emits 32 hex
 * characters — `slice(0, undefined)` returns the whole string. The Studio's
 * length is the one to match; the overlay's is an accident.
 */
export function randomKey(length = 12): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

/** Everything an action needs to know about where the item sits. */
export interface ArrayItemLocation {
  arrayPath: string
  key: string
  index: number
  item: Record<string, unknown>
  /** The parent array's length — what makes "already last" answerable. */
  length: number
}

/**
 * Resolve the item against the draft snapshot, or undefined for every reason a
 * caller has to treat identically.
 *
 * There are four of them and they are all real. The snapshot has not settled
 * (the first frame after a hover); the path is not an array item at all; the
 * parent resolves to something that is not an array; or the item is not in it,
 * which is what a second editor removing it looks like from here. None of them
 * is an error worth reporting and all of them mean the same thing to a menu:
 * offer no row.
 */
export function locateArrayItem(
  snapshot: unknown,
  itemPath: string,
): ArrayItemLocation | undefined {
  const parts = keyedItemParts(itemPath)
  if (!parts) return undefined

  const array = resolveGroqPath(snapshot, parts.arrayPath)
  if (!Array.isArray(array)) return undefined

  const index = array.findIndex((entry) => (entry as { _key?: string } | null)?._key === parts.key)
  if (index === -1) return undefined

  const item: unknown = array[index]
  if (typeof item !== 'object' || item === null) return undefined

  return { ...parts, index, item: item as Record<string, unknown>, length: array.length }
}

/**
 * A copy of the item, immediately after it.
 *
 * SHALLOW, with one field replaced — the stock builder's `{...item, _key}`. A
 * deep re-key is tempting and wrong: a `_key` only has to be unique within its
 * own array, and the copy's nested arrays are new arrays, so the children keep
 * their keys and the duplicate stays byte-comparable with the original
 * everywhere an editor might diff them.
 *
 * `position: 'after'` against the item's own key rather than its index, so a
 * concurrent insert somewhere earlier in the array cannot land the copy beside
 * the wrong item.
 */
export function duplicateItemPatch(snapshot: unknown, itemPath: string): NodePatch[] | undefined {
  const found = locateArrayItem(snapshot, itemPath)
  if (!found) return undefined

  return [
    {
      path: parseGroqPath(found.arrayPath),
      op: {
        type: 'insert',
        referenceItem: { _key: found.key },
        position: 'after',
        items: [{ ...found.item, _key: randomKey() }],
      },
    },
  ]
}

/**
 * The item, gone.
 *
 * `truncate(i, i + 1)` and not `remove({_key})`, because that is the op the
 * stock menu emits and the two have to agree. It is also the op the Studio's
 * own array input emits, so a removal from the canvas and a removal from the
 * form are one entry in the document's history rather than two shapes of one.
 */
export function removeItemPatch(snapshot: unknown, itemPath: string): NodePatch[] | undefined {
  const found = locateArrayItem(snapshot, itemPath)
  if (!found) return undefined

  return [
    {
      path: parseGroqPath(found.arrayPath),
      op: { type: 'truncate', startIndex: found.index, endIndex: found.index + 1 },
    },
  ]
}

/**
 * Where a move puts the item back, expressed against the array AFTER the
 * truncate has taken it out — which is the array the second patch applies to.
 *
 * Undefined is a NO-OP, and it is the only thing that decides whether the row
 * exists. "Up" on the first item and "To top" on the first item are the same
 * non-event; so are "Down" and "To bottom" on the last. An array of one has all
 * four, which is why a single-item array offers no Move group at all.
 */
function moveTarget(
  to: ItemMove,
  index: number,
  length: number,
): { referenceItem: number; position: 'before' | 'after' } | undefined {
  switch (to) {
    case 'first':
      return index === 0 ? undefined : { referenceItem: 0, position: 'before' }
    case 'previous':
      return index === 0 ? undefined : { referenceItem: index - 1, position: 'before' }
    case 'next':
      // After the truncate, the item that WAS at `index + 1` is at `index`.
      // Inserting after `index` therefore lands one slot further down.
      return index === length - 1 ? undefined : { referenceItem: index, position: 'after' }
    case 'last':
      // `-1` is the last element, whatever the length turned out to be.
      return index === length - 1 ? undefined : { referenceItem: -1, position: 'after' }
  }
}

/** Take the item out, put it back somewhere else. Two patches, applied in order. */
export function moveItemPatch(
  snapshot: unknown,
  itemPath: string,
  to: ItemMove,
): NodePatch[] | undefined {
  const found = locateArrayItem(snapshot, itemPath)
  if (!found) return undefined

  const target = moveTarget(to, found.index, found.length)
  if (!target) return undefined

  const arrayPath = parseGroqPath(found.arrayPath)
  return [
    {
      path: arrayPath,
      op: { type: 'truncate', startIndex: found.index, endIndex: found.index + 1 },
    },
    {
      path: arrayPath,
      op: {
        type: 'insert',
        referenceItem: target.referenceItem,
        position: target.position,
        items: [found.item],
      },
    },
  ]
}

/** One row: what it says, and the mutation it is. */
export interface ItemAction {
  id: ItemActionId
  title: string
  /** Never empty — a row is built only from a builder that returned patches. */
  patches: readonly NodePatch[]
}

export interface ItemActionGroup {
  /**
   * `insert-before` / `insert-after` are built by `insertActions.ts` (#112) and
   * share this shape on purpose: an insert row carries its own patches against
   * the subject's array exactly as a duplicate does, so the commit path, the
   * failure reporting and the markup are the ones that already exist.
   */
  id: 'item' | 'move' | 'insert-before' | 'insert-after'
  /**
   * The rendered heading. ABSENT for the subject's own actions, because the
   * menu header one line above already names what "Remove" would remove, and a
   * second "Panel" directly under the first says nothing new.
   */
  title?: string
  /**
   * What a screen reader hears in place of that heading. A group with no
   * visible title is still a group, and "Panel, Duplicate" is the reading the
   * eye gets for free from the header.
   */
  label: string
  /** Never empty: a group with no rows is not built at all. */
  actions: readonly ItemAction[]
}

/**
 * The move rows, in the stock menu's own order and wording. "To top / Up / Down
 * / To bottom" is what an editor who has used Presentation already reads, and
 * ours replaces that menu rather than sitting beside it.
 */
const MOVE_ROWS: readonly { to: ItemMove; title: string }[] = [
  { to: 'first', title: 'To top' },
  { to: 'previous', title: 'Up' },
  { to: 'next', title: 'Down' },
  { to: 'last', title: 'To bottom' },
]

/**
 * THE ROWS, and the no-dead-control rule stated as a tautology: a row exists
 * exactly when its builder returned patches. There is no second list of
 * conditions that could drift from what the builders actually do.
 *
 * WHAT DOES NOT GATE A ROW: schema validation. `railPanelsSection.panels`
 * declares `min(2)` and `statGroup.stats` declares `min(1).max(4)`, so removing
 * from a two-panel section or duplicating a fourth stat produces a document the
 * Studio will flag. Those rows still appear, for three reasons.
 *
 * A control is DEAD when it cannot change the document — not when it produces a
 * document someone will complain about. Remove at the minimum changes the
 * document; Studio's own array input performs it, marks the field invalid, and
 * blocks the publish. Hiding it here would mean the same item is removable from
 * the form and not from the canvas, which teaches an editor that the two
 * surfaces disagree about what their content is.
 *
 * It is also the only way out of a bad item. An editor holding two panels, one
 * of them wrong, fixes it by removing and re-adding. A canvas that refuses the
 * removal has trapped them at exactly the count where they most need it.
 *
 * And this module cannot see validation from where it stands. `validation` is a
 * Studio-side rule builder on the schema; the knob declarations this package
 * does know (`@o3/block-spec`) carry no counts, and reaching the schema would
 * mean the shareable overlay importing this repo's `@o3/sanity`. Restating
 * `min(2)` in a second place is a second source of truth, and it would be wrong
 * within a release of someone editing the first one.
 */
export function itemActionGroups({
  snapshot,
  itemPath,
  subjectTitle,
}: {
  snapshot: unknown
  /** The innermost keyed item under the cursor — `itemPath ?? blockPath`. */
  itemPath: string
  /** The subject's own name, for the group a screen reader cannot read a heading from. */
  subjectTitle?: string | undefined
}): readonly ItemActionGroup[] {
  const groups: ItemActionGroup[] = []

  const own: ItemAction[] = []
  const duplicate = duplicateItemPatch(snapshot, itemPath)
  if (duplicate) own.push({ id: 'duplicate', title: 'Duplicate', patches: duplicate })
  const remove = removeItemPatch(snapshot, itemPath)
  if (remove) own.push({ id: 'remove', title: 'Remove', patches: remove })
  if (own.length > 0) groups.push({ id: 'item', label: subjectTitle ?? 'Item', actions: own })

  const moves: ItemAction[] = []
  for (const { to, title } of MOVE_ROWS) {
    const patches = moveItemPatch(snapshot, itemPath, to)
    if (patches) moves.push({ id: `move-${to}`, title, patches })
  }
  if (moves.length > 0) groups.push({ id: 'move', title: 'Move', label: 'Move', actions: moves })

  return groups
}
