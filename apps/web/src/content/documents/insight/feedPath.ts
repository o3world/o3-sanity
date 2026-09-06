import { indexHref } from '@o3/content-runtime/routes/index-paths'

export const INSIGHTS_PAGE_SIZE = 12

export function feedPath(category: string | null, page: number) {
  return indexHref('/insights', { facets: { category }, page })
}

export function readFeedPath(path: string) {
  const match = /^\/insights(?:\/category\/([^/]+))?(?:\/page\/([2-9]|[1-9][0-9]+))?$/.exec(path)
  if (!match) return null
  try {
    const page = Number(match[2] ?? 1)
    return Number.isSafeInteger(page)
      ? { category: match[1] ? decodeURIComponent(match[1]) : null, page }
      : null
  } catch {
    return null
  }
}
