import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'

import { buildCatchAllRoute } from '@/lib/content-routes/build'
import { CATCH_ALL_TYPES } from '@/content/documents'
import { aSeededPage, renderRoute, siteSettings, withSettings } from '@/test'

/**
 * The About (`1924:5344`) and Solutions (`1925:6138`) seeds, rendered through
 * the real page route from the **committed** JSON — the same durable proof
 * `home.render.test.tsx` gives the homepage.
 *
 * These two landed provisional in #46 and #47 because four of their bands had
 * no block that fit. #56 built the blocks; what these tests hold is that the
 * bands now reach the page through them rather than through a `layoutSection`
 * approximation — which is exactly what "no longer provisional" claims.
 */
const route = buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY)

async function render(slug: string) {
  return renderRoute(route, {
    data: withSettings(aSeededPage(slug), siteSettings()),
    params: { segments: [slug] },
  })
}

const about = await render('about')
const solutions = await render('solutions')

describe('the seeded About page', () => {
  const html = about.html
  const sections = (aSeededPage('about').sections ?? []) as { _type: string }[]

  it('renders every section in the array — none silently dropped', () => {
    expect(html.match(/data-sanity=/g) ?? []).toHaveLength(sections.length)
  })

  // The frame's band order (`1924:5344`): hero, Why O3, the disciplines grid,
  // the team, Culture, the beyond-client-services row, Careers, CTA.
  it('follows the frame’s band sequence, with the team band restored', () => {
    expect(sections.map((s) => s._type)).toEqual([
      'heroSection',
      'layoutSection',
      'disciplineGridSection',
      'personGridSection',
      'layoutSection',
      'layoutSection',
      'roleListSection',
      'ctaSection',
    ])
  })

  it.each([
    ['disciplines heading', '4 disciplines. One team.'],
    ['a discipline body', 'before a line of code is written'],
    ['team eyebrow', 'Our team'],
    ['team heading', 'The people who find it and build it.'],
    ['careers eyebrow', 'Careers'],
    ['a role', 'Senior Product Strategist'],
    ['a role location', 'Remote · Philadelphia'],
  ])('shows the frame’s %s', (_label, copy) => {
    expect(html).toContain(copy)
  })

  /**
   * The reason `personGridSection` is the highest-value of #56's four blocks:
   * 14 `person` documents came in with #17 and were rendered nowhere. These
   * names are dereferenced from the committed converted tree, not typed into
   * the page.
   */
  it('renders the migrated person documents the team band references', () => {
    expect(html).toContain('Mike Gadsby')
    expect(html).toContain('Christine Sheller')
    expect(html).toContain('Chief Experience Officer')
  })

  it('gives every role row its own Apply button', () => {
    expect(html.match(/>Apply</g) ?? []).toHaveLength(4)
  })

  it('gives the page a single h1', () => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })
})

describe('the seeded Solutions page', () => {
  const html = solutions.html
  const sections = (aSeededPage('solutions').sections ?? []) as { _type: string }[]

  it('renders every section in the array — none silently dropped', () => {
    expect(html.match(/data-sanity=/g) ?? []).toHaveLength(sections.length)
  })

  it('replaces the two-column approximation with the orbital diagram', () => {
    expect(sections.map((s) => s._type)).toEqual([
      'heroSection',
      'disciplineGridSection',
      'railPanelsSection',
      'ctaSection',
    ])
    expect(html).toContain('data-testid="orbital-diagram"')
  })

  /**
   * Slot order is the array's, not the author's — apex first, then the base
   * ring. The frame puts Strategy at the apex and reads AI, Engineering,
   * Design around the base, so the seed carries them in that order.
   */
  it('places the four disciplines in the frame’s slot order', () => {
    const disciplines = (
      sections.find((s) => s._type === 'disciplineGridSection') as
        { disciplines?: { heading?: string }[] } | undefined
    )?.disciplines
    expect(disciplines?.map((d) => d.heading)).toEqual(['Strategy', 'AI', 'Engineering', 'Design'])
  })

  it.each([
    ['apex discipline', 'The root of every engagement'],
    ['engagement rail', 'Three ways in.'],
  ])('shows the frame’s %s', (_label, copy) => {
    expect(html).toContain(copy)
  })
})
