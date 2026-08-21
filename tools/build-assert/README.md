# @o3/build-assert

Assertions over the web build's own output. Two today: which routes the server renders on demand,
and whether an unknown slug still converges to a cached 404.

```bash
pnpm --filter @o3/web build     # the assertion reads what this leaves in .next
pnpm build:assert
```

CI runs the same two commands as the `build assertions` job, after the build.

## The rendering assertion

A route that renders per request bills a function invocation on every page view. The set of those
routes is declared in [`src/policy.ts`](./src/policy.ts) and the assertion fails when the build
disagrees, naming the route:

```
/work/[slug] is server-rendered on demand and the allowlist does not permit it.
Every request to it bills a function invocation.
```

The allowlist is the exact set, not a ceiling. An entry the build now prerenders fails too, so the
file cannot quietly outlive its reasons.

Entries carry a `kind`. `inherent` means there is nothing to prerender in any mode — a POST handler,
the Studio's client app. `migrating` means the route should serve a static shell and does not yet;
turning on Cache Components stops honouring those entries, so the change that fixes the route is the
change that deletes them.

## The cached-404 assertion

A bot probing made-up slugs must buy one render per slug, not one per request. That rests on a
single field: `prerender-manifest.json` records each parameterised route's `fallback`, and `null`
is Next's encoding of blocking — render the unknown param on demand, then cache what came back, a
404 included. The rendering assertion above cannot see this, because a route can keep its shell and
still change what it does with a slug nobody published.

The content routes are declared in [`src/cachedNotFound.ts`](./src/cachedNotFound.ts), and the
assertion names the route and what the change costs:

```
/work/[slug] answers an unknown slug from a fallback shell (fallback: "/work/[slug].html")
rather than blocking. The shell is filled per request, so every probe of every made-up slug
bills a function invocation.
```

`fallback: false` fails for the opposite reason — the slug set is then fixed at build time, so a
document published after the build 404s until someone redeploys. `/studio/[[...tool]]` is
parameterised too and legitimately carries a fallback shell, which is why the routes are a declared
list rather than every entry in the manifest.

The measurement it holds the build to is on #267.

## What it reads

Three files in `apps/web/.next`, and nothing else — no route-file parsing, no guessing from source:

| File                            | For                                                    |
| ------------------------------- | ------------------------------------------------------ |
| `app-path-routes-manifest.json` | the full route table, handlers and catch-alls included |
| `prerender-manifest.json`       | what the build prerendered — concrete paths and routes |
| `required-server-files.json`    | the resolved config, for `cacheComponents`             |

A route absent from the prerender manifest is one the server renders on demand. That derivation
matches the `ƒ (Dynamic)` marks in the build's own route table, which is how it was checked.

A parameterised route has to hold its own `dynamicRoutes` entry. The concrete paths under it are not
proof: one path bailing out of prerendering costs the route that entry while its siblings stay in
`routes`, and Next prints the route as `ƒ`.

Under Cache Components a route with dynamic holes still prerenders a shell, so the same absence
means something stronger — no shell at all — and the failure says so.

**Middleware is invisible to this assertion.** `apps/web` has no `proxy.ts` today; adding one would
run on every request, prerendered route or not, and this job would stay green. Cost that at the
point you add it.

## Tests

`src/rendering.test.ts` and `src/cachedNotFound.test.ts`, the unit layer, against manifests trimmed
from a real build. The reader (`build-output.ts`) is a thin adapter over `readFileSync` and is
exercised by running the command.

The failure mode was proven by reading `headers()` in the shared `(site)` layout: the build flipped
`/`, `/[...segments]`, `/insights/[slug]` and `/work/[slug]` to dynamic and the job failed naming
all four.
