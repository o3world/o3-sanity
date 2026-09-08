# @o3/build-assert

Assertions over the web build's own output. Three today: which routes the server renders on demand,
whether an unknown slug still converges to a cached 404, and how much JavaScript each route ships.

```bash
pnpm --filter @o3/web build     # the assertion reads what this leaves in .next
pnpm build:assert
```

CI runs the `build assertions` job after the build. On pull requests it compares GitHub's merged
candidate with the exact PR base revision from the event, built with that revision's frozen
lockfile in a separate worktree using the same Node version and Sanity environment. This measures
what the PR adds to its target branch, without credit for unrelated reductions on main since the
branches diverged. The baseline is freshly built, not supplied by the PR.

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

## The JS budget

Every route ships some JavaScript before it is interactive, and every byte of it is downloaded,
parsed and run on the visitor's phone. `defaultBytes` in [`src/policy.ts`](./src/policy.ts) is what a
route may ship, and the assertion fails naming the route and both numbers:

```
/ ships 1,433,201 bytes of first-load JavaScript and its budget is 730,000.
Every visitor downloads, parses and runs the difference.
```

A ceiling, not the exact set the rendering allowlist is: coming in under budget is the outcome the
budget exists to produce. What goes stale is an ENTRY — a route excused from the default long after
it needed to be — so the run prints every route's headroom whether it passes or not, and an entry
with room to spare reads as spent.

The absolute ceiling remains in force. On pull requests, `maxIncreaseBytes` also limits each
existing route to **10,000 additional uncompressed bytes** compared with its PR base revision build.
A 20 KB addition therefore fails even when the route still fits below 730,000 bytes. The report
prints the route, base bytes, current bytes, delta and growth limit on passing runs too. New routes
have no comparison and must meet their absolute ceiling; removed routes need no growth check.

To run the same comparison locally after building both revisions separately:

```bash
pnpm build:assert --baseline-dist /path/to/pr-base/apps/web/.next
```

Missing, empty, malformed or duplicate baseline route measurements fail the command. Omitting
`--baseline-dist` retains the absolute-budget check for ordinary local builds and pushes to main;
PR CI always supplies it. Any intentional increase beyond the growth limit needs a reviewed policy
change in `src/policy.ts`, rather than a bypass flag or an updated baseline file.

The one entry today is the Studio, which is an editing application rather than a page. The audit
behind the number is on #269.

## What it reads

Four files in `apps/web/.next`, and nothing else — no route-file parsing, no guessing from source:

| File                                  | For                                                    |
| ------------------------------------- | ------------------------------------------------------ |
| `app-path-routes-manifest.json`       | the full route table, handlers and catch-alls included |
| `prerender-manifest.json`             | what the build prerendered — concrete paths and routes |
| `required-server-files.json`          | the resolved config, for `cacheComponents`             |
| `diagnostics/route-bundle-stats.json` | per route, the first-load chunks and their total bytes |

A route absent from the prerender manifest is one the server renders on demand. That derivation
matches the `ƒ (Dynamic)` marks in the build's own route table, which is how it was checked.

A parameterised route has to hold its own `dynamicRoutes` entry. The concrete paths under it are not
proof: one path bailing out of prerendering costs the route that entry while its siblings stay in
`routes`, and Next prints the route as `ƒ`.

Under Cache Components a route with dynamic holes still prerenders a shell, so the same absence
means something stronger — no shell at all — and the failure says so.

`route-bundle-stats.json` is Next's own accounting, and it was checked against the prerendered HTML:
the 14 chunks it lists for `/` are 14 of the 15 `<script src>` tags in `.next/server/app/index.html`.
The fifteenth is the `nomodule` core-js polyfill, which no browser that runs the other fourteen ever
fetches — hence outside the first-load number and outside the budget.

**Middleware is invisible to this assertion.** `apps/web` has no `proxy.ts` today; adding one would
run on every request, prerendered route or not, and this job would stay green. Cost that at the
point you add it.

## Tests

`src/rendering.test.ts`, `src/cachedNotFound.test.ts` and `src/bundle.test.ts`, the unit layer,
against output trimmed from a real build. `src/assert.test.ts` runs the CLI against temporary build
output to cover the growth failure, comparison report and invalid-baseline failures.

These failure modes were proven against a real build rather than assumed:

- **Rendering.** Reading `headers()` in the shared `(site)` layout flipped `/`, `/[...segments]`,
  `/insights/[slug]` and `/work/[slug]` to dynamic, and the job failed naming all four.
- **Budget.** Importing `useIsPresentationTool` from `next-sanity/hooks` into `ui/NavInk.tsx` — the
  regression #269 fixed, put back by hand — took every content route from 667,149 bytes to
  1,433,201, and the job failed naming all six routes and both numbers.
