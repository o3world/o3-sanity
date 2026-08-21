/**
 * `@o3/editor-chrome/toolbar` — what a site layout imports.
 *
 * Browser code only. Nothing reachable from here imports `sanity`, which is
 * what keeps the Studio runtime out of the site bundle; the Studio plugin is a
 * separate entry point for the same reason.
 *
 * **What this barrel exports, every visitor downloads** (#269). A site layout
 * is a server component, so each `'use client'` module named here is a client
 * entry of every route, and Turbopack loads a route's client entries eagerly.
 * `EditorToolbarChip` is therefore absent: it imports the visual editing
 * runtime for its presentation detection, and exporting it here would defeat
 * the `next/dynamic` call in `EditorToolbar` that keeps that runtime lazy.
 * `EditorToolbarView` is exported because it is props in, markup out — a few
 * hundred bytes with nothing behind it.
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
