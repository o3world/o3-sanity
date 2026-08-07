/**
 * The query-time projections `PAGE_QUERY` performs, as pure functions.
 *
 * A committed seed under `tools/migration/data/` is the **un-projected** form:
 * `slug` is an object, references are `{_ref}`, and images carry a `_wpSrc` /
 * `_localSrc` marker where `load` will put an asset reference. A renderer
 * receives the projected form. Anything that wants to render committed JSON
 * without a dataset therefore has to apply the same projections GROQ does —
 * and two layers want to:
 *
 * - the **render** layer (`fixtures.ts`), which reads the tree off disk with
 *   `node:fs` and fakes asset ids from a hash;
 * - the **stories** layer (`src/stories/seedContent.ts`), which cannot touch
 *   the filesystem at all (it runs in Chromium) and so static-imports the JSON
 *   and resolves real asset ids out of the committed `assets.json`.
 *
 * The two differ only in how they *load* documents and *name* assets, so both
 * are parameters here and the projection itself is written once. Keeping it in
 * one place is the point: a page that renders green in a render test and blank
 * in Storybook — because one of two copies of this logic learned about a new
 * dereferenced field and the other did not — is precisely the failure this
 * module exists to make impossible.
 *
 * No `node:` imports. This module is bundled into the browser.
 */

/** A committed document, before any projection. */
export type SeedDoc = Record<string, unknown>

/** Resolve a source marker (`_wpSrc` URL or `_localSrc` repo path) to an asset id. */
export type AssetIdFor = (source: string) => string

/** Resolve a `{_ref}` to the committed document it points at, or null. */
export type ResolveRef = (ref: unknown) => SeedDoc | null

/**
 * Stand in for the asset upload `tools/migration/src/load.ts` performs.
 *
 * Converted JSON carries `_wpSrc` URL markers where an asset reference will
 * go; seeds use `_localSrc` (a repo path). A renderer handed the raw marker
 * throws inside `@sanity/image-url`, so every marker is swapped for the
 * reference shape the image pipeline expects before anything renders.
 */
export function resolveAssetMarkers(node: unknown, assetIdFor: AssetIdFor): unknown {
  if (Array.isArray(node)) return node.map((item) => resolveAssetMarkers(item, assetIdFor))
  if (node && typeof node === 'object') {
    const obj = node as SeedDoc
    const marker = typeof obj._wpSrc === 'string' ? '_wpSrc' : '_localSrc'
    if (typeof obj[marker] === 'string') {
      const source = obj[marker] as string
      const rest = Object.fromEntries(Object.entries(obj).filter(([k]) => k !== marker))
      return { ...rest, asset: { _type: 'reference', _ref: assetIdFor(source) } }
    }
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, resolveAssetMarkers(value, assetIdFor)]),
    )
  }
  return node
}

/** Flatten `slug` the way every card projection does, and lift `stats[0]`. */
export function projectCard(doc: SeedDoc | null, resolve: ResolveRef): SeedDoc | null {
  if (!doc) return null
  const { slug, client, industries, ...rest } = doc
  return {
    ...rest,
    slug: (slug as { current?: string } | undefined)?.current ?? null,
    headlineStat: (doc.stats as unknown[] | undefined)?.[0] ?? null,
    ...(client !== undefined ? { client: resolve(client) } : {}),
    ...(industries !== undefined
      ? { industries: (industries as unknown[]).map(resolve).filter(Boolean) }
      : {}),
  }
}

export interface ProjectSeedPageOptions {
  /** The raw seed page, asset markers already resolved. */
  page: SeedDoc
  /** How to dereference a `{_ref}` against the committed trees. */
  resolve: ResolveRef
  /**
   * The feed `insightsCarouselSection` falls back to when its curated list
   * is empty. The query fetches it alongside the curated array; a caller
   * supplies whatever insights it has.
   */
  latestInsights?: readonly unknown[]
  /**
   * Project one curated `insights[]` reference into the card shape
   * `"curated": insights[]->{…}` returns, or null if it cannot be
   * resolved.
   *
   * Optional, and the two layers answer differently on purpose. The **stories**
   * layer supplies it, because `/1682-conference-ai-innovation` curates three
   * named articles and a mockup that quietly showed the latest feed instead
   * would be a mockup of a page that does not exist. The **render** layer
   * omits it: resolving a curated ref means sweeping 272 committed
   * insights per call, and its assertions are about the fallback feed the
   * homepage actually uses. Omitted, curated stays empty — which is the
   * pre-#45 behaviour and still correct for every seed but one.
   */
  projectInsight?: (ref: unknown) => unknown | null
}

/**
 * A committed seed page, shaped into what `PAGE_QUERY` returns.
 *
 * The `switch` mirrors the query's per-type conditionals (`@o3/sanity`'s
 * SECTION_FIELDS): only the block types that dereference something need an
 * arm, and a block missing one passes through untouched — which is correct,
 * because that is exactly what the query does with it.
 */
export function projectSeedPage({
  page,
  resolve,
  latestInsights = [],
  projectInsight,
}: ProjectSeedPageOptions): SeedDoc {
  const sections = ((page.sections ?? []) as SeedDoc[]).map((section) => {
    switch (section._type) {
      case 'logoWallSection':
        return { ...section, clients: ((section.clients ?? []) as unknown[]).map(resolve) }
      case 'caseShowcaseSection':
        return {
          ...section,
          caseStudies: ((section.caseStudies ?? []) as unknown[]).map((ref) =>
            projectCard(resolve(ref), resolve),
          ),
        }
      case 'personGridSection':
        return { ...section, people: ((section.people ?? []) as unknown[]).map(resolve) }
      case 'insightsCarouselSection': {
        // The renderer prefers `curated` and falls back to the `latest` feed
        // the query fetches alongside it. Most seeds curate nothing, so most
        // of the time this is the fallback path.
        const curated = projectInsight
          ? ((section.insights ?? []) as unknown[])
              .map((ref) => projectInsight(ref))
              .filter((card) => card != null)
          : []
        return { ...section, curated, latest: [...latestInsights] }
      }
      default:
        return section
    }
  })

  return {
    ...page,
    slug: (page.slug as { current?: string } | undefined)?.current ?? null,
    sections,
  }
}
