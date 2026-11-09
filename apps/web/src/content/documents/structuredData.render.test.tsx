import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'

import {
  buildCatchAllRoute,
  buildDetailRoute,
  buildSingletonRoute,
} from '@o3/content-runtime/routes'
import { CATCH_ALL_TYPES } from '@/content/documents'
import {
  aMigratedInsight,
  aMigratedPage,
  aSeededPage,
  aTranslatedCaseStudy,
  renderRoute,
  siteSettings,
  withSettings,
} from '@/test'

import { caseStudy } from './caseStudy/entry'
import { insight } from './insight/entry'
import { home } from './page/entry'

/**
 * JSON-LD in the server-rendered HTML of each template (OWSW-78). Answer
 * engines read view-source, so the check is the rendered string, not a
 * component in isolation.
 */
function jsonLdOf(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (match) => JSON.parse(match[1]!) as Record<string, unknown>,
  )
}

function ofType(html: string, type: string) {
  return jsonLdOf(html).filter((node) => node['@type'] === type)
}

function crumbNames(html: string): string[] {
  const [list] = ofType(html, 'BreadcrumbList')
  return ((list?.itemListElement ?? []) as { name: string }[]).map((item) => item.name)
}

function crumbUrls(html: string): string[] {
  const [list] = ofType(html, 'BreadcrumbList')
  return ((list?.itemListElement ?? []) as { item: string }[]).map((item) => item.item)
}

const catchAll = buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY)

async function renderPage(doc: Record<string, unknown>, path: string) {
  return (
    await renderRoute(catchAll, {
      data: withSettings(doc, siteSettings()),
      params: { path: path.split('/') },
    })
  ).html
}

describe('the homepage', async () => {
  const { html } = await renderRoute(buildSingletonRoute(home), {
    data: withSettings(aSeededPage('index'), siteSettings()),
  })

  it('declares O3 World as an Organization', () => {
    expect(ofType(html, 'Organization')).toEqual([
      expect.objectContaining({ name: 'O3 World', legalName: 'O3 World, LLC' }),
    ])
  })

  it('has no breadcrumb trail, because it is where every trail starts', () => {
    expect(ofType(html, 'BreadcrumbList')).toEqual([])
  })
})

describe('an insight', async () => {
  const doc = aMigratedInsight()
  const { html } = await renderRoute(buildDetailRoute(insight), {
    data: withSettings(doc, siteSettings()),
    params: { slug: doc.slug as string },
  })

  it('is a BlogPosting headlined with its title, dated, and at its own URL', () => {
    expect(ofType(html, 'BlogPosting')).toEqual([
      expect.objectContaining({
        headline: doc.title,
        datePublished: doc.publishedAt,
        url: expect.stringMatching(new RegExp(`/insights/${doc.slug}$`)),
      }),
    ])
  })

  it('sits under Insights in the breadcrumb trail', () => {
    expect(crumbNames(html)).toEqual(['Home', 'Insights', doc.title])
    expect(crumbUrls(html).at(-1)).toMatch(new RegExp(`/insights/${doc.slug}$`))
  })

  it('names the canonical URL when the editor overrode it, as the canonical tag does', async () => {
    const canonical = 'https://www.o3world.com/insights/the-original'
    const overridden = { ...doc, seo: { ...(doc.seo as object), canonical } }
    const { html: withCanonical, metadata } = await renderRoute(buildDetailRoute(insight), {
      data: withSettings(overridden, siteSettings()),
      params: { slug: doc.slug as string },
    })
    expect(metadata.alternates?.canonical).toBe(canonical)
    expect(ofType(withCanonical, 'BlogPosting')).toEqual([
      expect.objectContaining({ url: canonical, mainEntityOfPage: canonical }),
    ])
  })
})

describe('a case study', async () => {
  // Production titles are headlines; the committed fixture predates that.
  const doc = { ...aTranslatedCaseStudy('best-egg'), title: 'Making finances friendlier' }
  const { html } = await renderRoute(buildDetailRoute(caseStudy), {
    data: withSettings(doc, siteSettings()),
    params: { slug: 'best-egg' },
  })

  it('sits under Work, named for its client — its title is a headline, not a name', () => {
    expect(crumbNames(html)).toEqual(['Home', 'Work', 'Best Egg'])
    expect(crumbUrls(html).at(-1)).toMatch(/\/work\/best-egg$/)
  })
})

describe('a page', () => {
  it('describes a service page as a Service O3 World provides', async () => {
    const html = await renderPage(
      aSeededPage('solutions-software-engineering'),
      'solutions/software-engineering',
    )
    expect(ofType(html, 'Service')).toEqual([
      expect.objectContaining({ provider: expect.objectContaining({ name: 'O3 World' }) }),
    ])
  })

  it('describes each partner page as a Service', async () => {
    const html = await renderPage(aSeededPage('partners-sanity'), 'partners/sanity')
    expect(ofType(html, 'Service')).toHaveLength(1)
  })

  it('reads the page type, not the URL: an overview under /solutions is no Service', async () => {
    const html = await renderPage(aSeededPage('solutions'), 'solutions')
    expect(ofType(html, 'Service')).toEqual([])
  })

  it('still recognises a service page whose type a draft read stega-encoded', async () => {
    const doc = {
      ...aSeededPage('solutions-software-engineering'),
      pageType: `service${'​‌‍﻿'.repeat(6)}`,
    }
    const html = await renderPage(doc, 'solutions/software-engineering')
    expect(ofType(html, 'Service')).toHaveLength(1)
  })

  it('does not call a policy page a Service', async () => {
    const html = await renderPage(aMigratedPage('privacy-policy'), 'privacy-policy')
    expect(ofType(html, 'Service')).toEqual([])
  })

  it('puts a nested page under the parent page that exists', async () => {
    const page = aSeededPage('solutions-software-engineering')
    const doc = { ...page, parent: { title: 'Solutions', slug: 'solutions' } }
    const html = await renderPage(doc, 'solutions/software-engineering')
    expect(crumbNames(html)).toEqual(['Home', 'Solutions', page.title])
    expect(crumbUrls(html).slice(1)).toEqual([
      expect.stringMatching(/\/solutions$/),
      expect.stringMatching(/\/solutions\/software-engineering$/),
    ])
  })

  it('skips a parent segment that has no page, as /partners has none', async () => {
    const doc = aSeededPage('partners-sanity')
    const html = await renderPage(doc, 'partners/sanity')
    expect(crumbNames(html)).toEqual(['Home', doc.title])
  })
})
