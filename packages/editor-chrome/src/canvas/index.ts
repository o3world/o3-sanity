/**
 * `@o3/editor-chrome/canvas` — the hover toolbar inside the Presentation
 * preview (CONTEXT.md → Preview).
 *
 * A separate entry from `./toolbar` because of what it drags in: this one
 * imports `@sanity/visual-editing`, and the corner chip on the site must never
 * pay for the overlay runtime. `./studio` splits off `sanity` for the mirror
 * reason. Nothing here is reachable from either.
 *
 * One import, one prop:
 *
 *     import { createCanvasComponents } from '@o3/editor-chrome/canvas'
 *     <VisualEditing components={createCanvasComponents({ blockKnobs: BLOCK_KNOBS })} />
 *
 * The knob declarations are the site's own (ADR 0020) — this package knows the
 * vocabulary and none of the instances.
 */
export { barKnobs, blockKnobReader } from './barKnobs'
export { createCanvasComponents } from './canvasComponents'
export { CanvasToolbar, type CanvasToolbarProps } from './CanvasToolbar'
export { CanvasToolbarView, type CanvasToolbarViewProps } from './CanvasToolbarView'
export { canvasSubject, type CanvasLevel, type CanvasSubject } from './subject'
export { componentName, subjectName } from './identity'
export {
  duplicateItemPatch,
  itemActionGroups,
  moveItemPatch,
  removeItemPatch,
  type ItemAction,
  type ItemActionGroup,
  type ItemActionId,
  type ItemMove,
} from './itemActions'
export { KnobControl, type KnobControlProps } from './KnobControl'
export { KnobMenu, type KnobMenuProps } from './KnobMenu'
export {
  dismissesMenu,
  knobMenuModel,
  OPEN_FORM_ACTION,
  type KnobMenuAction,
  type KnobMenuGroup,
  type KnobMenuModel,
  type KnobMenuSubject,
} from './menuModel'
export { knobPatch } from './knobPatch'
