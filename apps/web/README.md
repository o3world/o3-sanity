# @o3/web

The o3world.com site: Next.js App Router with the embedded Sanity studio at `/studio` (same-origin on every deploy, which is what makes Presentation live-editing work on preview URLs).

## Local env

From the repo root:

```sh
pnpm env:pull   # writes apps/web/.env.local from Vercel (project o3-sanity-web, team O3 World)
pnpm dev:web
```

Requires a one-time `vercel login`. The pulled vars: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN` (dataset `production` — local dev reads live content).

## Gotchas

- Dev-mode Data Cache can pin a pre-publish `null`: if content seems invisible locally, delete `apps/web/.next`. Production self-heals via the `/api/revalidate` webhook.
- `/api/revalidate` accepts unsigned POSTs only when `NODE_ENV=development` **and** `SANITY_REVALIDATE_SECRET` is unset.
