import { collectionPrefixes } from '@o3/sanity/brand'
import { WORDPRESS_PREFIXES } from '@o3/sanity/constants'

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

/** One path that moved. */
export interface PathException {
  /** The path WordPress serves today, no host, no trailing slash. */
  readonly from: string
  /** The path the new site serves. */
  readonly to: string
  /** Why the change is worth a redirect. Shows up in the #24 redirect map. */
  readonly reason: string
}

/**
 * A whole collection that moved — every path under one prefix, by one rule.
 *
 * A collection rename is a single decision, not N of them. Spelling it out per
 * document would bury that decision in 272 identical rows, go stale the first
 * time a slug changed, and make the redirect generator ship 272 rows where one
 * prefix rule says the same thing.
 */
export interface PathPrefixException {
  readonly fromPrefix: string
  readonly toPrefix: string
  readonly reason: string
}

/**
 * Deliberate path changes — the record of every URL this redesign moves.
 *
 * Both lists were empty by design until ADR 0017: the WordPress URL space was
 * exactly the URL space ADR 0001 routes, so nothing had to move. Entries here
 * are decisions, not conversion accidents, and this is the only place a moved
 * path is declared — `checkPathParity` reads it, and so does the #24 redirect
 * generator.
 */
export const PATH_EXCEPTIONS: readonly PathException[] = []

export const PATH_PREFIX_EXCEPTIONS: readonly PathPrefixException[] = [
  {
    fromPrefix: WORDPRESS_PREFIXES.insight!,
    toPrefix: collectionPrefixes().insight,
    reason:
      'ADR 0017: the collection is an Insight. The nav has read "Insights" since the ' +
      'first mockup and the sibling brand already publishes at /insights, so the code ' +
      'took the word the design was already using. All 272 articles and the index move.',
  },
]

const EXCEPTION_BY_FROM = new Map(PATH_EXCEPTIONS.map((e) => [e.from, e]))

/**
 * The new path for a path WordPress serves, or `null` when nothing moved it.
 * An exact entry wins over a prefix rule, so one document can always opt out
 * of its collection's move.
 */
export function movedPath(from: string): string | null {
  const exact = EXCEPTION_BY_FROM.get(from)
  if (exact) return exact.to
  for (const rule of PATH_PREFIX_EXCEPTIONS) {
    if (from === rule.fromPrefix) return rule.toPrefix
    if (from.startsWith(`${rule.fromPrefix}/`)) {
      return rule.toPrefix + from.slice(rule.fromPrefix.length)
    }
  }
  return null
}

/**
 * `https://www.o3world.com/perspectives/foo/` → `/perspectives/foo`. The input
 * is a live site's canonical, so it still carries that site's prefix;
 * `movedPath` is what turns it into the path this site serves.
 * Returns `null` for input that isn't a URL with a path, which is itself a
 * parity failure the caller reports.
 *
 * The pathname is decoded, because `new URL()` percent-encodes anything outside
 * ASCII and a slug is compared against a stored one that is not encoded. Two of
 * o3xo.ai's insight slugs carry a curly apostrophe, and their canonicals arrive
 * as `…on-pact%E2%80%99s-…` — which reads as a moved path against the slug the
 * document actually holds.
 */
export function wpPath(canonicalUrl: string): string | null {
  if (!canonicalUrl) return null
  let pathname: string
  try {
    pathname = decodeURIComponent(new URL(canonicalUrl).pathname)
  } catch {
    return null
  }
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

/**
 * Compare the path a document will be served at against the one its source
 * serves today. Returns the issue to report, or `null` when they agree (or when
 * the difference is a recorded exception).
 *
 * `source` names the live site in the message, because the rule now guards two
 * of them: WordPress for o3, o3xo.ai for O3XO. The exception lists are o3's
 * facts and no O3XO path is in them, which is correct — O3XO's URL space is the
 * one ADR 0001 already routes, so nothing there moves.
 */
export function checkPathParity(
  canonicalRendered: string,
  newPath: string,
  source = 'WordPress',
): ConversionIssue | null {
  const from = wpPath(canonicalRendered)
  if (from === null) {
    return {
      element: 'path parity',
      detail: `no usable ${source} canonical to compare against (got ${JSON.stringify(canonicalRendered)})`,
    }
  }
  if (from === newPath) return null

  if (movedPath(from) === newPath) return null

  return {
    element: 'path parity',
    detail:
      `${source} serves "${from}" but this document maps to "${newPath}". ` +
      `Either fix the slug or record the change in PATH_EXCEPTIONS / PATH_PREFIX_EXCEPTIONS (map/paths.ts) so it becomes a redirect.`,
  }
}
