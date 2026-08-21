/**
 * `@o3/editor-chrome/toolbar` — what a site layout imports.
 *
 * Browser code only. Nothing reachable from here imports `sanity`, which is
 * what keeps the Studio runtime out of the site bundle; the Studio plugin is a
 * separate entry point for the same reason.
 *
 * `EditorToolbarChip` is deliberately absent (#269). A site layout is a server
 * component, so anything this barrel exports becomes a client entry of every
 * route — and Turbopack downloads every client entry of a route eagerly. Re-
 * exporting the chip therefore shipped the visual editing runtime its
 * presentation detection imports to every visitor, defeating the `next/dynamic`
 * call in `EditorToolbar` that exists to prevent exactly that.
 */
export { EditorToolbar } from './EditorToolbar'
export { EditorToolbarView, type EditorToolbarViewProps } from './EditorToolbarView'
export type { EditorToolbarStatus } from './EditorToolbarView'
export {
  disableDraftModeHref,
  readStudioToken,
  shouldShowEditorToolbar,
  studioTokenStorageKey,
  type EditorToolbarConfig,
  type EditorToolbarState,
  type TokenStorage,
} from './draftPreview'
export {
  DEFAULT_PRESENTATION_TOOL_NAME,
  presentationHref,
  safeReturnPath,
  type PresentationHrefOptions,
} from '../paths'
