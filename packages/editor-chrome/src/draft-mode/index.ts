/**
 * `@o3/editor-chrome/draft-mode` — what a host app's route handlers import.
 *
 * Server code, but framework-free: plain `Request` in, plain `Response` out,
 * with `draftMode` injected. The app's route files are the adapters that bind
 * it to Next.
 */
export {
  disableDraftModeAndReturn,
  enableDraftModeForStudioSession,
  studioUsersMeUrl,
  verifyStudioToken,
  type DisableDraftModeDeps,
  type DraftModeHandle,
  type EnableDraftModeDeps,
  type VerifyStudioTokenOptions,
} from './draftModeRoutes'
export { safeReturnPath } from '../paths'
