'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef, type MouseEvent } from 'react'
import type { INSIGHTS_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'
import { InsightIndexView } from './InsightIndexView'
import { readFeedPath } from './feedPath'
import { filterInsights } from './filterInsights'
import './insight-feed.css'

type Data = NonNullable<INSIGHTS_PAGE_QUERY_RESULT>

/** The catalog arrives with the page. Filter and pager clicks make no data request. */
export function InsightFeed({
  catalog,
  categories,
  path,
  initial,
}: {
  catalog: Data['items']
  categories: Data['categories']
  path: string
  initial: { items: Data['items']; pagination: { page: number; totalPages: number } }
}) {
  const feedRef = useRef<HTMLDivElement>(null)
  const paginationPending = useRef(false)
  const pathname = usePathname()
  const state = readFeedPath(pathname) ?? readFeedPath(path)!
  const result =
    pathname === path || !pathname ? initial : filterInsights(catalog, state.category, state.page)

  useLayoutEffect(() => {
    if (!paginationPending.current) return
    paginationPending.current = false
    const feed = feedRef.current?.querySelector<HTMLElement>('#feed')
    feed?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
    feed?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [pathname])

  function follow(event: MouseEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href]')
    if (!anchor || !anchor.closest('nav') || anchor.target || anchor.hasAttribute('download'))
      return
    const url = new URL(anchor.href)
    if (url.origin !== window.location.origin || !readFeedPath(url.pathname)) return
    event.preventDefault()
    if (url.pathname === pathname) return
    paginationPending.current = anchor.closest('nav')?.getAttribute('aria-label') === 'Pagination'
    window.history.pushState(null, '', `${url.pathname}#feed`)
  }

  return (
    <div
      ref={feedRef}
      onClickCapture={follow}
      data-insight-feed
      data-catalog-count={catalog.length}
    >
      <InsightIndexView
        items={result.items}
        categories={categories}
        category={state.category}
        pagination={result.pagination}
        resultsKey={pathname}
      />
      <span className="sr-only" role="status">
        {state.category
          ? `${categories.find((item) => item.slug === state.category)?.title} insights`
          : 'All insights'}
        , page {state.page}
      </span>
    </div>
  )
}
