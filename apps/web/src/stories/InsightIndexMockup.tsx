import type { INSIGHTS_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { InsightIndexView } from '@/content/documents/insight/InsightIndexView'
import { SiteFooter, SiteNav } from '@o3/content-ui/chrome'

import { INSIGHTS, SITE_SETTINGS } from '@o3/content-ui/testing/seed'

type IndexData = NonNullable<INSIGHTS_PAGE_QUERY_RESULT>

const PAGE_SIZE = 12

/**
 * `/insights` as a whole page, chrome included — the collection-index answer
 * to `PageMockup` (#61).
 *
 * A collection index has no document (CONTEXT.md), so `PageMockup`'s route —
 * seed page → `BlockRenderer` — cannot reach it. What it stands on instead is
 * the same committed content: `INSIGHTS` is the projected seed/converted feed
 * the block stories already render, so nothing on this mockup is authored for
 * it either.
 *
 * **The filter is really running.** The two steps below are the GROQ query's
 * two filters ported (`INSIGHTS_PAGE_QUERY`) — match on the category slug,
 * offer only the categories that have an article — so flipping the `category`
 * arg in the sidebar exercises the same rule the route does, rather than a
 * story-shaped imitation of it. A chip that looks selected and shows the wrong
 * cards would be visible here.
 */
export function InsightIndexMockup({
  category = null,
  page = 1,
}: {
  /** The category slug the URL would carry — `null` is the unfiltered index. */
  category?: string | null
  page?: number
}) {
  const filtered = category
    ? INSIGHTS.filter((insight) =>
        (insight.categories ?? []).some((option) => option.slug === category),
      )
    : INSIGHTS
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="bg-white">
      <SiteNav settings={SITE_SETTINGS} />
      <main>
        <InsightIndexView
          // One cast, for one reason: `INSIGHTS` is projected as the DETAIL
          // query's result, which is the card fragment plus `body`, `seo` and
          // the two "Keep reading" feeds. The card half is the same fragment,
          // so the extra keys are all this differs by.
          items={items as unknown as IndexData['items']}
          categories={categoriesOf()}
          category={category}
          pagination={{ page, totalPages }}
        />
      </main>
      <SiteFooter settings={SITE_SETTINGS} />
    </div>
  )
}

/** Every category the feed actually uses, by title — the query's facet list. */
function categoriesOf(): IndexData['categories'] {
  const bySlug = new Map<string, { title: string | null; slug: string | null }>()
  for (const insight of INSIGHTS) {
    for (const option of insight.categories ?? []) {
      if (!option.slug || option.slug === 'uncategorized') continue
      bySlug.set(option.slug, { title: option.title, slug: option.slug })
    }
  }
  return [...bySlug.values()].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
}
