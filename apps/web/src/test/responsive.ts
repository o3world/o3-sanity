/**
 * The 402 half of ADR 0006, made assertable.
 *
 * The ADR's rule is that **composition switches at `lg`, size interpolates** —
 * so anything that turns a band into a horizontally-scrolling track has to
 * carry an `lg:` (or `md:`) prefix. Unprefixed, it applies from 320 up, and a
 * 402 phone gets a hidden scroll region where the frame draws a stack. That is
 * exactly how the perspectives carousel diverged: `overflow-x-auto` with no
 * prefix, shipped and unnoticed because nobody opened the page at 402.
 *
 * These helpers read the rendered HTML rather than the source, so they hold
 * for whatever the block actually emitted, including classes composed by `cn`.
 */

/**
 * Utilities that make an element a horizontal scroll region, or size it past
 * its container. Unprefixed, each one is a 402 bug.
 */
const HORIZONTAL_SCROLL_UTILITIES = new Set([
  'overflow-x-auto',
  'overflow-x-scroll',
  'overflow-auto',
  'overflow-scroll',
  'snap-x',
  'w-max',
  'w-screen',
])

/** Every `class="…"` value in a rendered document, split into tokens. */
export function classTokens(html: string): string[] {
  const tokens: string[] = []
  for (const match of html.matchAll(/class="([^"]*)"/g)) {
    tokens.push(...(match[1] ?? '').split(/\s+/).filter(Boolean))
  }
  return tokens
}

/**
 * The horizontal-scroll utilities on this page that are **live at 402** —
 * i.e. carry no responsive prefix at all. Empty is the contract.
 *
 * A prefixed `lg:overflow-x-auto` is fine and expected: that is the desktop
 * carousel. A bare `overflow-x-auto` is the regression.
 */
export function unprefixedHorizontalScrollUtilities(html: string): string[] {
  return [
    ...new Set(classTokens(html).filter((token) => HORIZONTAL_SCROLL_UTILITIES.has(token))),
  ].sort()
}

/**
 * The variants a given utility was emitted with, across the whole document —
 * `variantsOf(html, 'gap-12')` → `['lg:gap-12']` proves the 48 gap is
 * desktop-only.
 *
 * Used to pin a gap that the two frames set differently, which is the other
 * shape ADR 0006 divergences take (case cards: 24 at 402, 48/64 at 1440).
 */
export function variantsOf(html: string, utility: string): string[] {
  // Escape the utility: `w-[394px]` is full of regex metacharacters, and
  // unescaped it silently matches nothing — a vacuous green.
  const escaped = utility.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`^(?:[a-z-]+:)*${escaped}$`)
  return [...new Set(classTokens(html).filter((token) => pattern.test(token)))].sort()
}
