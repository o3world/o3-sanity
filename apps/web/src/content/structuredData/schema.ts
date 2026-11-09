import { stegaClean } from '@sanity/client/stega'

import { absoluteUrl } from '@o3/content-runtime/base-url'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

/**
 * Schema.org JSON-LD for o3world.com: who O3 is, and what each page is.
 *
 * Every value a document or Site Settings holds comes from there, so the
 * structured data and the meta tags read the same fields. `ORGANIZATION` is
 * what no Sanity field holds yet. Its address is the one the Contact page
 * shows, and O3XO is a sub-organization because o3xo.ai declares O3 World as
 * its parentOrganization (OWSW-120).
 */
const ORGANIZATION = {
  name: 'O3 World',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '1339 Frankford Ave, Suite 3',
    addressLocality: 'Philadelphia',
    addressRegion: 'PA',
    postalCode: '19125',
    addressCountry: 'US',
  },
  subOrganization: { '@type': 'Organization', name: 'O3XO', url: 'https://www.o3xo.ai' },
} as const

const CONTEXT = 'https://schema.org'

type JsonLd = Record<string, unknown>

/** Drops empty values so a missing field is absent, never `null` or `[]`. */
function compact<T extends JsonLd>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0),
    ),
  ) as T
}

export function organizationId(baseUrl: string): string {
  return `${baseUrl}/#organization`
}

/** The short form other nodes point at as publisher, author or provider. */
function organizationRef(baseUrl: string) {
  return {
    '@type': 'Organization',
    '@id': organizationId(baseUrl),
    name: ORGANIZATION.name,
    url: absoluteUrl('/', baseUrl),
  }
}

export function organization({
  baseUrl,
  settings,
}: {
  baseUrl: string
  settings: SITE_SETTINGS_QUERY_RESULT
}) {
  const siteTitle = settings?.title?.trim()
  return compact({
    '@context': CONTEXT,
    '@type': 'Organization',
    '@id': organizationId(baseUrl),
    name: ORGANIZATION.name,
    alternateName: siteTitle?.toLowerCase() === ORGANIZATION.name.toLowerCase() ? null : siteTitle,
    legalName: settings?.legalName?.trim(),
    url: absoluteUrl('/', baseUrl),
    logo: absoluteUrl('/apple-icon.png', baseUrl),
    description: settings?.defaultSeo?.description?.trim(),
    address: ORGANIZATION.address,
    sameAs: (settings?.socialLinks ?? [])
      .map((link) => link.url)
      .filter((url): url is string => !!url),
    subOrganization: ORGANIZATION.subOrganization,
  })
}

export interface BlogPostingSource {
  readonly title?: string | null
  readonly excerpt?: string | null
  readonly publishedAt?: string | null
  readonly author?: { readonly name?: string | null; readonly title?: string | null } | null
}

/**
 * The article as a BlogPosting, at `url`: the canonical URL its meta tags
 * name. No `dateModified`, because `_updatedAt` also moves when a migration
 * writes the document, and no field records the last editorial change.
 */
export function blogPosting({
  baseUrl,
  insight,
  url,
  imageUrl,
}: {
  baseUrl: string
  insight: BlogPostingSource
  url: string
  imageUrl: string | null
}) {
  const author = insight.author?.name
    ? compact({ '@type': 'Person', name: insight.author.name, jobTitle: insight.author.title })
    : organizationRef(baseUrl)

  return compact({
    '@context': CONTEXT,
    '@type': 'BlogPosting',
    headline: insight.title,
    description: insight.excerpt,
    url,
    mainEntityOfPage: url,
    datePublished: insight.publishedAt,
    image: imageUrl ? [imageUrl] : null,
    author,
    publisher: organizationRef(baseUrl),
  })
}

export interface Crumb {
  readonly name: string
  /** Route path with a leading slash. */
  readonly path: string
}

/**
 * The trail from Home to the page; Home is added here, not by callers. A
 * crumb with a blank name is dropped, since a ListItem without one is invalid.
 */
export function breadcrumbs(baseUrl: string, crumbs: readonly Crumb[]) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...crumbs]
      .filter((crumb) => crumb.name.trim() !== '')
      .map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name.trim(),
        item: absoluteUrl(crumb.path, baseUrl),
      })),
  }
}

export function service({
  baseUrl,
  name,
  description,
  path,
}: {
  baseUrl: string
  name: string
  description?: string | null
  path: string
}) {
  return compact({
    '@context': CONTEXT,
    '@type': 'Service',
    name,
    description,
    url: absoluteUrl(path, baseUrl),
    provider: organizationRef(baseUrl),
    areaServed: 'US',
  })
}

/**
 * JSON for an inline `<script>`. Stega markers a draft read embeds are
 * stripped, and every `<` is written as its JSON unicode escape, which reads
 * back as the same character, so no value can close the tag it sits in.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(stegaClean(data)).replace(/</g, '\\u003c')
}
