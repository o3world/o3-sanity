import { titleFromPath } from './title'

/** A valid Storybook story export name: a PascalCase identifier. */
export const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/

/** Export names Storybook reserves for a factory's own generated stories. */
export const RESERVED_STORY_NAMES: ReadonlySet<string> = new Set(['Playground', 'Variants'])

/**
 * Resolve a story-group title from an explicit `title` or a content-tree
 * `from` path (`import.meta.url`). Throws a consistent error when neither
 * yields a title. Shared by defineBlockStories + defineCardStories so the
 * `title ?? titleFromPath(from)` resolution lives in one place.
 */
export function resolveStoryTitle(
  factory: string,
  opts: { readonly title?: string; readonly from?: string },
): string {
  const title = opts.title ?? (opts.from ? titleFromPath(opts.from) : undefined)
  if (!title) {
    throw new Error(
      `${factory}: pass \`title\` explicitly, or \`from: import.meta.url\` for files under apps/web/src/content/`,
    )
  }
  return title
}

/**
 * Assert a story export name is a non-reserved PascalCase identifier.
 * `ctx` prefixes the error (e.g. `defineCardStories(page)`).
 */
export function assertStoryName(name: string, ctx: string): void {
  if (!PASCAL_CASE.test(name)) {
    throw new Error(`${ctx}: story name "${name}" must be PascalCase`)
  }
  if (RESERVED_STORY_NAMES.has(name)) {
    throw new Error(`${ctx}: story name "${name}" is reserved`)
  }
}
