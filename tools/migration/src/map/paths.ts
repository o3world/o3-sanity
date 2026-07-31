import type { ConversionIssue } from '../lib/htmlToPortableText'

/**
 * Path parity (#26). **A migrated document keeps the URL path WordPress
 * serves it at today.** Not "roughly", not "the slug matches" — the full
 * path, character for character, minus the trailing slash WordPress adds and
 * Next.js does not.
 *
 * The rule is enforced rather than documented: every mapper compares the new
 * path against Yoast's own `canonicalRendered` and fails loud on a mismatch
 * (ADR 0002), so a slug that quietly changes shape during conversion stops
 * the run instead of silently costing the ranking.
 *
 * A deliberate path change is therefore a two-line act — add an entry to
 * `PATH_EXCEPTIONS` with its reason — and that map is the input to the #24
 * redirect map. If a path change is not written down here, it does not
 * happen.
 */

export interface PathException {
  /** The path WordPress serves today, no host, no trailing slash. */
  readonly from: string
  /** The path the new site serves. */
  readonly to: string
  /** Why the change is worth a redirect. Shows up in the #24 redirect map. */
  readonly reason: string
}

/**
 * Deliberate path changes. Empty by design: the WordPress URL space
 * (`/perspectives/…`, `/work/…`, `/services/…`, `/ventures/…`) is exactly the
 * URL space ADR 0001 routes, so nothing has to move. Entries added here are
 * decisions, not conversion accidents.
 */
export const PATH_EXCEPTIONS: readonly PathException[] = []

const EXCEPTION_BY_FROM = new Map(PATH_EXCEPTIONS.map((e) => [e.from, e]))

/**
 * `https://www.o3world.com/perspectives/foo/` → `/perspectives/foo`.
 * Returns `null` for input that isn't a URL with a path, which is itself a
 * parity failure the caller reports.
 */
export function wpPath(canonicalUrl: string): string | null {
  if (!canonicalUrl) return null
  let pathname: string
  try {
    pathname = new URL(canonicalUrl).pathname
  } catch {
    return null
  }
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

/**
 * Compare the path a document will be served at against the one WordPress
 * serves today. Returns the issue to report, or `null` when they agree (or
 * when the difference is a recorded exception).
 */
export function checkPathParity(
  canonicalRendered: string,
  newPath: string,
): ConversionIssue | null {
  const from = wpPath(canonicalRendered)
  if (from === null) {
    return {
      element: 'path parity',
      detail: `no usable WordPress canonical to compare against (got ${JSON.stringify(canonicalRendered)})`,
    }
  }
  if (from === newPath) return null

  const exception = EXCEPTION_BY_FROM.get(from)
  if (exception && exception.to === newPath) return null

  return {
    element: 'path parity',
    detail:
      `WordPress serves "${from}" but this document maps to "${newPath}". ` +
      `Either fix the slug or record the change in PATH_EXCEPTIONS (map/paths.ts) so it becomes a redirect.`,
  }
}
