import { describe, expect, it } from 'vitest'

import type { ConversionIssue } from '../lib/htmlToPortableText'
import type { WpSeo, WpSiteSeo } from '../lib/yoast'
import { mapSeo, stripSiteSuffix } from './seo'

const SITE: WpSiteSeo = {
  siteName: 'O3',
  siteUrl: 'https://www.o3world.com',
  separator: '|',
  description: 'Digital experience consultants',
  ogDefaultImage: 'https://www.o3world.com/up/O3.png',
  twitterSite: 'o3world',
  twitterCardType: 'summary_large_image',
}

function wpSeo(overrides: Partial<WpSeo> = {}): WpSeo {
  return {
    titleOverride: '',
    titleRendered: 'A Doc | O3',
    descriptionOverride: '',
    descriptionRendered: '',
    canonicalOverride: '',
    canonicalRendered: 'https://www.o3world.com/a-doc/',
    noIndex: false,
    noFollow: false,
    ogImage: null,
    twitterImageOverride: '',
    ...overrides,
  }
}

describe('stripSiteSuffix', () => {
  it('drops the separator and site name Yoast appends', () => {
    expect(stripSiteSuffix('A Doc | O3', SITE)).toBe('A Doc')
  })

  it('leaves a title that never carried the suffix alone', () => {
    expect(stripSiteSuffix('A Doc', SITE)).toBe('A Doc')
  })

  it('only strips the suffix at the end, not a site name inside the title', () => {
    expect(stripSiteSuffix('Why | O3 stopped doing retainers', SITE)).toBe(
      'Why | O3 stopped doing retainers',
    )
  })
})

describe('mapSeo', () => {
  it('returns undefined when the document overrode nothing', () => {
    expect(mapSeo(wpSeo(), SITE, 'A Doc')).toBeUndefined()
  })

  it('ignores a title override that resolves to the document title', () => {
    // `%%title%%` is the site-wide default wearing an override's clothes; the
    // app composes the same string from `title` on its own.
    const seo = mapSeo(
      wpSeo({ titleOverride: '%%title%% %%sep%% %%sitename%%', titleRendered: 'A Doc | O3' }),
      SITE,
      'A Doc',
    )
    expect(seo).toBeUndefined()
  })

  it('notes and drops a title override whose template never resolved', () => {
    const notes: ConversionIssue[] = []
    const seo = mapSeo(
      wpSeo({
        titleOverride: '%%title%% %%page%% %%sep%% %%sitename%% % %',
        titleRendered: 'A Doc | O3 % %',
      }),
      SITE,
      'A Doc',
      notes,
    )
    expect(seo).toBeUndefined()
    expect(notes).toHaveLength(1)
    expect(notes[0]?.element).toBe('seo.title')
  })

  it('keeps a real title override', () => {
    expect(
      mapSeo(
        wpSeo({ titleOverride: 'Something else', titleRendered: 'Something else | O3' }),
        SITE,
        'A Doc',
      ),
    ).toEqual({ title: 'Something else' })
  })

  it('maps robots overrides but never the false defaults', () => {
    expect(mapSeo(wpSeo({ noIndex: true }), SITE, 'A Doc')).toEqual({ noIndex: true })
    expect(mapSeo(wpSeo({ noFollow: true }), SITE, 'A Doc')).toEqual({ noFollow: true })
    expect(mapSeo(wpSeo({ noIndex: false, noFollow: false }), SITE, 'A Doc')).toBeUndefined()
  })

  it('keeps a genuine cross-document canonical override', () => {
    expect(
      mapSeo(wpSeo({ canonicalOverride: 'https://example.com/original' }), SITE, 'A Doc'),
    ).toEqual({ canonical: 'https://example.com/original' })
  })

  it('never turns the rendered canonical into an override', () => {
    // It points at the WordPress host; migrating it would declare every new
    // page a duplicate of the old site.
    expect(
      mapSeo(wpSeo({ canonicalRendered: 'https://www.o3world.com/a-doc/' }), SITE, 'A Doc'),
    ).toBeUndefined()
  })

  it('migrates a per-document OG image as an asset marker', () => {
    expect(
      mapSeo(wpSeo({ ogImage: { url: 'http://www.o3world.com/up/share.png' } }), SITE, 'A Doc'),
    ).toEqual({ ogImage: { _type: 'image', _wpSrc: 'https://www.o3world.com/up/share.png' } })
  })
})
