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

## What lives here and what does not

The block renderers, the site chrome and the cards are `@o3/content-ui`; the
route builders and the dispatch loop are `@o3/content-runtime`. This app keeps
the halves that are its own: `src/content/blocks/` (its registry binding and
the three dispatchers that read it), `src/content/documents/` (route entries
and document views), and `src/app/` (the routes). Adding a block to this app is
a line in `clientComponents.ts`, not a file here — see
[ADR 0028](../../docs/adr/0028-o3xo-is-a-second-app-in-the-monorepo.md).

## Gotchas

- Dev-mode Data Cache can pin a pre-publish `null`: if content seems invisible locally, delete `apps/web/.next`. Production self-heals via the `/api/revalidate` webhook.
- `/api/revalidate` accepts unsigned POSTs only when `NODE_ENV=development` **and** `SANITY_REVALIDATE_SECRET` is unset.
- Presentation draft-preview boundary: components fetch through `sanityFetch` (`@o3/content-runtime/live`), render section arrays through `Blocks` (`@/content/blocks/Blocks`), and mount `VisualEditing` from `@/sanity/VisualEditing` — ESLint enforces all three (issue #15). Reaching for a bare `@sanity/client` or the raw next-sanity `<VisualEditing />` silently freezes content in the Presentation tool.
