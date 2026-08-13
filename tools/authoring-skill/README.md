# o3-authoring

The authoring capability from map #63: a vague idea becomes a
publishable-quality Sanity draft — an insight (blog post), case study, or
page — in the O3 voice. The skill is a thin bootstrap; voice, schema
guidance, and exemplars are fetched live from Sanity, so knowledge updates
propagate with a git push and never require repackaging.

One skill source (`skills/o3-authoring/SKILL.md`), two distributions:

## Claude Code (plugin)

This directory is a Claude Code plugin. It ships the skill and preconfigures
the hosted Sanity MCP server (`https://mcp.sanity.io`); auth is per-user
OAuth via `/mcp`, never distributed. Install from the repo-root marketplace:

```
/plugin marketplace add o3world/o3-sanity
/plugin install o3-authoring@o3world
```

Update with `/plugin marketplace update o3world` (or enable auto-update in
`/plugin` → Marketplaces).

## Claude Desktop (skill ZIP)

`pnpm build:skill` emits `dist/o3-authoring.zip` — a build artifact, never
committed. Upload at claude.ai → Settings → Capabilities → Skills; connect
the Sanity connector separately. Re-upload to update (shared/org-provisioned
recipients update automatically).
