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

### Domain docs

Single-context layout — `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

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
