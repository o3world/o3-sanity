import type { INSIGHTS_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'
import { INSIGHTS_PAGE_SIZE } from './feedPath'

type Cards = NonNullable<INSIGHTS_PAGE_QUERY_RESULT>['items']

export function filterInsights(catalog: Cards, category: string | null, page: number) {
  const items = category
    ? catalog
        .filter((item) => item.categories?.some((value) => value.slug === category))
        .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    : catalog
  return {
    items: items.slice((page - 1) * INSIGHTS_PAGE_SIZE, page * INSIGHTS_PAGE_SIZE),
    pagination: { page, totalPages: Math.max(1, Math.ceil(items.length / INSIGHTS_PAGE_SIZE)) },
  }
}
