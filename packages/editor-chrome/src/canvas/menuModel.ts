import { visibleKnobs } from '@o3/block-spec'
import type {
  BlockKnobs,
  ItemKnobs,
  KnobReader,
  KnobSurface,
  ObjectKnobs,
  ResolvedKnob,
} from '@o3/block-spec'

import { insertActionGroups } from './insertActions'
import { itemActionGroups, type ItemActionGroup } from './itemActions'

/**
 * WHAT THE RIGHT-CLICK MENU OFFERS — the composition rules, as a pure function.
 *
 * The bar and the menu are two deliveries of one roster, and the split is the
 * reason both exist (CONTEXT.md → Knob menu). The bar carries the curated
 * subset — `knob.bar`, and nothing else — because it is always on screen and a
 * six-control bar is a wall. The menu carries `visibleKnobs(...).all`: the
 * subject's COMPLETE roster, gated exactly the way the Studio form gates it.
 * `heroSection.decoration` is the live example — it resolves, it applies, and
 * it declares no `bar`, so the menu is the only place on the canvas that offers
 * it.
 *
 * Pure and in-package for the reason ADR 0004 gives: the `unit` vitest project
 * is `.test.ts` only, so anything importing a component is out of its reach.
 * What is left in `KnobMenu.tsx` is markup.
 */

/**
 * THE NO-DEAD-CONTROL RULE, in one sentence: a group is **absent, not empty**,
 * and a row exists exactly when it can do something.
 *
 * It is worth stating as a posture rather than as a nicety. A menu that lists a
 * group with nothing under it, or a row that writes nowhere, teaches an editor
 * that the chrome lies — and then every real control is suspect. A missing
 * control is a smaller failure than a dead one, so when in doubt the group goes.
 */
export interface KnobMenuGroup {
  surface: KnobSurface
  /** What this group configures, in the words the editor already sees on screen. */
  title: string
  /** Never empty: a group with no knobs is not built at all. */
  knobs: readonly ResolvedKnob[]
}

/**
 * The menu's floor — the row that is neither a knob nor an edit to the
 * document. Today there is exactly one and it is always last.
 */
export interface KnobMenuAction {
  id: 'open-form'
  title: string
}

export interface KnobMenuModel {
  /** The subject the menu is about — the item under the cursor, or the block. */
  title?: string
  groups: readonly KnobMenuGroup[]
  /**
   * Duplicate / Remove / Move on the subject — the array actions the Studio's
   * own context menu offers, restated here because this menu preempts it.
   * Absent groups, never empty ones, and empty altogether while the draft
   * snapshot has not resolved the item.
   */
  itemActions: readonly ItemActionGroup[]
  /**
   * Add above / add below (#112), each listing what the subject's array
   * declares it accepts. Its own field rather than more `itemActions` because
   * the two answer different questions — those act on the subject, these add a
   * sibling beside it — and because only this one needs to know what a block
   * is. Same shape, so the view renders both with one loop.
   */
  insertActions: readonly ItemActionGroup[]
  /** Always last, and always non-empty: the jump is the menu's floor. */
  actions: readonly KnobMenuAction[]
}

/**
 * The jump. It is last because it is the escape hatch rather than an option:
 * everything above it is something the canvas can do, and this is the row that
 * admits the canvas cannot do everything.
 */
export const OPEN_FORM_ACTION: KnobMenuAction = {
  id: 'open-form',
  title: 'All options — open form',
}

/**
 * Outside-in, the same order the bar renders in: the band is the largest
 * container, the block sits in it, the item sits in the block, and the instance
 * sits innermost — a mark is inside a panel, which is inside a band. One rule
 * for every surface rather than four orders to keep in step.
 */
const SURFACE_ORDER: readonly KnobSurface[] = ['band', 'block', 'item', 'instance']

export interface KnobMenuSubject {
  /**
   * `item` when a keyed array item sits between the cursor and the block — the
   * panel you right-clicked. `block` when the pointer is in band padding or on
   * a plain field, where the block itself is the innermost keyed item.
   */
  kind: 'block' | 'item'
  /** The subject's own name, for the menu header. Absent while the draft settles. */
  title?: string | undefined
}

/**
 * The menu for one subject.
 *
 * `spec` is undefined for a block that has declared no knobs yet — ADR 0020 is
 * a migration in progress, and a miss means "not converted", never "has none".
 * The menu still opens: the jump row is what it has to offer, and offering it
 * is the honest answer.
 *
 * WHERE THE ITEM AND INSTANCE GROUPS COME FROM. Not from `spec`: an array
 * member and a shared object are each their own knob root (#122, #145), so
 * their options are declared against the member or the component and read with
 * a reader rooted there. `item` and `instance` are the caller's answers to
 * "which one, and what does it currently hold" — absent whenever the cursor is
 * not inside one, which is also why a row here can always name the path it
 * writes.
 *
 * WHY THE BLOCK'S KNOBS STAY WHEN AN ITEM IS THE SUBJECT. The block is still
 * under the cursor — an item is inside it — and the alternative is an editor
 * who right-clicks a panel and has to hunt for the band's padding to reach
 * Surface. Each group is titled with the container it configures, so the menu
 * never claims a block knob belongs to the panel.
 */
export function knobMenuModel({
  spec,
  read,
  nested,
  item,
  instance,
  subject,
  componentName,
  snapshot,
  subjectPath,
  insert,
}: {
  spec: BlockKnobs | undefined
  read: KnobReader
  nested: boolean
  /**
   * The member under the cursor and a reader rooted AT IT — `undefined` on the
   * band, on a plain field, and inside an array whose members declare no knobs.
   * The spec and the reader travel together because a member-relative reader
   * against a block-relative spec is the silent write #122 was filed for.
   */
  item?: { spec: ItemKnobs; read: KnobReader } | undefined
  /**
   * The nearest enclosing shared object that declares knobs, and a reader
   * rooted AT IT (#145) — `undefined` when no such object encloses the cursor,
   * and when the one that does declares none. The spec and the reader travel
   * together for the reason `item`'s do: a reader rooted anywhere else against
   * this spec writes into a field no schema declares.
   */
  instance?: { spec: ObjectKnobs; read: KnobReader } | undefined
  subject: KnobMenuSubject
  /** The block's name — the title of the `block` group, and the header's fallback. */
  componentName?: string | undefined
  /**
   * The draft snapshot, for the item actions (#111) — the same one `read`
   * already closes over, taken whole because an array action needs the
   * subject's SIBLINGS and a knob reader only ever answers about one field.
   */
  snapshot?: unknown
  /**
   * The subject's own GROQ path: `itemPath ?? blockPath`, which is what
   * `canvasSubject` already computes and what `subject.kind` above is derived
   * from. Passed rather than re-derived so there is one rule for what the
   * subject is and not two. Absent means no item actions — which is also the
   * honest answer for a caller that has no document to patch.
   */
  subjectPath?: string | undefined
  /**
   * What the subject's own array accepts, and every block's declaration to
   * build it from (#112). Absent whenever the caller could not address the
   * array or the site declared nothing for it — which is the honest answer for
   * an array nobody has said is a composition surface, and the reason the menu
   * offers no insert rows there rather than a guess.
   */
  insert?: { members: readonly string[]; specs: Readonly<Record<string, BlockKnobs>> } | undefined
}): KnobMenuModel {
  // `.all` and not `bySurface`: the menu's roster IS the complete roster, and
  // reading the flat list keeps that visible. The grouping below is a
  // presentation of it, so nothing can be delivered that the roster does not
  // contain.
  const all = spec ? visibleKnobs({ spec, read, nested }).all : []
  // Resolved against the member, so one screen's `tone` reads that screen's
  // value and a gate on a sibling is an ordinary same-root gate.
  const itemKnobs = item ? visibleKnobs({ spec: item.spec, read: item.read }).all : []
  // Resolved against the instance, so a mark inside a panel reads that mark's
  // own `kind` and its gates are ordinary same-root gates — the same sentence
  // as above, at the root a component owns rather than a host.
  const instanceKnobs = instance
    ? visibleKnobs({ spec: instance.spec, read: instance.read }).all
    : []

  const titles: Record<KnobSurface, string | undefined> = {
    // The band is the full-width strip the block occupies (CONTEXT.md → Knobs).
    // It has no name of its own, and "Band" is what the repo calls it.
    band: 'Band',
    block: componentName,
    item: subject.kind === 'item' ? subject.title : undefined,
    // The COMPONENT's title, not the subject's. An instance is named by what it
    // is — "Mark" — wherever it was placed, which is the same thing its spec
    // being keyed by type name says.
    instance: instance?.spec.title,
  }

  const groups: KnobMenuGroup[] = []
  for (const surface of SURFACE_ORDER) {
    if (surface === 'item' && subject.kind !== 'item') continue
    const knobs =
      surface === 'item'
        ? itemKnobs
        : surface === 'instance'
          ? instanceKnobs
          : all.filter((resolved) => resolved.surface === surface)
    if (knobs.length === 0) continue
    groups.push({ surface, title: titles[surface] ?? humanSurface(surface), knobs })
  }

  return {
    title: subject.title ?? componentName,
    groups,
    itemActions: subjectPath
      ? itemActionGroups({ snapshot, itemPath: subjectPath, subjectTitle: subject.title })
      : [],
    insertActions:
      subjectPath && insert
        ? insertActionGroups({ snapshot, itemPath: subjectPath, ...insert })
        : [],
    actions: [OPEN_FORM_ACTION],
  }
}

const SURFACE_FALLBACKS: Record<KnobSurface, string> = {
  band: 'Band',
  block: 'Block',
  item: 'Item',
  // "Component" rather than "Instance": an editor reading a group header wants
  // the kind of thing they are configuring, and the instance's real name — the
  // component's title — replaces this as soon as the snapshot settles.
  instance: 'Component',
}

/**
 * The last-resort group title, for the window between the first hover and the
 * draft snapshot settling. A group titled by its surface still says what it
 * configures; an untitled one says nothing.
 *
 * A total map rather than a chain of ternaries, so a new surface is a compile
 * error here instead of silently reading as "Block".
 */
function humanSurface(surface: KnobSurface): string {
  return SURFACE_FALLBACKS[surface]
}

/**
 * Marks a surface a pointerdown may land on WITHOUT dismissing an open menu:
 * the bar (which contains every trigger and every dropdown) and the knob menu's
 * own panel.
 *
 * **The opener is exempt, and this attribute is how.** Without it, a click on
 * the trigger of an open dropdown is a dismiss immediately followed by the
 * trigger's own re-open — the menu blinks and the button that is supposed to
 * toggle never appears to do anything. Putting the attribute on the BAR rather
 * than on each trigger exempts the openers and their menus in one stroke, and
 * there is no ref to thread through the view to do it.
 */
export const CANVAS_CHROME_ATTR = 'data-canvas-chrome'

/** What the walk below needs from an element, and no more. */
export interface ChromeNode<T> {
  hasAttribute(name: string): boolean
  readonly parentElement: T | null
}

/**
 * Does a pointerdown here dismiss an open menu? Everything outside our chrome
 * does; everything inside it does not.
 *
 * Structurally typed so the `unit` project (Node, no `document`) can test the
 * rule with a three-line fake. `Element` satisfies `ChromeNode<Element>`.
 */
export function dismissesMenu<T extends ChromeNode<T>>(from: T | null): boolean {
  for (let element = from; element; element = element.parentElement) {
    if (element.hasAttribute(CANVAS_CHROME_ATTR)) return false
  }
  return true
}
