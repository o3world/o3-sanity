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

  it('numbers the chapters from array order, not from the content', () => {
    // The frame draws a bare kicker ("SECTION HEADER", `1890:3861`); the
    // numeral is the renderer's, derived from position (CONTEXT.md).
    expect(html).toContain('01 — Opportunity')
    expect(html).toContain('02 — Solution')
  })

  it('opens on the client’s name, which is what the hero eyebrow holds', () => {
    // `1710:2304` reads "IRONMAN" — the client. The industry eyebrow
    // ("Consumer Goods · Direct-to-Consumer Coffee") is the CARD's, drawn by
    // CaseStudyCard on /work and Home; the detail frame has no region for it.
    expect(html).toContain('La Colombe Coffee Roasters')
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

/**
 * The band that closes the frame (`1710:2609`). `aTranslatedCaseStudy` leaves
 * `next` null — nothing else is loaded beside it — so the neighbour is
 * supplied here, which is also what pins the `client->{name}` the projection
 * had to grow for the "NEXT PROJECT - IRONMAN" kicker.
 *
 * The slug is IRONMAN's real one. `/work/ironman` was a seed placeholder until
 * ADR 0016 deleted it, and a fixture that keeps using a URL the site no longer
 * has teaches the shape wrong.
 */
describe('the next-project band', () => {
  it('links the neighbouring case study and names its client', async () => {
    const { html } = await renderRoute(route, {
      data: withSettings(
        {
          ...doc,
          next: {
            title: 'Built for the long run.',
            slug: 'case-studies-ironman-digital-experience-drupal-acquia',
            heroMedia: (doc as { heroMedia?: unknown }).heroMedia,
            client: { name: 'IRONMAN' },
          },
        },
        siteSettings(),
      ),
      params: { slug: 'la-colombe' },
    })

    expect(html).toContain('Next project — IRONMAN')
    expect(html).toContain('Built for the long run.')
    expect(html).toContain('href="/work/case-studies-ironman-digital-experience-drupal-acquia"')
  })

  it('renders nothing when there is no neighbour', () => {
    expect(html).not.toContain('Next project')
  })
})
