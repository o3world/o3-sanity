# @o3/build-assert

Assertions over the web build's own output. One today: which routes the server renders on demand.

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

## What it reads

Three files in `apps/web/.next`, and nothing else — no route-file parsing, no guessing from source:

| File                            | For                                                    |
| ------------------------------- | ------------------------------------------------------ |
| `app-path-routes-manifest.json` | the full route table, handlers and catch-alls included |
| `prerender-manifest.json`       | what the build prerendered — concrete paths and routes |
| `required-server-files.json`    | the resolved config, for `cacheComponents`             |

A route absent from the prerender manifest is one the server renders on demand. That derivation
matches the `ƒ (Dynamic)` marks in the build's own route table, which is how it was checked.

Under Cache Components a route with dynamic holes still prerenders a shell, so the same absence
means something stronger — no shell at all — and the failure says so.

## Tests

`src/rendering.test.ts`, the unit layer, against manifests trimmed from a real build. The reader
(`build-output.ts`) is a thin adapter over `readFileSync` and is exercised by running the command.

The failure mode was proven by reading `headers()` in the shared `(site)` layout: the build flipped
`/`, `/[...segments]`, `/insights/[slug]` and `/work/[slug]` to dynamic and the job failed naming
all four.
