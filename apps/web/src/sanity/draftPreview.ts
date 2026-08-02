import { PROJECT_ID } from '@o3/sanity/constants'

/**
 * The preview switcher's shared vocabulary (#60) — the pure half, imported by
 * both the browser chip and the two draft-mode route handlers.
 *
 * There is no site auth system in this repo, so "logged in" means **logged
 * into the embedded Studio at `/studio`**. The Studio is same-origin with the
 * site on every deploy (that is what makes Presentation work on unpredictable
 * preview URLs), so its auth token is readable from `localStorage` here.
 *
 * Reading that token is a *hint*, never a decision: it says "worth offering
 * the switcher", and nothing more. The token is verified against the Sanity
 * API server-side before draft mode is ever enabled — see `draftModeRoutes`.
 */

/** The project the site reads, matching `@o3/sanity`'s `clientConfig`. */
export const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? PROJECT_ID

export const ENABLE_DRAFT_MODE_PATH = '/api/draft-mode/enable'
/** Not exported: reach it through `disableDraftModeHref`, which sanitises `?to=`. */
const DISABLE_DRAFT_MODE_PATH = '/api/draft-mode/disable'

/**
 * Sanity Studio's per-project auth token key. Verbatim from
 * `sanity`'s `getAuthTokenStorageKey()` (Studio 6.8), whose value shape the
 * source documents as `{token?: string}`.
 *
 * This is Studio internals, so it is pinned here with its provenance rather
 * than spread across call sites: if a Studio upgrade changes the key, the
 * switcher stops offering itself (fail-quiet) and this is the one line to fix.
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

export interface PreviewSwitcherState {
  /** Next.js draft mode, read on the server and passed down. */
  isDraft: boolean
  /** A plausible Studio token exists in this origin's localStorage. */
  hasStudioToken: boolean
  /**
   * `useIsPresentationTool()` — `null` until `<VisualEditing />` has mounted
   * and the comlink handshake has settled.
   */
  isPresentationTool: boolean | null
}

/**
 * Should the chip be on screen at all?
 *
 * Three rules, in order:
 *
 * 1. **Presentation owns draft mode inside its own frame.** Toggling there
 *    would strand the tool on published content with its overlays gone.
 * 2. **In draft mode we wait for the verdict.** `<VisualEditing />` is mounted
 *    by `(site)/layout.tsx` whenever draft mode is on, so the hook settles
 *    within a tick; rendering before it does would flash the chip inside
 *    Presentation, which is the one place it must never appear.
 * 3. **Published mode shows it for Studio users only.** Presentation always
 *    enters through `/api/draft-mode/enable` first, so a page in Presentation
 *    is never in published mode — which is why rule 2's wait does not apply
 *    here, and why an anonymous visitor renders nothing, ever.
 */
export function shouldShowPreviewSwitcher({
  isDraft,
  hasStudioToken,
  isPresentationTool,
}: PreviewSwitcherState): boolean {
  if (isPresentationTool === true) return false
  if (isDraft) return isPresentationTool === false
  return hasStudioToken
}

/**
 * A same-origin path to return to, or `/`.
 *
 * `/api/draft-mode/disable` takes its destination from the query string, so
 * this is an open-redirect gate: anything that a browser would resolve to
 * another origin (`//evil.example`, `/\evil.example`, a scheme) or that could
 * smuggle a header (CR/LF) collapses to the homepage.
 */
export function safeReturnPath(raw: string | null | undefined): string {
  if (typeof raw !== 'string') return '/'
  if (!raw.startsWith('/')) return '/'
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/'
  if (/[\r\n\t]/.test(raw)) return '/'
  return raw
}

/** The href the chip's "Published" side points at. */
export function disableDraftModeHref(returnTo: string): string {
  return `${DISABLE_DRAFT_MODE_PATH}?to=${encodeURIComponent(safeReturnPath(returnTo))}`
}
