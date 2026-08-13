import { describe, expect, it } from 'vitest'

import { buildDetailRoute } from '@/lib/content-routes/build'
import { aTranslatedCaseStudy, renderRoute, siteSettings, withSettings } from '@/test'

import { caseStudy } from './entry'

/**
 * The agent-translated case study (#21) through the real `/work/[slug]` route.
 *
 * Translated documents load **published** (ADR 0016), so this is no longer a
 * reviewer's only window onto them — it is the check that the restructuring
 * survives a rebuild: chapters keep their kickers, the stats keep their exact
 * figures, the hero renders. It reads the committed JSON, which is the source
 * of truth; the dataset is disposable.
 *
 * Since ADR 0018 the middle of the document is **one interleaved `story`
 * array**, so the assertions below check the two halves separately: the
 * chapters by their content, and the bands between them by the fact that they
 * render at all where they sit.
 */
const route = buildDetailRoute(caseStudy)
const doc = aTranslatedCaseStudy('la-colombe')

type StoryMember = { _type: string; [key: string]: unknown }
const story = (doc.story ?? []) as StoryMember[]
const chapters = story.filter((member) => member._type === 'chapter') as unknown as {
  kicker: string
  title: string
  details?: { label: string; body: string }[]
}[]
const bands = story.filter((member) => member._type !== 'chapter')

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
    expect(chapters.length).toBeGreaterThan(1)
    for (const chapter of chapters) {
      expect(html, `missing kicker ${chapter.kicker}`).toContain(chapter.kicker)
      expect(html, `missing title ${chapter.title}`).toContain(chapter.title)
    }
  })

  it('renders the chapter’s details rows as a term list', () => {
    // `2274:4009` — the Strategy / Design / Research breakdown under the
    // first chapter's prose. jsdom is not involved: this is server HTML, so a
    // row hidden behind script would simply not be here.
    const details = chapters[0]?.details ?? []
    expect(details.length).toBeGreaterThan(0)
    for (const detail of details) {
      expect(html, `missing detail ${detail.label}`).toContain(detail.label)
      expect(html).toContain(detail.body.slice(0, 40))
    }
    expect(html).toContain('<dl')
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

  it('weaves the bands between the chapters rather than after them', () => {
    // The point of ADR 0018. `story` here is chapter → media → chapter →
    // screen grid, so the first band has to land strictly BETWEEN the two
    // chapter titles — which is what the old appended `extraSections` could
    // not do, since anything appended sits after every chapter.
    //
    // The band is found by its OWN alt text, read off the fixture. Counting
    // `<img` would not distinguish it from the hero (always first) or the
    // screen grid (always last), so the appended layout would pass too.
    const firstBand = story.find((member) => member._type !== 'chapter') as {
      media?: { alt?: string }
    }
    const bandAlt = firstBand.media?.alt
    expect(
      bandAlt,
      'the first band should be the media section, which carries alt text',
    ).toBeTruthy()

    const firstChapterAt = html.indexOf(chapters[0]!.title)
    const bandAt = html.indexOf(bandAlt!)
    const secondChapterAt = html.indexOf(chapters[1]!.title)

    expect(firstChapterAt).toBeGreaterThan(-1)
    expect(bandAt).toBeGreaterThan(firstChapterAt)
    expect(secondChapterAt).toBeGreaterThan(bandAt)
  })

  it('renders the hero, and every band that carries a picture', () => {
    expect(bands.length).toBeGreaterThan(0)
    // hero + one per media band + one per screen in the grid.
    const screens = bands.flatMap((band) => (band.screens as unknown[] | undefined) ?? [])
    const mediaBands = bands.filter((band) => band._type === 'mediaSection')
    expect((html.match(/<img\b/g) ?? []).length).toBeGreaterThanOrEqual(
      mediaBands.length + screens.length + 1,
    )
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
