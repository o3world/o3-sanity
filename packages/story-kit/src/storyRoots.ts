/**
 * Single source of truth for the repo dirs Storybook globs for stories.
 *
 * Consumed by:
 *  - apps/storybook/.storybook/main.ts  (as glob patterns)
 *
 * Add/remove a story root HERE only — consumers derive from this.
 *
 * `apps/web/src` is declared ahead of the web app's scaffold step; the
 * Storybook config filters to roots that exist on disk until it lands.
 */
export const STORY_ROOTS = [
  'packages/ui/src',
  'apps/web/src',
  // Captured prototypes — stories that frame a static HTML artifact rather
  // than a component. See apps/storybook/prototypes/README.md.
  'apps/storybook/prototypes',
] as const

/** The story-file extension glob (shared with main.ts). */
export const STORY_GLOB_SUFFIX = '**/*.stories.@(js|jsx|mjs|ts|tsx)'

/** The prefix apps/storybook's .storybook/main.ts passes to storyGlobs()
 *  (repo root relative to the .storybook dir). Exported so consumers agree
 *  on one value. */
export const STORYBOOK_CONFIG_PREFIX = '../../..'

/**
 * Build `main.ts`'s `stories` globs from a path prefix relative to the
 * `.storybook` directory (e.g. `'../../..'` → repo root).
 */
export function storyGlobs(prefix: string): string[] {
  return STORY_ROOTS.map((root) => `${prefix}/${root}/${STORY_GLOB_SUFFIX}`)
}
