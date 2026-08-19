/**
 * The repo dirs every Storybook host globs for stories.
 *
 * These are the shared component packages — they name only token roles both
 * brands paint, so the same story renders in either host and the Brand
 * toolbar over it is the standing paint-leak test (ADR 0028).
 *
 * A host's own app roots are not here: they belong to that host, and it
 * passes them to `defineStorybookConfig` as `appStoryRoots`.
 */
export const SHARED_STORY_ROOTS = ['packages/ui/src', 'packages/content-ui/src'] as const

/** The story-file extension glob. */
export const STORY_GLOB_SUFFIX = '**/*.stories.@(js|jsx|mjs|ts|tsx)'

/**
 * Repo root, expressed the way a `.storybook` config has to name it: as a
 * relative path from the config dir. Every host sits at `apps/<host>/.storybook`.
 */
export const REPO_ROOT_PREFIX = '../../..'
