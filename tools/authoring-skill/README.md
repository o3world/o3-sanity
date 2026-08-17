# O3 authoring (`/o3sanity:authoring`)

The authoring capability from map #63: a vague idea becomes a
publishable-quality Sanity draft — an insight (blog post), case study, or
page — in the O3 voice. The skill is a thin bootstrap; voice, schema
guidance, and exemplars are fetched live from Sanity, so knowledge updates
propagate with a git push and never require repackaging.

One skill source (`skills/authoring/SKILL.md`), two distributions.

The plugin's test surface is [`evals/`](./evals) — cases in `claude plugin
eval` format, graded mechanically, run today by the `o3-eval-runner` agent and
by the CLI once the early-access flag lands. A skill change is checked by
running cases, and a new skill starts with the RED baseline the eval README
sets out. [`scenarios/`](./scenarios) holds the two long-form scripts that
format grew out of.

## Claude Code (plugin)

This directory is a Claude Code plugin. It ships the skill and preconfigures
the hosted Sanity MCP server (`https://mcp.sanity.io`); auth is per-user
OAuth via `/mcp`, never distributed. Install from the repo-root marketplace:

```
/plugin marketplace add o3world/o3-sanity
/plugin install o3sanity@o3world
```

**Install it at user scope.** A project-scoped install belongs to the directory
it was made in, and this repo works one ticket to one worktree — the directory
goes away, and the next worktree has the plugin enabled in
`.claude/settings.json` with nothing installed to serve it. What that looks
like from inside a session is a skill that is simply absent, so the agent reads
`SKILL.md` out of the repo instead and the plugin path goes untested.

Update with `/plugin marketplace update o3world` (or enable auto-update in
`/plugin` → Marketplaces). The marketplace serves `main`, so a change is only
installable once it is merged.

The same two steps have a CLI form, which is the one an agent can run:

```
claude plugin marketplace update o3world
claude plugin install o3sanity@o3world   # --scope user is the default here
```

## Claude Desktop (skill ZIP)

`pnpm build:skill` emits `dist/authoring.zip` — a build artifact, never
committed. Upload at claude.ai → Settings → Customize → Skills (code
execution must be on, under Settings → Capabilities); connect the Sanity
connector separately. Re-upload to update (shared/org-provisioned recipients
update automatically).

Wiring a machine for the first time is four browser steps and easy to get
subtly wrong, so run the wizard instead of the paragraph above:

```
pnpm skill:wire
```

It builds the ZIP, opens each page in order, and then checks from the
outside that the draft your Desktop session claims to have made actually
reached `naorcr6k/development` — the one failure the app itself reports as
success. Its smoke test hands the skill a thesis, which is the brief's one
override; without one the skill is meant to create nothing.
