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

function home(baseUrl: string): string {
  return `${baseUrl}/`
}

function absolute(baseUrl: string, path: string): string {
  return path === '/' ? home(baseUrl) : `${baseUrl}${path}`
}

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
    url: home(baseUrl),
  }
}

export function organization({
  baseUrl,
  settings,
}: {
  baseUrl: string
  settings: SITE_SETTINGS_QUERY_RESULT
}) {
  return compact({
    '@context': CONTEXT,
    '@type': 'Organization',
    '@id': organizationId(baseUrl),
    name: ORGANIZATION.name,
    alternateName: settings?.title?.trim(),
    legalName: settings?.legalName?.trim(),
    url: home(baseUrl),
    logo: `${baseUrl}/apple-icon.png`,
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
  readonly slug?: string | null
  readonly excerpt?: string | null
  readonly publishedAt?: string | null
  readonly _updatedAt?: string | null
  readonly author?: { readonly name?: string | null; readonly title?: string | null } | null
}

export function blogPosting({
  baseUrl,
  insight,
  imageUrl,
}: {
  baseUrl: string
  insight: BlogPostingSource
  imageUrl: string | null
}) {
  const url = absolute(baseUrl, `/insights/${insight.slug}`)
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
    dateModified: insight._updatedAt ?? insight.publishedAt,
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

/** The trail from Home to the page; Home is added here, not by callers. */
export function breadcrumbs(baseUrl: string, crumbs: readonly Crumb[]) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...crumbs].map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absolute(baseUrl, crumb.path),
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
    url: absolute(baseUrl, path),
    provider: organizationRef(baseUrl),
    areaServed: 'US',
  })
}

/**
 * JSON for an inline `<script>`. `<` becomes `<`, which JSON reads back
 * as the same character, so no value can close the tag it sits in.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
