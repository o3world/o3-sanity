/**
 * `@o3/editor-chrome/studio` — what a `sanity.config.ts` imports.
 *
 * Studio-runtime code only: everything reachable from here drags the `sanity`
 * barrel in behind it, which is why the site toolbar is a separate entry
 * point rather than a sibling export.
 */
export { editorChrome } from './editorChrome'
export { createOpenInPresentationAction } from './OpenInPresentationAction'
export { defaultToolFirst } from './defaultTool'
export type { EditorChromeOptions, PreviewPathDoc } from './options'
export {
  DEFAULT_PRESENTATION_TOOL_NAME,
  presentationHref,
  type PresentationHrefOptions,
} from '../paths'
