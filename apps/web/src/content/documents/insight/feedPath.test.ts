import { describe, expect, it } from 'vitest'
import { feedPath, readFeedPath } from './feedPath'

describe('feed navigation paths', () => {
  it.each([
    [null, 1],
    ['design', 1],
    [null, 2],
    ['artificial-intelligence-ai', 3],
  ] as const)('round trips category %s, page %s', (category, page) => {
    expect(readFeedPath(feedPath(category, page))).toEqual({ category, page })
  })
  it.each([
    '/insights/article-slug',
    '/work',
    '/insights/page/1',
    '/insights/page/0',
    '/insights/page/nope',
    '/insights/category/%',
    '/insights/page/9007199254740992',
  ])('leaves invalid or non-feed path %s to normal navigation', (path) => {
    expect(readFeedPath(path)).toBeNull()
  })
})
