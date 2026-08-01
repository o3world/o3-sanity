import { describe, expect, it } from 'vitest'

import { buildDetailRoute } from '@/lib/content-routes/build'
import { aTranslatedCaseStudy, renderRoute, siteSettings, withSettings } from '@/test'

import { caseStudy } from './entry'

/**
 * The agent-translated case study (#21) through the real `/work/[slug]` route.
 *
 * Translated documents load **draft-only**, so nothing about them is visible
 * on the published site — this and the Studio side-by-side are the two places
 * a reviewer can actually see the result. The assertions are about the
 * restructuring surviving: chapters keep their kickers, the stats keep their
 * exact figures, the hero renders.
 */
const route = buildDetailRoute(caseStudy)
const doc = aTranslatedCaseStudy('la-colombe')

const rendered = await renderRoute(route, {
  data: withSettings(doc, siteSettings()),
  params: { slug: 'la-colombe' },
})
const html = rendered.html

describe('the translated La Colombe case study', () => {
  it('renders the narrative headline the translation derived', () => {
    expect(html).toContain('outstanding brand experience')
  })

  it('renders both chapters with their kickers', () => {
    for (const chapter of doc.chapters as { kicker: string; title: string }[]) {
      expect(html, `missing kicker ${chapter.kicker}`).toContain(chapter.kicker)
      expect(html, `missing title ${chapter.title}`).toContain(chapter.title)
    }
  })

  it('renders every stat with its exact figure', () => {
    // Verbatim from the source, typo included — the flag says so.
    for (const stat of doc.stats as { value: string; label: string }[]) {
      expect(html).toContain(stat.value)
    }
    expect(html).toContain('conversation rate')
  })

  it('renders the client and industry eyebrow', () => {
    expect(html).toContain('Consumer Goods')
    expect(html).toContain('Direct-to-Consumer Coffee')
  })

  it('renders the hero media and the carousel images as sections', () => {
    const extras = (doc.extraSections ?? []) as unknown[]
    expect(extras).toHaveLength(3)
    // hero + one per extra section.
    expect((html.match(/<img\b/g) ?? []).length).toBeGreaterThanOrEqual(extras.length + 1)
  })

  it('keeps the URL WordPress serves it at (#26)', () => {
    expect(rendered.metadata.alternates?.canonical).toBe('http://localhost:3000/work/la-colombe')
  })

  it('carries the migrated SEO description', () => {
    expect(rendered.metadata.description).toContain('digital customer experiences O3 designed')
  })
})
