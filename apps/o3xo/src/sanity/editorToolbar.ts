import type { EditorToolbarConfig } from '@o3/editor-chrome/toolbar'
import { resolveProjectId } from '@o3/sanity/brand'

/**
 * Everything `@o3/editor-chrome` cannot know about this app: which Sanity
 * project a Studio session has to belong to, where the Studio is mounted, and
 * what the two draft-mode routes are called.
 *
 * The toolbar itself is generic (#99) — the whole reason it moved into a
 * package is that the next project's answers to these four questions will be
 * different. This file is the only place they are given.
 */
export const editorToolbarConfig: EditorToolbarConfig = {
  projectId: resolveProjectId(),
  // `basePath` in sanity.config.ts. The Studio is embedded and same-origin,
  // which is what makes "Edit this page" a relative link rather than a hop to
  // another host.
  studioUrl: '/studio',
  enablePath: '/api/draft-mode/enable',
  disablePath: '/api/draft-mode/disable',
}
