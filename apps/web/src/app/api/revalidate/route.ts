import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

import { docTag, typeTag } from '@o3/content-runtime/routes'

/**
 * Sanity webhook → Next.js cache revalidation.
 *
 * Tag scheme comes from `@o3/content-runtime/routes` — the same module
 * the route builders tag their fetches with (writer/reader parity):
 *   - `sanity:<_type>`          — type-level (catches new docs; what the
 *                                 layout's siteSettings fetch subscribes to)
 *   - `sanity:<_type>:<slug>`   — exact doc invalidation
 *
 * Every event ALSO flushes the routed content types wholesale. The queries
 * dereference freely across documents — an insight embeds its author and
 * categories, a page embeds case-study and insight cards, the nav derefs page
 * titles — and a webhook payload cannot know which pages embed the changed
 * doc. Publishes are rare and ISR regeneration is lazy (a page re-renders
 * only when next requested), so flushing wide is cheap; serving a stale
 * author bio forever is not.
 *
 * Configure the webhook with a projection of `{_type, "slug": slug.current}`
 * and the shared secret in `SANITY_REVALIDATE_SECRET`.
 *
 * DEV-ONLY unsigned path: in local dev there is no revalidation webhook; a
 * local script may POST here after writing docs. The bypass requires BOTH
 * development mode AND no configured secret — a set secret means the
 * operator opted into signature checks everywhere.
 */
/** The types whose fetches routes subscribe to — every routed page carries at
 * least one of these tags, so flushing them reaches every page that can embed
 * the changed document. */
const CONTENT_TYPES = ['page', 'insight', 'caseStudy', 'siteSettings'] as const

type RevalidatePayload = {
  _type?: string
  _id?: string
  slug?: string | { current?: string }
}

function resolveSlug(slug: RevalidatePayload['slug']): string | undefined {
  if (typeof slug === 'string') return slug
  if (slug && typeof slug === 'object' && typeof slug.current === 'string') return slug.current
  return undefined
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SANITY_REVALIDATE_SECRET
    const devUnsigned = process.env.NODE_ENV === 'development' && !secret

    let body: RevalidatePayload | null | undefined
    if (devUnsigned) {
      body = (await req.json()) as RevalidatePayload
    } else {
      const parsed = await parseBody<RevalidatePayload>(req, secret)
      if (!parsed.isValidSignature) {
        return new NextResponse('Invalid signature', { status: 401 })
      }
      body = parsed.body
    }

    if (!body?._type) {
      return new NextResponse('Bad request', { status: 400 })
    }

    const tags = new Set<string>([typeTag(body._type), ...CONTENT_TYPES.map(typeTag)])

    const slug = resolveSlug(body.slug)
    if (slug) {
      tags.add(docTag(body._type, slug))
    }
    const tagsRevalidated = [...tags]

    for (const tag of tagsRevalidated) {
      revalidateTag(tag, { expire: 0 })
    }

    return NextResponse.json({ revalidated: true, tags: tagsRevalidated, now: Date.now() })
  } catch (err) {
    console.error('Revalidation error:', err)
    return new NextResponse('Error revalidating', { status: 500 })
  }
}
