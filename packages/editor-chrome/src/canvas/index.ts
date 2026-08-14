/**
 * `@o3/editor-chrome/canvas` — the hover toolbar inside the Presentation
 * preview (CONTEXT.md → Preview).
 *
 * A separate entry from `./toolbar` because of what it drags in: this one
 * imports `@sanity/visual-editing`, and the corner chip on the site must never
 * pay for the overlay runtime. `./studio` splits off `sanity` for the mirror
 * reason. Nothing here is reachable from either.
 *
 * One import, one prop, and one sibling:
 *
 *     import { CanvasNotices, createCanvasComponents } from '@o3/editor-chrome/canvas'
 *     <VisualEditing components={createCanvasComponents({ blockKnobs, blockArrays })} />
 *     <CanvasNotices />
 *
 * The sibling is not decoration. An overlay component renders only while its
 * element is hovered, so a refused mutation reported from inside the toolbar
 * has nowhere to be read (#124). `<CanvasNotices />` mounts in the page's tree
 * and reads the queue the toolbar writes to.
 *
 * The knob declarations are the site's own (ADR 0020) — this package knows the
 * vocabulary and none of the instances.
 */
export { barKnobs, blockKnobReader } from './barKnobs'
export { CanvasNotices } from './CanvasNotices'
export { CanvasNoticesView, type CanvasNoticesViewProps } from './CanvasNoticesView'
export { createCanvasComponents } from './canvasComponents'
export { CanvasToolbar, type CanvasToolbarProps } from './CanvasToolbar'
export { CanvasToolbarView, type CanvasToolbarViewProps } from './CanvasToolbarView'
export { canvasSubject, type CanvasLevel, type CanvasSubject } from './subject'
export { componentName, subjectName } from './identity'
export {
  blockArrayKey,
  insertActionGroups,
  insertItemPatch,
  insertOffers,
  type InsertOffer,
  type InsertPosition,
} from './insertActions'
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
export { canvasNotices, createCanvasNoticeQueue, type CanvasNotice } from './notices'
export { reportCanvasFailure } from './draftPatch'
