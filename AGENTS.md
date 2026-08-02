# o3-sanity

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (`o3world/o3-sanity`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

Work is organised under parent issues with **native GitHub dependencies** between children — the
migration super story is #25. Start a session by asking what's available, and claim before you work:

```bash
pnpm frontier        # READY / BLOCKED(n) / CLAIMED@who, per child of #25
pnpm wt new <n>      # claim it, branch it, worktree it, install, carry env across
```

One ticket, one worktree, one session. `pnpm wt new` refuses a blocked or already-claimed ticket, so
you cannot start work two sessions are duplicating. See `docs/agents/worktrees.md` — read it before
running more than one session at a time.

### Content naming

Naming and wiring rules for schemas, fields, blocks, and renderers. Vocabulary lives in `CONTEXT.md` → Naming; the procedure is the `content-naming` skill (`.claude/skills/content-naming/`). Read both before touching `packages/sanity/src/schemas/` or `apps/web/src/content/`.

### Design source of record

**Figma is the design source of record** (map #33) — it outranks `prototype/`, which is retired.
Read `docs/agents/figma.md` before reading the file: which of the two registered MCP servers to use
(the official one is rate-limited and will fail), how to avoid reading a child node instead of the
frame, and the two-generations distinction that tells canonical frames from imported captures.

Frame → route map: [`docs/figma-frames.md`](https://github.com/o3world/o3-sanity/blob/research/figma-frame-inventory/docs/figma-frames.md)
(on branch `research/figma-frame-inventory`). Never build a page layer without checking it first.

Component → code map: [`docs/figma-components.md`](./docs/figma-components.md) — every component set,
its variant axes, and what it maps to (or deliberately doesn't). One Figma variant axis → one `cva`
variants key; `State=Hover` is never a variant. Icons are inline SVG, not a font (ADR 0009).

### Captured prototypes

Answered visual prototypes are committed to `apps/storybook/prototypes/` and served by Storybook as
dated, read-only snapshots (ADR 0010). They are **not** a source of record — take intent and sequence
from one, never values; tokens and variant axes come from Figma. Read
[`apps/storybook/prototypes/README.md`](./apps/storybook/prototypes/README.md) before adding one.
Prototypes that answered a _logic_ question stay on a throwaway branch instead.

### Components and shadcn

**shadcn's anatomy, O3's tokens** (ADR 0008). shadcn is already adopted in
`packages/ui`; a component the CLI generates is a **draft** that must be
translated to O3 tokens before it lands — `bg-background` and friends do not
exist here and render as nothing. `shadcn-seam.test.ts` fails the build if you
skip it. Read [`packages/ui/README.md`](./packages/ui/README.md) before adding
one.

One Figma variant axis → one `cva` variants key. That rule is what makes the
component map in #38 mechanical rather than ad hoc.

### Domain docs

Single-context layout — `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Running the migration

**Loading the dataset is your job, not a question to ask.** The pipeline —
`extract → convert → load → verify` — is ordinary build-out work:

```bash
pnpm --filter @o3/migration load     # data/{converted,translated,seed}/ → Sanity
pnpm --filter @o3/migration verify   # is the dataset what data/ says it is?
```

The dataset is called `production`, but the site is **very early alpha with no
real users**. ADR 0003 already says the dataset is disposable and the committed
JSON under `tools/migration/data/` is the source of truth; `load` recreates
every unlocked pipeline-owned document from it, and a `migration.locked`
document is never touched in any mode. Treat this as safe until someone says
the site has traffic.

**Run it after touching anything under `data/`, then look at the result in a
browser.** Skipping it once (#42's build-out) left a whole homepage
reconciliation invisible: the seeds were correct, the dataset was stale, and
every screenshot taken to check the work was of the old content.

### Agent guidance in the dataset

The Claude Desktop authoring skill carries no knowledge — it fetches it (#68).
The voice guide and brand foundation live in the repo as markdown and are
pushed into the dataset as `guidance` documents by a separate tool, which
outlives the migration pipeline:

```bash
pnpm guidance:sync    # .claude/skills/o3world-copy/*.md → guidance documents
pnpm guidance:check   # fails if the dataset has drifted from the repo
```

**Edit the markdown, then sync.** A stale guidance document does not error —
it just makes everything an agent writes that session quietly wrong. Sources
are declared in `tools/guidance/src/sources.ts`; consumers read
`*[_type == "guidance"]{key, title, body}`.

### Testing

Three layers — `unit` (`*.test.ts`), `render` (`*.render.test.tsx`), `stories` (`*.stories.tsx`).
Read `docs/testing.md` before writing one; decisions are in `docs/adr/0004-layered-test-approach.md`.

**Run tests as a checkpoint, not a loop.** `pnpm test` before opening a PR, and after a
migration batch or a new block — not after every edit, and never in watch mode during agent work.
There is no git hook; `pnpm verify` does not run tests. CI runs the suite as its own job.

Two rules that will otherwise cost an hour:

- A component with a story needs no test file — the story IS the test.
- Import `stegaClean` from `@sanity/client/stega`, never from the `next-sanity` barrel (lint-enforced;
  the barrel breaks every story for the block that imports it).
