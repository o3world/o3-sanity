import { describe, expect, it } from 'vitest'
import { anInsight } from '@/test'
import { filterInsights } from './filterInsights'

describe('local insight filtering', () => {
  const pinned = anInsight({
    _id: 'pinned',
    publishedAt: '2020-01-01',
    categories: [{ title: 'Design', slug: 'design' }],
  })
  const newest = anInsight({
    _id: 'newest',
    publishedAt: '2026-01-01',
    categories: [{ title: 'Design', slug: 'design' }],
  })
  const other = anInsight({
    _id: 'other',
    publishedAt: '2025-01-01',
    categories: [{ title: 'AI', slug: 'ai' }],
  })
  it('keeps editorial pinned order under All without mutating the catalog', () => {
    const catalog = [pinned, newest, other]
    expect(filterInsights(catalog, null, 1).items.map((item) => item._id)).toEqual([
      'pinned',
      'newest',
      'other',
    ])
    expect(filterInsights(catalog, 'design', 1).items.map((item) => item._id)).toEqual([
      'newest',
      'pinned',
    ])
    expect(catalog.map((item) => item._id)).toEqual(['pinned', 'newest', 'other'])
  })
  it('paginates the selected category locally', () => {
    const catalog = Array.from({ length: 25 }, (_, index) => ({ ...newest, _id: String(index) }))
    const result = filterInsights([...catalog, other], 'design', 3)
    expect(result.items.map((item) => item._id)).toEqual(['24'])
    expect(result.pagination).toEqual({ page: 3, totalPages: 3 })
  })
  it('handles uncategorized cards without dropping them from All', () => {
    const catalog = [anInsight({ categories: null })]
    expect(filterInsights(catalog, null, 1).items).toHaveLength(1)
    expect(filterInsights(catalog, 'design', 1).items).toEqual([])
  })
})
