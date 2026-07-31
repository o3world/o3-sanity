import { COLLECTION_PREFIXES } from '@o3/sanity/constants'

/**
 * URL construction for routable documents (ADR 0001's flat URL space):
 * prefixed collections for perspective/caseStudy, multi-segment slugs that
 * carry their own prefix for page (the homepage is the `"index"` slug).
 */
export function hrefForDoc(doc: { _type: string; slug?: string | null }): string {
  const slug = doc.slug ?? ''
  switch (doc._type) {
    case 'perspective':
      return `${COLLECTION_PREFIXES.perspective}/${slug}`
    case 'caseStudy':
      return `${COLLECTION_PREFIXES.caseStudy}/${slug}`
    case 'page':
      return slug === 'index' || slug === '' ? '/' : `/${slug}`
    default:
      return '/'
  }
}
