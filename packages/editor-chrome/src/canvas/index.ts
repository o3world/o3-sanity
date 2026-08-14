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
 *     import { canvasComponents } from '@o3/editor-chrome/canvas'
 *     <VisualEditing components={canvasComponents} />
 */
export { canvasComponents } from './canvasComponents'
export { CanvasToolbar, type CanvasToolbarProps } from './CanvasToolbar'
export { CanvasToolbarView, type CanvasToolbarViewProps } from './CanvasToolbarView'
export { canvasSubject, type CanvasLevel, type CanvasSubject } from './subject'
export { componentName, subjectName } from './identity'
