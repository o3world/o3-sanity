# 0024. Authoring knowledge has one source and one fan-out

- **Status:** Accepted
- **Date:** 2026-08-15
- **Deciders:** NickO3 + Claude
- **Related:** [map #63](https://github.com/o3world/o3-sanity/issues/63), [issue #68](https://github.com/o3world/o3-sanity/issues/68), [issue #72](https://github.com/o3world/o3-sanity/issues/72), [ADR 0025](./0025-design-system-knowledge-splits-by-locality.md), `tools/guidance/`

## Context

The words that teach an agent to write for o3world.com — the voice guide, the
brand foundation, the slop patterns — reach agents through three surfaces
today: the repo skill (`o3world-copy`, read in this checkout), the `guidance`
documents in the dataset (read over MCP by any consumer, including the Desktop
authoring skill), and the `o3-authoring` plugin distributed org-wide. A fourth
surface is one edit away at any time: pasting voice rules into the plugin's
`SKILL.md`, into a schema description, into an AGENTS.md.

The failure mode is silent. `tools/guidance/src/check.ts` names it in its own
comment: a stale guidance document does not error, it just makes everything an
agent writes that session quietly wrong. Two copies of the voice that drift
apart produce the same defect with no failing check anywhere.

Most of the machinery to prevent this already exists — `guidance:sync` pushes
the markdown into the dataset, `guidance:check` fails on drift, every
`guidance` field is `readOnly` in Studio, and the plugin skill is 68 lines of
bootstrap that fetches knowledge instead of carrying it. What did not exist was
the rule that makes those mechanisms a system rather than a set of habits.

## Decision

**The markdown corpus is the single source of truth for every word of O3
authoring knowledge. `guidance:sync` is the only fan-out. The plugin carries
workflow and zero knowledge.**

Flow, one direction only:

```
docs/guidance/*.md                      ← authored here, reviewed here, git-blamed here
        │
        ├── read directly by an agent in this checkout        (o3world-copy skill)
        └── pnpm guidance:sync → guidance documents in Sanity
                 └── read via MCP by o3-authoring             (plugin, and the Desktop ZIP)
```

The corpus moves from `.claude/skills/o3world-copy/` to a neutral home
(`docs/guidance/`) — the skill stays where it is and points at the files. The
directory was named for copy; the composition catalog (ADR 0025) is not copy,
and a corpus that outgrows its folder name invites a second home.

One knowledge surface deliberately lives outside the store: schema
`description` strings, which sit next to the fields they describe and reach
consumers via `get_schema`. They get the same guarantee by a different
mechanism — `pnpm schema:check`, a sibling of `guidance:check` that diffs the
repo schema against the deployed one and fails on drift. The split between the
two homes is ADR 0025.

Nothing else may restate the voice. Not the plugin, not a second skill, not a
schema description, not a README.

## Alternatives considered

### Author in Sanity, sync out to git

Sanity runs this pipeline backwards at scale: roughly 60 internal skills
authored as Sanity documents, converted to markdown by a Function and committed
to GitHub through the Git Trees API, with the marketplace manifest rewritten on
every publish.

- **Pros:** a marketer can edit voice guidance in Studio without cloning
  anything — and the audience for this whole effort is eventually
  non-engineers. Updates reach every session with no re-upload.
- **Cons:** voice edits lose the diff, the blame, and the PR. The corpus
  currently has two calibrations behind it (#64, then a full-corpus survey),
  and that provenance lives in git history.
- **Why not:** the corpus is three files and one reviewer. The Sanity direction
  is the recorded answer for the day it outgrows that — when authoring the
  voice becomes a marketing job rather than an engineering one — not for now.

### Package the knowledge in the skill

- **Pros:** the author reads the rules exactly where they work; no MCP fetch,
  no session-start dependency.
- **Cons:** the Desktop ZIP is a manual per-user upload with no org
  provisioning (verified 2026-08-15), so anything packaged is frozen at upload
  time and drifts per person.
- **Why not:** this was map #63's founding decision and nothing has changed
  it. The one admin-managed channel that exists today is Claude Tag (Slack),
  recorded here as a known alternative distribution surface, not adopted.

### Let each surface own its copy

- **Pros:** no pipeline, no sync step, each surface tuned to its reader.
- **Cons:** the drift is silent by construction, and it was already observed
  between the deployed schema and the repo before this ADR was written.
- **Why not:** the defect this rule exists to prevent.

## Consequences

- **Positive:** a voice edit reaches every installed user in two steps —
  commit the markdown, run the sync. The plugin needs a push only when the
  *workflow* changes.
- **Positive:** a skipped sync fails loudly (`guidance:check`), and once
  `schema:check` exists the same holds for the one knowledge surface outside
  the store.
- **Negative:** a Desktop author's session depends on MCP at session start.
  The skill already handles this the right way — if no guidance documents
  exist it stops rather than improvising the voice — and that contract is part
  of what this ADR protects.
- **Negative:** a non-engineer cannot edit the voice without a PR. That is the
  trade against the Sanity-direction alternative, accepted deliberately and
  with the revisit trigger named above.
- **Risk:** until the corpus move and `schema:check` land (ticketed under
  #63), the rule is ahead of its enforcement.
