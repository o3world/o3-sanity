# 0027. The brief is a document

- **Status:** Accepted; the one machine slot amended by [#190](https://github.com/o3world/o3-sanity/issues/190)
- **Date:** 2026-08-16
- **Deciders:** NickO3 + Claude
- **Related:** [ADR 0003](./0003-disposable-dataset-migration-lock.md), [ADR 0024](./0024-authoring-knowledge-has-one-source-and-one-fan-out.md), [issue #68](https://github.com/o3world/o3-sanity/issues/68), [issue #142](https://github.com/o3world/o3-sanity/issues/142), `tools/guidance/`

## Context

The authoring skill opens every session with an interview — the brief:
audience, claim, warrant, evidence in hand. What it produces (an agreed
thesis, five locked reader-test questions, a gap list) lives only in the
chat. Review mode re-interviews from scratch because there is nothing
stored, and the step-6 gap list — the facts the human never supplied —
dies as a chat message.

Per-piece background has no home anywhere in the model. Guidance is
deliberately global (ADR 0024): how to write for O3, anywhere. The
`migration` object is pipeline provenance. Research, evidence, and
instructions for one specific piece land in whichever chat gathered them.

## Decision

**Per-piece background becomes a document type, `brief`, that content
references. The brief persists what the human supplied and what the
interview produced. Guidance stays global and never carries per-piece
material.**

The shape:

- Three human slots — `background` (raw material: research, notes,
  transcripts, pasted evidence), `instructions` (directives for the
  piece), `links` (external source URLs) — and one machine slot,
  `record`, where the skill persists its interview output: the thesis,
  the locked reader-test questions, the gaps. `record` is a text field
  whose internal format belongs to the skill. Typed fields would couple
  the schema to a workflow #142 already changed once.
  **Amended by #190**: the pipeline became five skills, each owning one
  artifact, and one text field they all rewrite is a stale-write clobber
  waiting to happen. `record` is replaced by a field per artifact —
  `stage`, `nextStep`, `thesis`, `readerQuestions`, `outline`, `draft`,
  `verdict`, `decisions`, `gaps`, `pieceId` — each patched by the stage
  that owns it. The coupling this bullet refused is the price of that.
- `insight`, `page`, and `caseStudy` carry a `briefs` array of **weak**
  references, written in seed JSON against deterministic ids. Weak, so a
  piece is never publish-blocked or delete-locked by its own provenance,
  and so load and sync order stops mattering. Most arrays hold one
  reference; several pieces sharing one brief is the same mechanism.
- The type is internal the way guidance is: not routable, no `slug`, no
  `seo`, no `migration` object, and ids (`brief-<key>`) that miss the
  load pipeline's ownership contract, so `load` never retires one.

A brief has two provenance states:

- **File-backed** — a markdown file in a globbed corpus directory under
  `tools/guidance`, frontmatter (`key`, `title`) as the whole
  registration. `pnpm brief:sync` pushes it, `pnpm brief:check` fails on
  drift, every field is `readOnly` in Studio. The repo is the source of
  truth, which is what keeps briefs importable and regeneratable against
  ADR 0003's disposable dataset. During the migration, Claude Code
  authors briefs this way.
- **Dataset-born** — written by the authoring skill mid-session. The
  interview stays a gate, moved one step later: the skill writes the
  brief document before it creates the content that references it. No
  `sourcePath`, so `brief:check` ignores it. `pnpm brief:export`
  promotes one to markdown when it should survive a rebuild.

The corpus shares `tools/guidance`'s internals but not its command:
ADR 0024 gave `guidance:sync` a specific meaning, and a brief is not
authoring knowledge. The boundary fits on one line: **guidance tells an
agent how to write anywhere; a brief is what one piece is written
from.**

**The flip.** Near migration-done, brief fields go editable in Studio,
sync retires or inverts into export-only, and the dataset becomes the
source of truth. Named here so nothing built now blocks it — the
deterministic ids and `sourcePath` provenance keep it cheap — and
designed no further.

## Alternatives considered

### Fields on the content document

- **Pros:** no reference, no second type, the material sits where the
  piece is edited.
- **Cons:** nothing can be shared across pieces, every content schema
  grows the same four fields, and a brief cannot exist before its piece
  does — which is exactly when briefing happens.
- **Why not:** one standalone type keeps a single association
  mechanism. A 1:1 brief is just a brief nobody else references.

### A guidance document per piece

- **Pros:** reuses the entire existing pipeline unchanged.
- **Cons:** ADR 0024 defines guidance as authoring knowledge with one
  source and one fan-out. Per-piece input is a different corpus with a
  different lifecycle — mutable, eventually Studio-owned, referenced by
  content rather than fetched globally.
- **Why not:** the boundary is the point. Blurring it makes every
  session fetch someone else's research as if it were the voice guide.

### Dataset-native from day one

- **Pros:** no sync machinery, and Studio authoring works immediately —
  which is where this ends up after the flip.
- **Cons:** a rebuild deletes every brief (ADR 0003; no backups on this
  plan), and the main author during the migration is Claude Code, which
  works in files.
- **Why not:** repo markdown now, the flip later. The trigger for the
  flip is being close enough to migration-done that editors, not
  agents, brief the pieces.

## Consequences

- **Positive:** review mode fetches the brief and interviews only for
  what changed. The gap list becomes a queryable field instead of a
  scrollback casualty.
- **Positive:** a from-scratch rebuild restores every file-backed brief
  with one sync.
- **Negative:** one more corpus and three more commands in
  `tools/guidance`, and `brief:check` audits only file-backed briefs —
  its silence says nothing about dataset-born ones.
- **Risk:** a dataset-born brief nobody exports does not survive a
  rebuild. Accepted while the site is early alpha, same as ADR 0003's
  standing bet.
