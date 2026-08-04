import type { Metadata } from 'next'

import { urlForImage, type SanityImageSource } from '@o3/sanity/image'

import { getBaseUrl } from './base-url'

/**
 * One resolution chain for per-document SEO, shared by every routable type
 * (#26). Route builders call `buildDocumentMetadata`; entries only declare
 * the document-shaped parts (`DocumentSeo`) and never assemble tags
 * themselves — which is what stops the next content type from shipping with
 * a title and nothing else.
 *
 * For each field: the document's `seo` override wins, then a field on the
 * document itself, then Site Settings `defaultSeo`. `seo` is override-only by
 * construction (see `packages/sanity/src/schemas/objects/seo.ts`), so an
 * empty field always means "derive it", never "emit nothing".
 *
 * Canonical is the one field that is derived rather than defaulted: a page is
 * its own canonical at its own path unless a document explicitly points
 * elsewhere. The migration never writes one (`tools/migration/src/map/seo.ts`)
 * — a canonical carried over from WordPress would tell Google every new page
 * duplicates the old site.
 */

/** The `seo` object as every routable query projects it. */
export interface SeoOverrides {
  readonly title?: string | null
  readonly description?: string | null
  readonly ogImage?: SanityImageSource | null
  readonly canonical?: string | null
  readonly noIndex?: boolean | null
  readonly noFollow?: boolean | null
}

/**
 * What an entry knows about its own document: the fallbacks the shared chain
 * uses when `seo` leaves a field empty, plus the path the canonical is built
 * from.
 */
export interface DocumentSeo {
  /** The document's own title, without the site-name suffix. */
  readonly title?: string | null
  /** Description fallback — an insight's excerpt, a case study's narrative headline. */
  readonly description?: string | null
  /**
   * Social-image fallback: the document's lead image. Accepts a bare image or
   * a `figure` (the wrapper is unwrapped here so entries pass `heroMedia`
   * straight through).
   */
  readonly image?: SanityImageSource | { readonly image?: SanityImageSource | null } | null
  /** Route path with a leading slash — `/insights/foo`, or `/` for the homepage. */
  readonly path: string
  /**
   * `og:type`. Dated, authored writing is an `article` — Yoast said so on the
   * old site, and it is what turns a share into an article card rather than a
   * generic link preview. Everything else is a `website`.
   */
  readonly ogType?: 'website' | 'article'
  /** ISO instant for `article:published_time`. Only read when `ogType` is `article`. */
  readonly publishedTime?: string | null
}

/** The Site Settings fields the chain consults. Structural, so tests can pass a literal. */
export interface SiteSeoDefaults {
  readonly title?: string | null
  readonly defaultSeo?: SeoOverrides | null
}

/** Facebook's minimum for a large card, and what Yoast asked WordPress for. */
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

/** Unwrap a `figure` so callers can hand over `heroMedia` unchanged. */
function toImageSource(input: DocumentSeo['image']): SanityImageSource | null {
  if (!input) return null
  if (typeof input === 'object' && 'image' in input) return input.image ?? null
  return input as SanityImageSource
}

function ogImageUrl(source: SanityImageSource | null): string | null {
  if (!source) return null
  try {
    return urlForImage(source).width(OG_IMAGE_WIDTH).height(OG_IMAGE_HEIGHT).fit('crop').url()
  } catch {
    // An unresolved reference (a draft whose asset has not uploaded yet)
    // should cost the social card, not the whole page's metadata.
    return null
  }
}

function firstString(...values: (string | null | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

/**
 * Absolute URL for a route path. OpenGraph requires absolute URLs, and
 * `alternates.canonical` is only relative-safe when `metadataBase` is set —
 * which it is, in the root layout, but being explicit here keeps the tag
 * correct even if a route renders outside that layout.
 */
function absolute(path: string): string {
  const base = getBaseUrl()
  return path === '/' ? `${base}/` : `${base}${path}`
}

export interface BuildDocumentMetadataInput {
  /** The document's `seo` object, if it has one. */
  readonly seo?: SeoOverrides | null
  /** The entry's declaration about the document. */
  readonly doc: DocumentSeo
  /** Site Settings, for the defaults tier. */
  readonly settings?: SiteSeoDefaults | null
}

/**
 * The complete per-document tag set: title, description, canonical, robots,
 * OpenGraph, and Twitter card.
 */
export function buildDocumentMetadata({
  seo,
  doc,
  settings,
}: BuildDocumentMetadataInput): Metadata {
  const defaults = settings?.defaultSeo

  const title = firstString(seo?.title, doc.title)
  const description = firstString(seo?.description, doc.description, defaults?.description)

  const image =
    ogImageUrl(toImageSource(seo?.ogImage)) ??
    ogImageUrl(toImageSource(doc.image)) ??
    ogImageUrl(toImageSource(defaults?.ogImage))

  const url = absolute(doc.path)
  const canonical = firstString(seo?.canonical) ?? url
  const noIndex = seo?.noIndex === true
  const noFollow = seo?.noFollow === true

  // The site name is appended by the root layout's `title.template`, so the
  // OpenGraph title has to append it itself — social scrapers read og:title
  // literally and never see the template.
  const siteName = firstString(settings?.title) ?? 'O3'
  const ogTitle = title ? `${title} | ${siteName}` : siteName

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical },
    robots: {
      index: !noIndex,
      follow: !noFollow,
      // Yoast emitted these on every page; keeping them is the difference
      // between "not blocked" and the rich results the old site had.
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    openGraph: {
      ...(doc.ogType === 'article'
        ? { type: 'article', ...(doc.publishedTime ? { publishedTime: doc.publishedTime } : {}) }
        : { type: 'website' }),
      siteName,
      url,
      title: ogTitle,
      ...(description ? { description } : {}),
      ...(image
        ? { images: [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }] }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      ...(description ? { description } : {}),
      ...(image ? { images: [image] } : {}),
    },
  }
}
