import { describe, expect, it } from 'vitest'

import { renderRoute } from '@/test'

import sitemap from './sitemap'

/** The sitemap's URLs, read through the render layer's dataset stub. */
async function sitemapUrls(data: unknown): Promise<string[]> {
  let urls: string[] = []
  await renderRoute(
    {
      generateMetadata: async () => ({}),
      Page: async () => {
        urls = (await sitemap()).map((entry) => entry.url)
        return <></>
      },
    },
    { data },
  )
  return urls
}

describe('the sitemap', () => {
  it('lists a coded landing page once its service offer is published', async () => {
    const urls = await sitemapUrls({
      insights: [],
      caseStudies: [],
      pages: [],
      serviceOffers: [{ slug: 'ai-visibility-review', _updatedAt: '2026-11-13T00:00:00Z' }],
    })
    expect(urls.filter((url) => url.endsWith('/ai-visibility-review'))).toHaveLength(1)
  })

  it('leaves out an offer whose slug no coded route serves', async () => {
    const urls = await sitemapUrls({
      insights: [],
      caseStudies: [],
      pages: [],
      serviceOffers: [{ slug: 'nothing-renders-this', _updatedAt: '2026-11-13T00:00:00Z' }],
    })
    expect(urls.some((url) => url.endsWith('/nothing-renders-this'))).toBe(false)
  })

  it('lists the offer’s URL once even when a page claims the same slug', async () => {
    const urls = await sitemapUrls({
      insights: [],
      caseStudies: [],
      pages: [{ slug: 'ai-visibility-review', _updatedAt: '2026-11-01T00:00:00Z' }],
      serviceOffers: [{ slug: 'ai-visibility-review', _updatedAt: '2026-11-13T00:00:00Z' }],
    })
    expect(urls.filter((url) => url.endsWith('/ai-visibility-review'))).toHaveLength(1)
  })

  it('never lists one URL twice', async () => {
    const urls = await sitemapUrls({
      insights: [],
      caseStudies: [],
      pages: [
        { slug: 'about', _updatedAt: '2026-11-01T00:00:00Z' },
        { slug: 'about', _updatedAt: '2026-11-02T00:00:00Z' },
        { slug: 'index', _updatedAt: '2026-11-02T00:00:00Z' },
      ],
      serviceOffers: [],
    })
    expect(urls.length).toBe(new Set(urls).size)
  })
})
