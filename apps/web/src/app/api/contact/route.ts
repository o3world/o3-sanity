import { checkBotId } from 'botid/server'

import { handleInquiryRequest } from '@o3/content-ui/inquiry'
import { serverEnv } from '@o3/env/server'

/**
 * The contact form's submission path: the browser posts here, HubSpot takes it
 * from there.
 *
 * Everything but the brand lives in `@o3/content-ui/inquiry` — parsing,
 * validation, the spam checks, the payload and the answer — so this app and
 * o3xo enforce the same rules. What is this route's own is the page's name.
 */

/** How this page identifies itself in HubSpot's submission list. */
const PAGE_NAME = 'Contact — o3world.com'

/**
 * Only production tells HubSpot which page a submission came from. HubSpot
 * files a submission from an unregistered domain as spam, and every preview
 * and the staging alias sit on vercel.app.
 */
const ATTRIBUTE_PAGE = process.env.VERCEL_ENV === 'production'

/**
 * BotID's verdict is read here rather than in the handler: `checkBotId` reads
 * Vercel's own request context, and `@o3/content-ui/inquiry` reads no
 * platform. `src/instrumentation-client.ts` is what makes this path
 * classifiable.
 */
export async function POST(request: Request) {
  const { isBot } = await checkBotId()

  return handleInquiryRequest(request, {
    env: serverEnv,
    pageName: PAGE_NAME,
    attributePage: ATTRIBUTE_PAGE,
    bot: isBot,
  })
}
