import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'

import { buildCatchAllRoute } from '@o3/content-runtime/routes'
import { CATCH_ALL_TYPES } from '@/content/documents'
import { aMigratedPage, migratedPageSlugs, renderRoute, siteSettings, withSettings } from '@/test'

/**
 * The migrated utility pages (#18) through the **catch-all** route — the same
 * `[...segments]/page.tsx` a visitor hits, not a shortcut.
 *
 * This is the first exercise of `page` sections through the pipeline, so the
 * question is whether the two-tier model survives a round trip: WordPress ACF
 * → `layoutSection` + `richText` → Portable Text → rendered HTML, with the
 * document's own heading structure intact.
 */
const route = buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY)
const slugs = migratedPageSlugs()

describe('migrated utility pages', () => {
  it('has pages to check', () => {
    expect(slugs.length).toBeGreaterThan(0)
  })

  it.each(slugs)('%s renders through the catch-all route', async (slug) => {
    const doc = aMigratedPage(slug)
    const { html } = await renderRoute(route, {
      data: withSettings(doc, siteSettings()),
      params: { segments: slug.split('/') },
    })

    // Exactly one h1 — heroSection supplies it; a page without one has no
    // document heading at all.
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
    expect(html).toContain(doc.title as string)

    // Every section dispatched, none silently dropped.
    const sections = (doc.sections ?? []) as unknown[]
    expect(html.match(/data-sanity=/g) ?? []).toHaveLength(sections.length)
  })

  it('preserves the privacy policy’s heading structure and length', async () => {
    const doc = aMigratedPage('privacy-policy')
    const { html } = await renderRoute(route, {
      data: withSettings(doc, siteSettings()),
      params: { segments: ['privacy-policy'] },
    })

    // 17,000 characters of legal text nobody will retype: the check that
    // matters is that all of it arrived, with its structure.
    const body = (doc.sections as { items?: { body?: { style?: string }[] }[] }[])[1]?.items?.[0]
      ?.body
    const headings = (body ?? []).filter((b) => b.style === 'h2' || b.style === 'h3')
    expect(headings.length).toBeGreaterThan(20)
    expect(html.match(/<h2[\s>]/g) ?? []).toHaveLength(
      (body ?? []).filter((b) => b.style === 'h2').length,
    )
    expect(html.match(/<h3[\s>]/g) ?? []).toHaveLength(
      (body ?? []).filter((b) => b.style === 'h3').length,
    )
  })

  it('serves each page at the path WordPress serves it at (#26)', async () => {
    for (const slug of slugs) {
      const doc = aMigratedPage(slug)
      const { metadata } = await renderRoute(route, {
        data: withSettings(doc, siteSettings()),
        params: { segments: slug.split('/') },
      })
      expect(metadata.alternates?.canonical).toBe(`http://localhost:3000/${slug}`)
    }
  })
})
