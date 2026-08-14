/**
 * The pure path vocabulary both halves of this package are built on — the
 * Studio plugin, which sends an editor from a document to Presentation, and
 * the site toolbar, which sends them the other way.
 *
 * Nothing here imports anything. That is what lets a unit test compile it
 * without a Studio, a browser, or a Next request scope.
 */

/**
 * Presentation's route name inside the Studio, which is also its `name`
 * option's default (`sanity@6.8` — `DEFAULT_TOOL_NAME`). A Studio that renames
 * the tool has to say so, because the URL and the intent both key off it.
 */
export const DEFAULT_PRESENTATION_TOOL_NAME = 'presentation'

/**
 * A same-origin path to send someone to, or `/`.
 *
 * Two callers depend on this and neither can trust its input: the disable
 * route takes its destination from a query string, and the toolbar's Edit link
 * takes its from `window.location`. Anything a browser would resolve to
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

export interface PresentationHrefOptions {
  /** Where the Studio is mounted — `basePath` in `sanity.config.ts` (`/studio`). */
  studioUrl: string
  /** The site path Presentation should load in its preview frame. */
  previewPath: string
  /** The presentation tool's route name. */
  toolName?: string
}

/**
 * Presentation, opened on a given page: `/studio/presentation?preview=/work/acme`.
 *
 * The `preview` search param is Presentation's own contract, not an invention
 * here. Its router declares `__unsafe_disableScopedSearchParams`, so the param
 * sits unscoped at the root of the query string rather than as
 * `presentation[preview]=`; `preservedSearchParamKeys` in `sanity/presentation`
 * is where the name is fixed, and `getIntentState` defaults it to `/` when a
 * caller omits it.
 *
 * This is the link for someone **outside** the Studio. Inside it, navigate by
 * intent instead — see `OpenInPresentationAction`.
 */
export function presentationHref({
  studioUrl,
  previewPath,
  toolName = DEFAULT_PRESENTATION_TOOL_NAME,
}: PresentationHrefOptions): string {
  const base = studioUrl.replace(/\/+$/, '')
  return `${base}/${toolName}?preview=${encodeURIComponent(safeReturnPath(previewPath))}`
}
