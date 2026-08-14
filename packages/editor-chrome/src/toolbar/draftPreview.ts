import { safeReturnPath } from '../paths'

/**
 * The editor toolbar's shared vocabulary (#60, #99) — the pure half, imported
 * by the browser chip and by whatever wires the draft-mode routes.
 *
 * The toolbar assumes a site with **no auth system of its own**, where "logged
 * in" means logged into a same-origin Sanity Studio. That is what makes the
 * Studio's auth token readable from `localStorage` here.
 *
 * Reading that token is a *hint*, never a decision: it says "worth offering
 * the toolbar", and nothing more. The token is verified against the Sanity API
 * server-side before draft mode is ever enabled — see `../draft-mode`.
 */

export interface EditorToolbarConfig {
  /** The Sanity project whose Studio session counts as being logged in. */
  projectId: string
  /** Where the embedded Studio is mounted — `basePath` in `sanity.config.ts`. */
  studioUrl: string
  /** POST the Studio token here to turn draft mode on. */
  enablePath: string
  /** GET here with `?to=` to turn draft mode off. */
  disablePath: string
  /** The presentation tool's route name, if the Studio renamed it. */
  presentationToolName?: string
}

/**
 * Sanity Studio's per-project auth token key. Verbatim from
 * `sanity`'s `getAuthTokenStorageKey()` (Studio 6.8), whose value shape the
 * source documents as `{token?: string}`.
 *
 * This is Studio internals, so it is pinned here with its provenance rather
 * than spread across call sites: if a Studio upgrade changes the key, the
 * toolbar stops offering itself (fail-quiet) and this is the one line to fix.
 */
export function studioTokenStorageKey(projectId: string): string {
  return `__studio_auth_token_${projectId}`
}

/** The minimum of `Storage` this module needs — so a test can pass a Map-alike. */
export interface TokenStorage {
  getItem(key: string): string | null
}

/**
 * The Studio session token, or `null` if there isn't a plausible one.
 *
 * Every failure mode returns `null`: no storage (SSR), storage throwing
 * (Safari private mode, blocked third-party context), absent key, unparseable
 * JSON, or an entry with no token (which is what a cookie-authenticated
 * Studio leaves behind).
 */
export function readStudioToken(
  storage: TokenStorage | null | undefined,
  projectId: string,
): string | null {
  if (!storage) return null

  let raw: string | null
  try {
    raw = storage.getItem(studioTokenStorageKey(projectId))
  } catch {
    return null
  }
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  const token = (parsed as { token?: unknown } | null)?.token
  return typeof token === 'string' && token.length > 0 ? token : null
}

export interface EditorToolbarState {
  /** Next.js draft mode, read on the server and passed down. */
  isDraft: boolean
  /** A plausible Studio token exists in this origin's localStorage. */
  hasStudioToken: boolean
  /**
   * `useIsPresentationTool()` — `null` until the visual editing runtime has
   * mounted and the comlink handshake has settled.
   */
  isPresentationTool: boolean | null
}

/**
 * Should the toolbar be on screen at all?
 *
 * Three rules, in order:
 *
 * 1. **Presentation owns draft mode inside its own frame.** Toggling there
 *    would strand the tool on published content with its overlays gone, and an
 *    "Edit this page" link inside the editor is a loop.
 * 2. **In draft mode we wait for the verdict.** The visual editing runtime is
 *    mounted whenever draft mode is on, so the hook settles within a tick;
 *    rendering before it does would flash the toolbar inside Presentation,
 *    which is the one place it must never appear.
 * 3. **Published mode shows it for Studio users only.** Presentation always
 *    enters through the enable route first, so a page in Presentation is never
 *    in published mode — which is why rule 2's wait does not apply here, and
 *    why an anonymous visitor renders nothing, ever.
 */
export function shouldShowEditorToolbar({
  isDraft,
  hasStudioToken,
  isPresentationTool,
}: EditorToolbarState): boolean {
  if (isPresentationTool === true) return false
  if (isDraft) return isPresentationTool === false
  return hasStudioToken
}

/**
 * The href the preview switcher's "Published" side points at.
 *
 * The disable route takes its destination from the query string, so this is an
 * open-redirect gate as much as a link builder — `safeReturnPath` runs before
 * the encode, never after.
 */
export function disableDraftModeHref(disablePath: string, returnTo: string): string {
  return `${disablePath}?to=${encodeURIComponent(safeReturnPath(returnTo))}`
}
