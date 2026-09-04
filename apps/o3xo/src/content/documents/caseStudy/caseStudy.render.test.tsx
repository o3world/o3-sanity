import { describe, expect, it } from 'vitest'

import { buildDetailRoute } from '@o3/content-runtime/routes'
import { aCaseStudy, expectNotFound, renderRoute, siteSettings, withSettings } from '@/test'

import { caseStudy } from './entry'

/**
 * The case-study detail route. This is the collection the two brands do not
 * agree on — O3 serves it at `/work`, O3XO at `/case-studies` (ADR 0028) — so
 * every URL the route emits is worth pinning here, in a project that runs with
 * `NEXT_PUBLIC_BRAND=o3xo`. Unpinned, `brandConfig()` answers `o3` and each of
 * these assertions would be checking the wrong site.
 */
const route = buildDetailRoute(caseStudy)

function render(data: unknown, slug = 'a-case-study') {
  return renderRoute(route, {
    data: withSettings(data, siteSettings({ title: 'O3XO' })),
    params: { slug },
  })
}

describe('the case-study detail route', () => {
  it('displays the fields a reader came for', async () => {
    const { html } = await render(
      aCaseStudy({
        title: 'Two brands, one set of blocks',
        narrativeHeadline: 'The deeper problem was the second site.',
        client: { name: 'O3XO', logo: null },
        stats: [{ _key: 's1', _type: 'stat', value: '2', label: 'Brands' }],
      }),
    )

    expect(html).toContain('Two brands, one set of blocks')
    expect(html).toContain('The deeper problem was the second site.')
    expect(html).toContain('O3XO')
    expect(html).toContain('Brands')
  })

  it('canonicalises at this brand’s prefix, not O3’s', async () => {
    const { metadata } = await render(aCaseStudy({ slug: 'a-second-brand' }), 'a-second-brand')
    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/case-studies/a-second-brand')
  })

  /** `NextCaseBand` builds its href through `hrefForDoc`, which reads the prefix. */
  it('links the next project at this brand’s prefix', async () => {
    const { html } = await render(
      aCaseStudy({
        next: {
          _id: 'caseStudy-the-one-after',
          _type: 'caseStudy',
          title: 'The one after',
          slug: 'the-one-after',
          narrativeHeadline: null,
          headlineStat: null,
          cardMedia: null,
          client: null,
          industries: null,
          industryDetail: null,
        },
      }),
    )

    expect(html).toContain('href="/case-studies/the-one-after"')
    expect(html).not.toContain('href="/work/the-one-after"')
  })

  it('404s when nothing matches the slug', async () => {
    await expectNotFound(route, {
      data: withSettings(null, siteSettings({ title: 'O3XO' })),
      params: { slug: 'nope' },
    })
  })
})
