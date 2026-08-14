import { newBlockContent } from '@o3/block-spec'
import type { BlockKnobs } from '@o3/block-spec'
import type { NodePatch } from '@sanity/mutate'

import { arrayHostParts, keyedItemParts, parseGroqPath, resolveGroqPath } from './groqPath'
import { locateArrayItem, randomKey, type ItemAction, type ItemActionGroup } from './itemActions'

/**
 * ADD A SECTION ABOVE, ADD A SECTION BELOW (#112) — the third of the knob
 * menu's three jobs, and the only one that needs a per-block artifact.
 *
 * WHAT THE MENU OFFERS IS DERIVED, and this file is where that claim is either
 * true or a slogan. The offer is the ARRAY'S OWN DECLARED MEMBERS, looked up by
 * `<host type>.<field>` — an address the overlay already holds, because the
 * host's `_type` is in the draft snapshot and the field is in the path. The
 * site hands the map in through `createCanvasComponents`, the same way it hands
 * in the knob declarations, and in this repo that map is built from
 * `SECTION_BLOCKS` / `BASE_BLOCKS` with the schema's own `of:` derived from it.
 *
 * There is deliberately **no list of what may not be inserted.** The prior art
 * carried `NON_REPEATABLE_TYPES` and `NOT_INSERTABLE_TYPES` beside a constant
 * per array name — four hand-kept mirrors of schema facts, each free to drift,
 * and the direction of the drift is always the same: the menu offers something
 * the array does not take, or hides something it does. Here an array's members
 * are the offer, and the only thing that can narrow it is a member with nothing
 * to insert (see `newBlockContent`) — which is a block declaring no
 * placeholder, and `@o3/sanity`'s `placeholder.test.ts` asserts none does.
 *
 * ⚠️ **AN INSERTED SECTION LIVES ONLY IN THE DATASET.** The committed JSON
 * under `tools/migration/data/` is the source of truth while the site is being
 * built out (ADR 0003), and `load` recreates every unlocked pipeline-owned
 * document from it — so a section added here is gone the next time anyone runs
 * the pipeline, unless it is either seeded into the JSON or the document is
 * locked from Studio. That is not a bug in this feature and it is not
 * something the canvas can warn about from inside an iframe; it is written
 * here, and beside the report in `tools/migration/src/verify.ts`, because those
 * are the two files the first person to lose one will open.
 *
 * The patch itself is the stock `insert`, referenced by the subject's own
 * `_key` rather than by index, for the reason `itemActions.ts` gives at
 * length: a concurrent insert earlier in the array must not land the new
 * section beside the wrong neighbour.
 *
 * AN INSERT LANDS ON THE ROUND-TRIP, NOT OPTIMISTICALLY, and that is the
 * existing behaviour rather than something this ticket chose.
 * `reconcileOptimisticOrder` re-maps the echo's ORDER onto blocks the renderer
 * already holds — a key it has never seen has no rich block behind it, so the
 * run's keys stop being contiguous and the reducer holds still until the
 * mutation refresh. Duplicate has done exactly this since #111. Rendering a
 * stub instead would draw an empty band for a beat, which is a worse picture
 * than a late one.
 */

/** Above the subject, or below it. There is no third place to put a section. */
export type InsertPosition = 'before' | 'after'

/** One thing the menu can add here: what an editor reads, and what it writes. */
export interface InsertOffer {
  /** The block's Sanity type — `heroSection`. */
  type: string
  /** The block's own title, from its declaration. */
  title: string
  /** A fresh, commit-safe body, keys already minted. */
  content: Record<string, unknown>
}

/**
 * THE ADDRESS OF THE ARRAY THE SUBJECT SITS IN — `page.sections`.
 *
 * Read from the snapshot and the path and nothing else, so it is as
 * order-independent as the block lookup beside it: whichever element the
 * pointer lands on first, the answer is the same.
 *
 * Undefined whenever any part of that is not in hand — the subject is not an
 * array item, the snapshot has not settled, the host carries no `_type`. All of
 * them mean the same thing to the menu, which is that it offers no insert rows
 * rather than guessing at a roster.
 */
export function blockArrayKey(snapshot: unknown, itemPath: string): string | undefined {
  const parts = keyedItemParts(itemPath)
  if (!parts) return undefined
  const host = arrayHostParts(parts.arrayPath)
  if (!host) return undefined
  // The document is a host like any other, and its `_type` is at the root.
  const hostType = resolveGroqPath(
    snapshot,
    host.hostPath === '' ? '_type' : `${host.hostPath}._type`,
  )
  return typeof hostType === 'string' ? `${hostType}.${host.field}` : undefined
}

/**
 * What an array accepts, as rows the menu can build.
 *
 * In the array's own declared order, so the menu reads the way the Studio's
 * "add item" list does. A member with no declaration, or a declaration with no
 * placeholder, is skipped: a row that inserted an empty object would leave an
 * editor with a band that renders nothing and no way to tell whether the block
 * or the click was broken.
 *
 * Own-property guarded, because a type name comes from a declaration the site
 * supplies and `constructor` would otherwise resolve to something off
 * `Object.prototype` — the same guard the block lookup already keeps.
 */
export function insertOffers({
  members,
  specs,
}: {
  members: readonly string[]
  specs: Readonly<Record<string, BlockKnobs>>
}): readonly InsertOffer[] {
  const offers: InsertOffer[] = []
  for (const type of members) {
    if (!Object.prototype.hasOwnProperty.call(specs, type)) continue
    const spec = specs[type]!
    const content = newBlockContent({ spec, newKey: randomKey })
    if (!content) continue
    offers.push({ type, title: spec.title, content })
  }
  return offers
}

/**
 * A new member, beside the subject.
 *
 * `insert` against the parent array with the subject's `_key` as the reference
 * — one patch, the same op the stock menu's duplicate emits, and never a
 * whole-array `set`. The comment in `itemActions.ts` explains why that matters
 * and it applies here unchanged: a `set` claims every item changed, so two
 * editors adding two sections in the same second resolve as one clobbering the
 * other.
 *
 * Undefined when the subject cannot be found in the snapshot, which is the same
 * answer for the same four reasons every builder in this feature gives.
 */
export function insertItemPatch(
  snapshot: unknown,
  itemPath: string,
  position: InsertPosition,
  content: Record<string, unknown>,
): NodePatch[] | undefined {
  const found = locateArrayItem(snapshot, itemPath)
  if (!found) return undefined

  return [
    {
      path: parseGroqPath(found.arrayPath),
      op: {
        type: 'insert',
        referenceItem: { _key: found.key },
        position,
        items: [{ ...content, _key: randomKey() }],
      },
    },
  ]
}

/**
 * ONE GROUP PER POSITION, each listing everything the array takes.
 *
 * "Above" and "below" are the grouping, and the types are the rows, which is
 * the only shape available: the knob menu opens no submenus (see
 * `KnobMenu.tsx` — a submenu inside this overlay can drop out from under a
 * pointer crossing to it), so a picker has to be inline, and a picker that is
 * inline has to be listed once per position. On `page.sections` that is
 * sixteen rows twice, which is why the panel scrolls.
 *
 * The alternative was one list plus a separate position control. It is two
 * clicks for the thing an editor came here to do once, and it makes "add
 * above" a mode rather than an action.
 */
export function insertActionGroups({
  snapshot,
  itemPath,
  members,
  specs,
}: {
  snapshot: unknown
  /** The innermost keyed item under the cursor — the same subject the item actions act on. */
  itemPath: string
  /** What this array declares it accepts, in declared order. */
  members: readonly string[]
  /** Every block's declaration, for the title and the placeholder. */
  specs: Readonly<Record<string, BlockKnobs>>
}): readonly ItemActionGroup[] {
  const offers = insertOffers({ members, specs })
  if (offers.length === 0) return []

  const groups: ItemActionGroup[] = []
  for (const [position, title] of [
    ['before', 'Add above'],
    ['after', 'Add below'],
  ] as const) {
    const actions: ItemAction[] = []
    for (const offer of offers) {
      const patches = insertItemPatch(snapshot, itemPath, position, offer.content)
      if (patches)
        actions.push({ id: `insert-${position}-${offer.type}`, title: offer.title, patches })
    }
    // Absent, never empty — the same rule every group in this menu follows.
    if (actions.length > 0) groups.push({ id: `insert-${position}`, title, label: title, actions })
  }
  return groups
}
