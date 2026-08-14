import { definePlugin } from 'sanity'

import { createOpenInPresentationAction } from './OpenInPresentationAction'
import type { EditorChromeOptions } from './options'

/**
 * The Studio half of the editor chrome: every routable document gets a door
 * into Presentation, opened on its own page.
 *
 * Structure mode and Presentation are the same documents seen two ways, and
 * the gap between them is the thing editors actually complain about. Sanity
 * ships the return leg — Presentation's `openInStructure` field action — but
 * nothing goes the other way, so a document found in a list has no way to be
 * *seen* without the editor retyping its URL into the preview frame.
 *
 * Scoped to `options.types` rather than offered everywhere: a person or a
 * category has no page of its own, and an action that lands on the homepage
 * for half the document types teaches editors to stop trusting it.
 */
export const editorChrome = definePlugin<EditorChromeOptions>((options) => {
  const action = createOpenInPresentationAction(options)
  const routable = new Set(options.types)

  return {
    name: '@o3/editor-chrome',
    document: {
      actions: (prev, context) => (routable.has(context.schemaType) ? [...prev, action] : prev),
    },
  }
})
