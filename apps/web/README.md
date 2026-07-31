# @o3/web

The o3world.com site: Next.js App Router with the embedded Sanity studio at `/studio` (same-origin on every deploy, which is what makes Presentation live-editing work on preview URLs).

## Local env

From the repo root:

```sh
pnpm env:pull   # writes apps/web/.env.local from Vercel (project o3-sanity-web, team O3 World)
pnpm dev:web
```

Requires a one-time `vercel login`. The pulled vars: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN` (dataset `production` — local dev reads live content).

`SANITY_API_READ_TOKEN` doubles as `defineLive`'s `browserToken` (issue #15): it powers the live-drafts subscription that makes Presentation edits appear in the preview, and next-sanity only shares it with the browser after the draft-mode preview-secret handshake. Set `SANITY_API_BROWSER_TOKEN` only if you want a narrower browser-side scope.

## Gotchas

- Dev-mode Data Cache can pin a pre-publish `null`: if content seems invisible locally, delete `apps/web/.next`. Production self-heals via the `/api/revalidate` webhook.
- `/api/revalidate` accepts unsigned POSTs only when `NODE_ENV=development` **and** `SANITY_REVALIDATE_SECRET` is unset.
- Presentation draft-preview boundary: components fetch through `sanityFetch` (`@/sanity/live`), render section arrays through `Blocks` (`@/content/blocks/Blocks`), and mount `VisualEditing` from `@/sanity/VisualEditing` — ESLint enforces all three (issue #15). Reaching for a bare `@sanity/client` or the raw next-sanity `<VisualEditing />` silently freezes content in the Presentation tool.
