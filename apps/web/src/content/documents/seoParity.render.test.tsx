import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'

import { buildDetailRoute, buildCatchAllRoute } from '@/lib/content-routes/build'
import { CATCH_ALL_TYPES } from '@/content/documents'
import {
  aMigratedPage,
  aMigratedPerspective,
  aTranslatedCaseStudy,
  renderRoute,
  siteSettings,
  withSettings,
} from '@/test'

import { caseStudy } from './caseStudy/entry'
import { perspective } from './perspective/entry'

/**
 * SEO parity with WordPress, spot-checked end to end (#24).
 *
 * `seo.ts` is unit-testable and `mapSeo` has its own tests, but neither
 * answers the question the ticket asks: does a document that overrode its
 * Yoast title in WordPress in 2021 actually serve that title, that
 * description and that social image through the real route today? Three
 * documents are checked because there are three ways a document gets here —
 * converted, translated, and a migrated page — and each has its own entry
 * with its own `DocumentSeo`.
 *
 * Robots parity over the whole corpus (all 300 documents, not three) is a
 * corpus invariant and lives in `tools/migration/src/corpus.test.ts`.
 */

/**
 * Committed with a title override, a description override AND the rare
 * per-document OG image (6 of 272 have one) — the only shape that exercises
 * every branch of the chain at once.
 */
const B2C_SLUG = 'creating-success-in-a-business-to-consumer-environment'
const b2c = await renderRoute(buildDetailRoute(perspective), {
  data: withSettings(aMigratedPerspective(B2C_SLUG), siteSettings()),
  params: { slug: B2C_SLUG },
})

const eHazard = await renderRoute(buildDetailRoute(caseStudy), {
  data: withSettings(
    aTranslatedCaseStudy('case-studies-ai-electrical-safety-e-hazard'),
    siteSettings(),
  ),
  params: { slug: 'case-studies-ai-electrical-safety-e-hazard' },
})

const privacy = await renderRoute(buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY), {
  data: withSettings(aMigratedPage('privacy-policy'), siteSettings()),
  params: { segments: ['privacy-policy'] },
})

const anyPerspective = await renderRoute(buildDetailRoute(perspective), {
  data: withSettings(aMigratedPerspective(), siteSettings()),
  params: { slug: 'any' },
})

describe('a converted perspective that overrode all three Yoast fields', () => {
  it('serves the Yoast title override, not the post title', () => {
    expect(b2c.metadata.title).toBe(
      'Insurance providers pivot to business-to-consumer (B2C) models.',
    )
  })

  it('serves the Yoast meta description', () => {
    expect(b2c.metadata.description).toContain('insurers adopting B2C models')
  })

  // Yoast resolved every document's OG image through the site-wide default, so
  // `mapSeo` keeps only the six real overrides. This is one of them.
  it('serves the per-document OG image override', () => {
    const images = b2c.metadata.openGraph?.images
    expect(Array.isArray(images) ? images.length : 0).toBe(1)
  })

  it('appends the site name to og:title, which no template can do for it', () => {
    expect((b2c.metadata.openGraph as { title?: string } | undefined)?.title).toBe(
      'Insurance providers pivot to business-to-consumer (B2C) models. | O3',
    )
  })

  // Dated, authored writing was an `article` on the old site; keeping it is
  // what makes a share render as an article card.
  it('keeps the article OpenGraph type', () => {
    expect((b2c.metadata.openGraph as { type?: string } | undefined)?.type).toBe('article')
  })

  it('is its own canonical, and never WordPress’s', () => {
    expect(b2c.metadata.alternates?.canonical).toBe(
      'http://localhost:3000/perspectives/creating-success-in-a-business-to-consumer-environment',
    )
  })
})

describe('a translated case study', () => {
  it('serves the Yoast title override the translation carried across', () => {
    expect(eHazard.metadata.title).toBe('How AI transformed certificate management for e-Hazard')
  })

  it('serves the Yoast meta description', () => {
    expect(eHazard.metadata.description).toContain('AI operations transformation')
  })

  // No case study overrode its OG image, so the hero is the fallback — which
  // is the tier that stops a share rendering with no picture at all.
  it('falls back to the hero image for the social card', () => {
    const images = eHazard.metadata.openGraph?.images
    expect(Array.isArray(images) ? images.length : 0).toBe(1)
  })

  it('keeps the long WordPress path rather than a tidier slug', () => {
    expect(eHazard.metadata.alternates?.canonical).toBe(
      'http://localhost:3000/work/case-studies-ai-electrical-safety-e-hazard',
    )
  })
})

describe('a migrated page', () => {
  it('serves the Yoast meta description', () => {
    expect(privacy.metadata.description).toContain('committed to protecting and respecting')
  })

  // The page never overrode its title, so the document's own title stands and
  // the root layout appends the site name.
  it('falls back to the document title when Yoast overrode nothing', () => {
    expect(privacy.metadata.title).toBe('Privacy Policy')
  })

  it('is a website rather than an article', () => {
    expect((privacy.metadata.openGraph as { type?: string } | undefined)?.type).toBe('website')
  })
})

describe('robots parity', () => {
  it('indexes and follows, with the crawl maxima Yoast emitted', () => {
    const robots = anyPerspective.metadata.robots as {
      index?: boolean
      follow?: boolean
      googleBot?: Record<string, unknown>
    }
    expect(robots.index).toBe(true)
    expect(robots.follow).toBe(true)
    expect(robots.googleBot?.['max-image-preview']).toBe('large')
    expect(robots.googleBot?.['max-snippet']).toBe(-1)
  })

  // The corpus half — that no committed document carries noIndex/noFollow at
  // all — is a corpus invariant, so it lives in the unit layer with the rest
  // of them: `tools/migration/src/corpus.test.ts` (ADR 0004).
})
