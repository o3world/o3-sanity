import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { cn, FONT_SIZE_UTILITIES } from './utils'

/**
 * `cn()` has to be told about our type scale (see utils.ts for why), and that
 * list is hand-maintained because `cn` runs in the browser and cannot read
 * CSS. Hand-maintained plus "keep this in sync" in a comment is how it went
 * stale: #37 added seven type steps and the list kept the original five, so
 * `cn('text-lead', 'text-fg-muted')` silently dropped the size.
 *
 * This is the sync check the comment was asking for.
 */

const TYPOGRAPHY_CSS = fileURLToPath(
  new URL('../../../tailwind-config/tokens/typography.css', import.meta.url),
)

/** Every `--text-<name>` in the theme, ignoring the `--line-height` style sub-values. */
function themeTypeSteps(): string[] {
  const css = readFileSync(TYPOGRAPHY_CSS, 'utf8')
  const names = new Set<string>()
  for (const [, name] of css.matchAll(/^\s*--text-([a-z0-9-]+)\s*:/gm)) {
    // `--text-hero--line-height` and friends are sub-values of a step, not steps.
    if (!name || name.includes('--')) continue
    names.add(`text-${name}`)
  }
  return [...names].sort()
}

describe('cn', () => {
  it('registers every type step in the theme as a font-size', () => {
    // Fails loudly naming the drift, rather than leaving a size to vanish at
    // some call site nobody is looking at.
    expect([...FONT_SIZE_UTILITIES].sort()).toEqual(themeTypeSteps())
  })

  it('finds type steps to check', () => {
    expect(themeTypeSteps().length).toBeGreaterThan(5)
  })

  /**
   * The whole point of the registration: a size and a color are orthogonal.
   * Without it an unknown `text-…` lands in the color conflict group and the
   * later class wins outright.
   */
  it('keeps a type step and a color together', () => {
    for (const size of FONT_SIZE_UTILITIES) {
      const out = cn(size, 'text-fg-muted')
      expect(out, `${size} was dropped when combined with a color`).toContain(size)
      expect(out).toContain('text-fg-muted')
    }
  })

  it('still collapses two type steps to the last one', () => {
    expect(cn('text-hero', 'text-display-xl')).toBe('text-display-xl')
  })
})
