import { collectionPrefixes } from '@o3/sanity/brand'

/**
 * URL construction for routable documents (ADR 0001's flat URL space):
 * prefixed collections for insight/caseStudy, multi-segment slugs that
 * carry their own prefix for page (the homepage is the `"index"` slug).
 */
export function hrefForDoc(doc: { _type: string; slug?: string | null }): string {
  const slug = doc.slug ?? ''
  switch (doc._type) {
    case 'insight':
      return `${collectionPrefixes().insight}/${slug}`
    case 'caseStudy':
      return `${collectionPrefixes().caseStudy}/${slug}`
    case 'page':
      return slug === 'index' || slug === '' ? '/' : `/${slug}`
    default:
      return '/'
  }
}

/**
 * The same URL, asked from inside the Studio — where the slug is still an
 * object and "no slug yet" is a real answer.
 *
 * `hrefForDoc` serves links on rendered pages, so it can never fail: a missing
 * slug becomes `/` and the card still works. The "Open in Presentation" action
 * needs the opposite — a document with no slug has no page, and sending an
 * editor to the homepage instead would look like the action is broken. `null`
 * is what turns the action off.
 */
export function previewPathForDoc(doc: {
  _type: string
  slug?: { current?: string } | null
}): string | null {
  const slug = doc.slug?.current
  if (!slug) return null
  return hrefForDoc({ _type: doc._type, slug })
}
