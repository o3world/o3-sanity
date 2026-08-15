import { Fragment, type ComponentType, type Ref } from 'react'
import type { ResolvedKnob } from '@o3/block-spec'

import { MENU_COLOR } from './KnobControl'
import { OptionGlyph, type OptionGlyphs } from './OptionGlyph'
import type { ItemAction, ItemActionGroup } from './itemActions'
import { CANVAS_CHROME_ATTR, type KnobMenuAction, type KnobMenuModel } from './menuModel'

/**
 * THE KNOB MENU'S PIXELS — the right-click surface, carrying the subject's
 * complete roster.
 *
 *     ┌──────────────────────────┐
 *     │ Hero section             │  the subject
 *     │ BAND                     │  a group, titled by what it configures
 *     │   Surface                │
 *     │     ✓ Ink                │
 *     │       Bone               │
 *     │ HERO SECTION             │
 *     │   Composition            │
 *     │     ✓ Orbital   default  │
 *     │       Band               │
 *     │   Decoration             │  ← reachable from nowhere before this
 *     ├──────────────────────────┤
 *     │ Duplicate                │  what the stock menu carried, back (#111)
 *     │ Remove                   │
 *     │ MOVE                     │
 *     │   To top                 │  a row exists only when it moves something
 *     │   Down                   │
 *     ├──────────────────────────┤
 *     │ ADD ABOVE                │  what this array accepts (#112), derived
 *     │   Hero                   │
 *     │   Logo wall              │
 *     │   …                      │
 *     │ ADD BELOW                │
 *     │   …                      │
 *     ├──────────────────────────┤
 *     │ All options — open form  │  always last
 *     └──────────────────────────┘
 *
 * THE PANEL SCROLLS, and the insert offer is why. `page.sections` accepts all
 * sixteen section blocks, listed once per position, so the menu on a page band
 * is comfortably taller than a laptop viewport — and `computeMenuDock` clamps
 * by height, so an unbounded panel would be pinned to the top of the screen
 * with its floor still off it. A max height and an inner scroll keeps the
 * "all options — open form" row reachable, which matters most on exactly the
 * menus that are too long.
 *
 * DUPLICATE AND REMOVE CARRY NO GROUP HEADING. Every knob group is titled with
 * the container it configures, so a block knob under a menu headed "Panel"
 * cannot read as something that changes the panel. These rows configure
 * nothing — they act ON the subject, which the menu header names one line
 * above — so a second "Panel" heading under the first would say nothing and
 * cost a line. The group still carries an `aria-label`, because a screen reader
 * does not get the header for free the way an eye does. Move keeps its heading:
 * "Up" on its own is not a sentence.
 *
 * EVERY OPTION IS ONE CLICK, and no row opens a submenu. A submenu inside this
 * overlay would have to be crossed by a pointer that the controller is watching:
 * the hover survives only over chrome, and the diagonal from a parent row to a
 * submenu that opens beside it is the classic place a pointer leaves the parent
 * before it arrives anywhere. Listing the options inline costs vertical space
 * and buys a surface that cannot drop out from under the cursor.
 *
 * Split from the toolbar for the same reason `CanvasToolbarView` is: this repo's
 * render layer mounts client components through `react-dom/server`, so anything
 * that reads a draft is unreachable from a test. Everything here is props.
 *
 * WHAT LOCATES A ROW IS ITS ROLE, not its markup. Options are `menuitemradio`
 * — the correct role for one member of a closed set, and the same role the
 * bar's dropdown already uses — and actions are `menuitem`. A test that counts
 * rows by role keeps working when the markup around them changes.
 */

export interface KnobMenuProps {
  model: KnobMenuModel
  onPick: (knob: ResolvedKnob, value: string) => void
  onAction: (action: KnobMenuAction) => void
  /**
   * Commit one item action. The row already carries its own patches — they were
   * what decided the row exists — so this receives a mutation rather than an
   * instruction to go and build one.
   */
  onItemAction?: (action: ItemAction) => void
  /**
   * Positions the panel at the pointer, flipped into the viewport. Imperative
   * and supplied by the toolbar, which is the half that may touch the DOM —
   * same division as the bar's `barRef` and the chip's `chipRef`.
   */
  panelRef?: Ref<HTMLDivElement>
  /** Name → drawing, for a knob whose options describe themselves as glyphs. */
  glyphs?: OptionGlyphs
}

export function KnobMenu({
  model,
  onPick,
  onAction,
  onItemAction,
  panelRef,
  glyphs,
}: KnobMenuProps) {
  return (
    // `absolute` with no class position: `computeMenuDock` writes `left`/`top`
    // against the overlay wrapper. `pointer-events-auto` because the whole
    // point of this surface is that it takes the pointer.
    <div
      ref={panelRef}
      {...{ [CANVAS_CHROME_ATTR]: '' }}
      data-testid="canvas-menu"
      role="menu"
      aria-label={model.title ?? 'Options'}
      className="pointer-events-auto absolute z-20"
    >
      <div
        style={{ background: MENU_COLOR }}
        className="max-h-[70vh] min-w-44 max-w-72 overflow-y-auto rounded-[3px] py-1 text-white shadow-md"
      >
        {model.title ? (
          <div
            data-testid="canvas-menu-title"
            className="truncate whitespace-nowrap border-b border-white/15 px-2 pb-1 text-[11px] font-semibold"
          >
            {model.title}
          </div>
        ) : null}

        {model.groups.map((group) => (
          <div key={group.surface} role="group" aria-label={group.title}>
            <div className="truncate whitespace-nowrap px-2 pb-0.5 pt-1.5 text-[9px] font-semibold uppercase tracking-wide opacity-60">
              {group.title}
            </div>
            {group.knobs.map((resolved) => (
              <KnobRows
                key={resolved.knob.name}
                resolved={resolved}
                onPick={onPick}
                glyphs={glyphs}
              />
            ))}
          </div>
        ))}

        {/* One rule above the item actions, not one per group — the Move
            heading is its own separation, and a rule directly under the menu
            header (which already draws a border) would double it. */}
        {model.itemActions.length > 0 && model.groups.length > 0 ? <Separator /> : null}
        {model.itemActions.map((group) => (
          <ActionGroup key={group.id} group={group} onItemAction={onItemAction} />
        ))}

        {/* The insert groups act on the subject's ARRAY rather than on the
            subject, so they get their own rule — the first heading under it is
            "Add above", which reads as a new thought rather than a third way
            to move what is already there. */}
        {model.insertActions.length > 0 ? <Separator /> : null}
        {model.insertActions.map((group) => (
          <ActionGroup key={group.id} group={group} onItemAction={onItemAction} />
        ))}

        {model.actions.map((action) => (
          <Fragment key={action.id}>
            <Separator />
            <button
              type="button"
              role="menuitem"
              data-testid="canvas-menu-action"
              onClick={() => onAction(action)}
              className="flex w-full items-center whitespace-nowrap px-2 py-1 text-left text-[11px] hover:bg-white/15 focus:bg-white/15 focus:outline-none"
            >
              {action.title}
            </button>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function Separator() {
  return <div role="separator" className="my-1 border-t border-white/15" />
}

/**
 * One group of rows that carry their own patches — duplicate/remove/move
 * (#111) and add above/below (#112) alike.
 *
 * They share this because they are the same thing to the menu: a row that
 * commits a mutation someone else already built. Which array it lands in and
 * what it puts there is a question answered two files away, and drawing them
 * twice would be two places to get an indent or a role wrong.
 */
function ActionGroup({
  group,
  onItemAction,
}: {
  group: ItemActionGroup
  onItemAction?: (action: ItemAction) => void
}) {
  return (
    <div role="group" aria-label={group.label}>
      {group.title ? (
        <div className="truncate whitespace-nowrap px-2 pb-0.5 pt-1.5 text-[9px] font-semibold uppercase tracking-wide opacity-60">
          {group.title}
        </div>
      ) : null}
      {group.actions.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          data-testid="canvas-menu-item-action"
          onClick={() => onItemAction?.(action)}
          // Indented under a heading, flush without one — the same
          // relationship an option row has to the knob that owns it.
          className={`flex w-full items-center whitespace-nowrap py-1 pr-2 text-left text-[11px] hover:bg-white/15 focus:bg-white/15 focus:outline-none ${
            group.title ? 'pl-4' : 'pl-2'
          }`}
        >
          {action.title}
        </button>
      ))}
    </div>
  )
}

/**
 * One knob: its axis, then every value it can take.
 *
 * The axis is named on its own line rather than folded into each option,
 * because a menu of eight rows in which three read "Default" names nothing —
 * the same failure the bar's trigger label had to undo (#109). It is a nested
 * `group` so the roster is legible to a screen reader in the same shape it is
 * legible on screen.
 */
function KnobRows({
  resolved,
  onPick,
  glyphs,
}: {
  resolved: ResolvedKnob
  onPick: (knob: ResolvedKnob, value: string) => void
  glyphs?: OptionGlyphs
}) {
  const { knob, current } = resolved
  // Structural in `@o3/block-spec` (zero dependencies, cannot name `react`);
  // narrowed to a component here, the same way `KnobControl` does it.
  const Icon = knob.icon as ComponentType<{ className?: string }> | undefined

  return (
    <div role="group" aria-label={knob.title}>
      <div
        title={knob.description}
        className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold opacity-90"
      >
        {Icon ? <Icon className="h-3 w-3 shrink-0" /> : null}
        <span className="truncate">{knob.title}</span>
      </div>
      {knob.options.map((option) => {
        const checked = option.value === current.value
        return (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={checked}
            // "Unset" and "explicitly the default" draw the same page, so the
            // checked row is the same row either way. `(inherited)` is the only
            // thing that tells an editor which one they are looking at, and it
            // has to reach a screen reader as well as an eye.
            aria-label={checked && current.isDefault ? `${option.title} (inherited)` : option.title}
            onClick={() => onPick(resolved, option.value)}
            className={`flex w-full items-center gap-1.5 whitespace-nowrap py-1 pl-4 pr-2 text-left text-[11px] hover:bg-white/15 focus:bg-white/15 focus:outline-none ${
              checked ? 'font-semibold' : ''
            }`}
          >
            <span aria-hidden="true" className="w-2.5 shrink-0 text-[9px]">
              {checked ? '✓' : ''}
            </span>
            <OptionGlyph knob={knob} value={option.value} glyphs={glyphs} />
            <span className={`grow ${checked && current.isDefault ? 'opacity-70' : ''}`}>
              {option.title}
            </span>
            {option.value === knob.initialValue ? (
              <span className="text-[9px] italic opacity-60">default</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
