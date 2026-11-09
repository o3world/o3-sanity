import { getBaseUrl } from '@o3/content-runtime/base-url'
import { getSiteSettings } from '@o3/content-runtime/site-settings'

import { organization, serializeJsonLd } from './schema'

/**
 * One JSON-LD block, server-rendered so it is in view-source. A native
 * `<script>`, not `next/script`: this is data, not code to load.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}

/** The Organization node, from Site Settings. Rendered on the homepage. */
export async function OrganizationJsonLd() {
  const settings = await getSiteSettings()
  return <JsonLd data={organization({ baseUrl: getBaseUrl(), settings })} />
}
