import { type NextRequest, NextResponse } from 'next/server'

import { submitInquiry, type InquiryInput } from '@o3/content-ui/inquiry'
import { serverEnv } from '@o3/env/server'

/**
 * The contact form's submission path: the browser posts here, this route posts
 * to HubSpot.
 *
 * Everything but the brand and the request lives in `@o3/content-ui/inquiry` —
 * validation, the spam checks and the payload — so this app and o3xo answer
 * the same rules. What is this route's own is the page's name, the visitor's
 * address, and the status → HTTP mapping below.
 *
 * A dropped submission answers 200, exactly as a sent one does. The spam
 * checks are only worth having while a bot cannot tell which one it tripped.
 */

/** How this page identifies itself in HubSpot's submission list. */
const PAGE_NAME = 'Contact — o3world.com'

/**
 * The visitor's address for HubSpot's form analytics. It is a header a client
 * can set, so it is reported and never trusted: nothing here decides anything
 * by it.
 */
function ipAddress(req: NextRequest): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  return req.headers.get('x-real-ip')?.trim() || undefined
}

export async function POST(req: NextRequest) {
  let input: InquiryInput
  try {
    input = (await req.json()) as InquiryInput
  } catch {
    return NextResponse.json({ status: 'invalid' }, { status: 400 })
  }

  const result = await submitInquiry({
    input,
    env: serverEnv,
    fetch: globalThis.fetch,
    now: Date.now(),
    pageUri: req.headers.get('referer') ?? undefined,
    pageName: PAGE_NAME,
    ipAddress: ipAddress(req),
  })

  switch (result.status) {
    case 'sent':
    case 'dropped':
      return NextResponse.json({ status: 'sent' })
    case 'invalid':
      return NextResponse.json({ status: 'invalid', errors: result.errors }, { status: 400 })
    case 'unconfigured':
      return NextResponse.json({ status: 'unconfigured' }, { status: 503 })
    default:
      // HubSpot's own error body names properties and portals, and the person
      // who filled the form can do nothing with it. It stays here.
      return NextResponse.json({ status: 'failed' }, { status: 502 })
  }
}
