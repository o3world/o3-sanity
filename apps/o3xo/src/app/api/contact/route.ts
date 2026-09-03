import { handleInquiryRequest } from '@o3/content-ui/inquiry'
import { serverEnv } from '@o3/env/server'

/**
 * The contact form's submission path: the browser posts here, HubSpot takes it
 * from there.
 *
 * Everything but the brand lives in `@o3/content-ui/inquiry` — parsing,
 * validation, the spam checks, the payload and the answer — so this app and
 * the O3 site enforce the same rules. What is this route's own is the page's name.
 */

/** How this page identifies itself in HubSpot's submission list. */
const PAGE_NAME = 'Contact — o3xo.ai'

export const POST = (request: Request) =>
  handleInquiryRequest(request, { env: serverEnv, pageName: PAGE_NAME })
