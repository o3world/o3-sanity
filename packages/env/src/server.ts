import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

// Treat an empty-string env var the same as "unset". Vercel's `.env.*.local`
// files materialize an env-key-without-value as `KEY=`, which lands in the
// process as `process.env.KEY === ''` — defined enough to defeat
// `.optional()` but blank enough to fail validation.
const optionalNonEmpty = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().min(1).optional(),
)

export const serverEnv = createEnv({
  server: {
    SANITY_API_READ_TOKEN: optionalNonEmpty,
    // Optional narrower-scope token shared with the browser in draft mode;
    // defaults to SANITY_API_READ_TOKEN (see apps/web/src/sanity/live.ts).
    SANITY_API_BROWSER_TOKEN: optionalNonEmpty,
    SANITY_API_WRITE_TOKEN: optionalNonEmpty,
    SANITY_REVALIDATE_SECRET: optionalNonEmpty,
    // The contact form's destination: HubSpot portal and form. Both unset
    // means the route answers 503 rather than posting into the void.
    HUBSPOT_PORTAL_ID: optionalNonEmpty,
    HUBSPOT_FORM_GUID: optionalNonEmpty,
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: {
    SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
    SANITY_API_BROWSER_TOKEN: process.env.SANITY_API_BROWSER_TOKEN,
    SANITY_API_WRITE_TOKEN: process.env.SANITY_API_WRITE_TOKEN,
    SANITY_REVALIDATE_SECRET: process.env.SANITY_REVALIDATE_SECRET,
    HUBSPOT_PORTAL_ID: process.env.HUBSPOT_PORTAL_ID,
    HUBSPOT_FORM_GUID: process.env.HUBSPOT_FORM_GUID,
    NODE_ENV: process.env.NODE_ENV,
  },
})
