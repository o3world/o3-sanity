import { describe, expect, it } from 'vitest'

import { siteSettings } from '@o3/render-kit'

import {
  blogPosting,
  breadcrumbs,
  organization,
  organizationId,
  serializeJsonLd,
  service,
} from './schema'

const BASE = 'https://www.o3world.com'

describe('organization', () => {
  const org = organization({
    baseUrl: BASE,
    settings: siteSettings({
      title: 'O3',
      legalName: 'O3 World, LLC',
      socialLinks: [
        {
          _type: 'socialLink',
          _key: 'a',
          label: 'LinkedIn',
          url: 'https://www.linkedin.com/company/o3-world/',
        },
        {
          _type: 'socialLink',
          _key: 'b',
          label: 'Instagram',
          url: 'https://www.instagram.com/o3world/',
        },
      ],
      defaultSeo: { _type: 'seo', description: 'A digital product agency.' },
    }),
  })

  it('names O3 World, with the legal name and site name from Site Settings', () => {
    expect(org).toMatchObject({
      '@type': 'Organization',
      '@id': `${BASE}/#organization`,
      name: 'O3 World',
      alternateName: 'O3',
      legalName: 'O3 World, LLC',
      url: `${BASE}/`,
      description: 'A digital product agency.',
    })
  })

  it('links the social profiles Site Settings lists', () => {
    expect(org.sameAs).toEqual([
      'https://www.linkedin.com/company/o3-world/',
      'https://www.instagram.com/o3world/',
    ])
  })

  it('carries the Philadelphia address the Contact page shows', () => {
    expect(org.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: '1339 Frankford Ave, Suite 3',
      addressLocality: 'Philadelphia',
      addressRegion: 'PA',
      postalCode: '19125',
      addressCountry: 'US',
    })
  })

  it('claims O3XO as a sub-organization, the other half of o3xo.ai’s parentOrganization', () => {
    expect(org.subOrganization).toEqual({
      '@type': 'Organization',
      name: 'O3XO',
      url: 'https://www.o3xo.ai',
    })
  })

  it('omits what Site Settings leaves empty rather than emitting nulls', () => {
    const bare = organization({
      baseUrl: BASE,
      settings: siteSettings({ legalName: null, socialLinks: [], defaultSeo: null }),
    })
    expect(bare).not.toHaveProperty('legalName')
    expect(bare).not.toHaveProperty('sameAs')
    expect(bare).not.toHaveProperty('description')
  })
})

describe('blogPosting', () => {
  const insight = {
    title: 'Why we build in Sanity',
    slug: 'why-sanity',
    excerpt: 'Notes on structured content.',
    publishedAt: '2026-06-01T12:00:00Z',
    _updatedAt: '2026-06-03T09:00:00Z',
    author: { name: 'Pat Example', title: 'Director' },
  }

  const url = `${BASE}/insights/why-sanity`

  it('describes the article from its own fields, at the URL it is given', () => {
    expect(
      blogPosting({ baseUrl: BASE, insight, url, imageUrl: 'https://cdn.example/hero.jpg' }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Why we build in Sanity',
      description: 'Notes on structured content.',
      url,
      mainEntityOfPage: url,
      datePublished: '2026-06-01T12:00:00Z',
      image: ['https://cdn.example/hero.jpg'],
      author: { '@type': 'Person', name: 'Pat Example', jobTitle: 'Director' },
      publisher: {
        '@type': 'Organization',
        '@id': organizationId(BASE),
        name: 'O3 World',
        url: `${BASE}/`,
      },
    })
  })

  it('credits O3 World when the article has no byline, as 232 of 272 do not', () => {
    const post = blogPosting({
      baseUrl: BASE,
      insight: { ...insight, author: null },
      url,
      imageUrl: null,
    })
    expect(post.author).toEqual({
      '@type': 'Organization',
      '@id': organizationId(BASE),
      name: 'O3 World',
      url: `${BASE}/`,
    })
    expect(post).not.toHaveProperty('image')
  })

  it('claims no dateModified: _updatedAt moves on migration writes, not only edits', () => {
    const post = blogPosting({ baseUrl: BASE, insight, url, imageUrl: null })
    expect(post).not.toHaveProperty('dateModified')
  })
})

describe('breadcrumbs', () => {
  it('numbers each crumb from Home and makes every URL absolute', () => {
    expect(
      breadcrumbs(BASE, [
        { name: 'Insights', path: '/insights' },
        { name: 'Why we build in Sanity', path: '/insights/why-sanity' },
      ]),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/` },
        { '@type': 'ListItem', position: 2, name: 'Insights', item: `${BASE}/insights` },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Why we build in Sanity',
          item: `${BASE}/insights/why-sanity`,
        },
      ],
    })
  })
})

describe('breadcrumbs with an untitled crumb', () => {
  it('drops the crumb rather than emit a ListItem with no name', () => {
    const list = breadcrumbs(BASE, [
      { name: '  ', path: '/solutions' },
      { name: 'Design', path: '/solutions/design' },
    ])
    expect(list.itemListElement.map((item) => [item.position, item.name])).toEqual([
      [1, 'Home'],
      [2, 'Design'],
    ])
  })
})

describe('service', () => {
  it('names the service after the page and credits O3 World as the provider', () => {
    expect(
      service({
        baseUrl: BASE,
        name: 'Sanity',
        description: 'Sanity builds.',
        path: '/partners/sanity',
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Sanity',
      description: 'Sanity builds.',
      url: `${BASE}/partners/sanity`,
      provider: {
        '@type': 'Organization',
        '@id': organizationId(BASE),
        name: 'O3 World',
        url: `${BASE}/`,
      },
      areaServed: 'US',
    })
  })
})

describe('serializeJsonLd', () => {
  it('cannot close the script tag it is written into', () => {
    const out = serializeJsonLd({ headline: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('</script>')
    expect(JSON.parse(out)).toEqual({ headline: '</script><script>alert(1)</script>' })
  })

  it('strips the stega markers a draft read embeds in every string', () => {
    const marker = '​‌‍﻿'.repeat(6)
    const out = serializeJsonLd({ headline: `Hello${marker}`, crumbs: [{ name: `Home${marker}` }] })
    expect(JSON.parse(out)).toEqual({ headline: 'Hello', crumbs: [{ name: 'Home' }] })
  })
})
