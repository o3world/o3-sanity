# o3-sanity

Rebuild of [o3world.com](https://www.o3world.com) on Sanity + Next.js. Coordination runs through the [wayfinder map](https://github.com/o3world/o3-sanity/issues/1); ubiquitous language lives in [CONTEXT.md](CONTEXT.md).

## Quickstart

```sh
pnpm install
pnpm env:pull   # one-time `vercel login` first; writes apps/web/.env.local from Vercel (team: O3 World)
pnpm dev:web    # o3 on localhost:3000, embedded studio at /studio
```

`pnpm dev:o3xo` runs the second brand's app (O3XO, [ADR 0028](docs/adr/0028-o3xo-is-a-second-app-in-the-monorepo.md))
on its own port and Sanity project — see [apps/o3xo/README.md](apps/o3xo/README.md).
`pnpm storybook` runs Storybook on `localhost:6006`.

## Deploy model

GitHub Actions owns every deploy (Vercel git integration is off). Vercel projects `o3-sanity-web` and `o3-sanity-storybook` live in the **O3 World** team.

- **PR → preview**: affected-gated deploy + branch alias `o3-sanity-web-<branch>.vercel.app`, smoke-checked (`/` and `/studio` must answer 200).
- **Push to `main`** → staging alias + `schema:deploy` to Sanity project `naorcr6k`.
- **Production** = manual promote (`promote.yml`).

Full env/secret table: [docs/specs/scaffold-plan.md](docs/specs/scaffold-plan.md). Workspace layout, CI, and branch model are documented there too.
