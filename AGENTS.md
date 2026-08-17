# o3-sanity

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (`o3world/o3-sanity`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

Work is organised under **wayfinder maps** (`wayfinder:map`), with **native GitHub dependencies**
between children. Start a session by asking what's available, and claim before you work:

```bash
pnpm frontier        # READY / BLOCKED(n) / CLAIMED@who across every open map
pnpm frontier 33     # one map, or any parent
pnpm wt new <n>      # claim it, branch it, worktree it, install, carry env across
```

One ticket, one worktree, one session. `pnpm wt new` refuses a blocked or already-claimed ticket, so
you cannot start work two sessions are duplicating. Orca creates worktrees too, provisioned the same
way via `orca.yaml`; created **from an issue**, its `issueCommand` claims the ticket and puts the
number in the branch, which is what makes the checkout reapable. Created any other way it does
neither. See `docs/agents/worktrees.md` — read it before running more than one session at a time.

**Every open task hangs off a map.** `frontier` walks maps downward, so a ticket attached to nothing
is invisible to it — the mechanism that quietly stranded eight tickets, including a one-line fix, in
early August 2026. The run ends with an `ORPHANED` list for exactly this; it should stay empty. When
you file a ticket, attach it:

```bash
gh api -X POST repos/{owner}/{repo}/issues/<parent>/sub_issues \
  -F sub_issue_id=$(gh api repos/{owner}/{repo}/issues/<child> --jq .id) -F replace_parent=true
```

A ticket that groups its own sub-issues is a **grouping, not a task** — `frontier` recurses past it
and lists its children. #83 (the Figma sync epic) is the pattern.

Two labels carry meaning beyond `wayfinder:*`:

- **`awaiting:nick`** — stalled on a decision no agent can make. Do not pick these up; if your work
  produces one, label it and say on the ticket what you need decided.
- **`bug`** — a defect in shipped work, as opposed to map-advancing work. Both can be `wayfinder:task`.

#### The label picks the skill

A lookup, read once when you claim, so the same kind of work gets the same treatment whoever picks
it up. It is not a wrapper: reach for the skill directly.

| You claimed a…        | Work it with                                                            |
| --------------------- | ----------------------------------------------------------------------- |
| `bug`                 | `mattpocock-skills:diagnosing-bugs`                                     |
| `wayfinder:task`      | `mattpocock-skills:tdd`                                                 |
| `wayfinder:research`  | `mattpocock-skills:research`                                            |
| `wayfinder:prototype` | `mattpocock-skills:prototype`                                           |
| `wayfinder:grilling`  | `mattpocock-skills:grilling`                                            |
| `wayfinder:map`       | nothing — it is a grouping. `frontier` recurses past it to its children |
| `awaiting:nick`       | nothing — do not pick it up                                             |

Two things the `wayfinder:task` row does not mean. **TDD is how you work the ticket, not who
dispatches it** — `/mattpocock-skills:implement` is still Nick's to fire (it runs one ticket per
subagent), and a session inside one of those subagents is exactly where `tdd` belongs. And **a task
with no behavior to drive out just gets done**: config, a doc, a table like this one. Red-green needs
something that can be red.

Skills that fire on what comes up mid-ticket rather than on the label:

| When                                                        | Reach for                       |
| ----------------------------------------------------------- | ------------------------------- |
| a decision got made with alternatives weighed               | `architecture-decision-records` |
| you are naming a schema, block, field or renderer           | `content-naming`                |
| you are writing copy for the site                           | `o3world-copy`                  |
| you are writing engineering prose — README, ADR, commit, PR | `no-slop`                       |

#### Never make Nick look a number up

**Every issue number you write gets a one-sentence summary the first time it appears in a reply.**
`#152` on its own is a lookup; "#152 — the nav pill is a design generation behind" is a sentence he
can act on. This holds for tickets you file, tickets you cite as related, and tickets another
session filed. One sentence, not a paragraph: what it is, and its state if that is the point.

**A decision you need from Nick gets asked in the chat, in full, not filed and pointed at.** Filing
`awaiting:nick` is how the work is _tracked_; it is not how the question is _asked_. Put the actual
choice in your reply — what is being decided, the two or three real answers, and which you would
pick — so he can answer in a sentence without opening anything. Then record the answer on the
ticket. An agent that files a ticket and says "see #157" has moved the work onto Nick's plate
instead of off it.

The board is [org Project 5](https://github.com/orgs/o3world/projects/5): `Board` is the kanban,
`Awaiting Nick` and `Ready to pick up` are the two views worth checking first. Its _auto-add
sub-issues_ workflow means attaching a ticket to a map puts it on the board — one more reason
attachment is not optional.

### Spec, tickets, implement

Work moves through three commands, in this order. **All three are `disable-model-invocation: true`
— only Nick can fire them.** An agent that needs one asks him to type it; it may not call the Skill
tool, and it may not do the work by hand instead. Doing it by hand is what happened on 2026-08-14,
and it produced a spec in the wrong place and tickets in the wrong shape.

```
/mattpocock-skills:to-spec       conversation → a spec, published as a GitHub issue
/mattpocock-skills:to-tickets    that spec → tracer-bullet tickets with blocking edges
/mattpocock-skills:implement     a ticket → the code, reviewed and committed
```

**A spec is a GitHub issue, not a file.** `docs/specs/` holds two documents that predate this rule —
`schema.md` and `scaffold-plan.md` — and they stay, because `README.md`, the `content-naming` skill
and several ADRs cite them as live references. Nothing new goes in that directory.

**Use the skill's template as written**, including the long User Stories list. It is not the
decision-first register `docs/specs/schema.md` uses, and that is deliberate: `to-tickets` and
`implement` read the spec downstream, so the shape they expect wins over the shape the older
documents have.

**`ready-for-agent` does not exist here.** `to-spec` and `to-tickets` both say to apply it; the
`triage` skill was never installed, so this repo has `wayfinder:*` and the frontier instead. Apply
**`wayfinder:task`** and **attach the issue to a map in the same breath** — an unattached ticket is
invisible to `frontier` whatever its labels say. `to-tickets`' blocking edges are native GitHub
dependencies, which is the same mechanism the frontier already walks, so they need no translation.

**`implement` runs one ticket per subagent.** One ticket, one worktree, one session is already the
rule (`docs/agents/worktrees.md`); a dispatched implementer inherits it. Two traps, both paid for
already:

- **Parallel implementers must not share a worktree.** File-heavy agents in one tree overwrite each
  other, and a green check mid-flight proves nothing — verify the settled tree.
- **The orchestrator reads across the tickets, the implementers do not.** Converging abstractions —
  two tickets growing the same helper from opposite ends — are only visible from above, so the
  orchestrator reviews for them rather than trusting each agent's own report.

### Content naming

Naming and wiring rules for schemas, fields, blocks, and renderers. Vocabulary lives in `CONTEXT.md` → Naming; the procedure is the `content-naming` skill (`.claude/skills/content-naming/`). Read both before touching `packages/sanity/src/schemas/` or `apps/web/src/content/`.

### Design source of record

**Figma is the design source of record** (map #33) — it outranks `prototype/`, which is retired.
Read `docs/agents/figma.md` before reading the file: which of the two registered MCP servers to use
(the official one is rate-limited and will fail), how to avoid reading a child node instead of the
frame, and the two-generations distinction that tells canonical frames from imported captures.

Frame → route map: [`docs/figma-frames.md`](https://github.com/o3world/o3-sanity/blob/research/figma-frame-inventory/docs/figma-frames.md)
(on branch `research/figma-frame-inventory`). Never build a page layer without checking it first.
Its canonical page frames are also on `main` as a machine-readable manifest —
[`tools/figma-sync/data/tracked-nodes.json`](./tools/figma-sync/data/tracked-nodes.json), every node
id verified as a frame. `pnpm figma:sync` tells you which of them changed since the last sync (one
API call when nothing has); see [`tools/figma-sync/README.md`](./tools/figma-sync/README.md).
**Commit the baseline it writes** — it is what makes the next run cheap.

Component → code map: [`docs/figma-components.md`](./docs/figma-components.md) — every component set,
its variant axes, and what it maps to (or deliberately doesn't). Its node ids are in the manifest
too, so `figma:sync` names the set that changed and the code it routes to; the same run asks about
any frame in the Design Concept section nobody has triaged yet. One Figma variant axis → one `cva`
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

**Loading a dataset is your job; creating or deleting one is not.** Deleting a
dataset here is unrecoverable — backups are an Enterprise feature and are not
enabled — and the Comments add-on (`production-comments`) is complimentary, so
it never counts toward a plan's dataset limit. Both rules, the rebuild-from-
scratch recipe, and the everyday command list live in
[`docs/agents/ops.md`](./docs/agents/ops.md). Read it before running any
`datasets` CLI command or touching sanity.io/manage.

### Agent guidance in the dataset

The Claude Desktop authoring skill carries no knowledge — it fetches it (#68).
The voice guide, the brand foundation, and the slop patterns live in the repo
as markdown and are pushed into the dataset as `guidance` documents by a
separate tool, which outlives the migration pipeline:

```bash
pnpm guidance:sync    # .claude/skills/o3world-copy/*.md → guidance documents
pnpm guidance:check   # fails if the dataset has drifted from the repo
```

**Edit the markdown, then sync.** A stale guidance document does not error —
it just makes everything an agent writes that session quietly wrong. Sources
are declared in `tools/guidance/src/sources.ts`; consumers read
`*[_type == "guidance"]{key, title, body}`.

Both commands are thin. The engine under them is `tools/guidance/src/corpus/` —
one pure function from (sources, dataset snapshot) to a plan: what to write,
what drifted, what no source claims. `sync.ts` and `check.ts` supply the client
and nothing else, which is what lets the plan be unit-tested without a project
or a token.

### Briefing a piece

Guidance tells an agent how to write anywhere; a **brief** is what one piece is
written from ([ADR 0027](./docs/adr/0027-the-brief-is-a-document.md)). It is the
second corpus on the same engine, registered by frontmatter in a globbed
directory rather than by a declared list:

```bash
pnpm brief:sync     # tools/guidance/briefs/*.md → brief documents
pnpm brief:check    # fails if a file-backed brief has drifted
pnpm brief:export   # a dataset-born brief becomes a file in the corpus
```

Briefing a piece is three steps. Drop a markdown file in
`tools/guidance/briefs/` with `key` and `title` in its frontmatter — the body
becomes the brief's `background`. Run `pnpm brief:sync`. Then point the piece's
seed JSON at `brief-<key>` through its weak `briefs` array. Load and sync in
either order; the reference is weak for that reason.

A brief also carries what an authoring run makes of it, one field per stage —
`stage`, `nextStep`, `thesis`, `readerQuestions`, `outline`, `draft`,
`verdict`, `decisions`, `gaps`, `pieceId` (#190). Each stage patches its own
fields, so a resuming session reads `stage` instead of parsing prose and two
stages cannot clobber each other. The markdown owns `background` and nothing
else; a brief written before #190 keeps its old `record` value as an
off-schema field that nothing reads.

Two rules the corpus config carries and the commands do not restate. A brief
syncs by **merge**, so everything a run patched survives a sync. And a
brief with no `sourcePath` was **born in the dataset** — `check` ignores it and
`sync` never deletes it. A file whose key a dataset-born brief already holds is
**refused rather than merged**, and `pnpm brief:export <key>` is the way out: it
writes that brief to `tools/guidance/briefs/` and makes the dataset copy
file-backed, so the next sync has nothing to write.

### Testing a skill in the o3sanity plugin

The plugin's only behavioural seam is its eval suite,
[`tools/authoring-skill/evals/`](./tools/authoring-skill/evals/README.md) — cases in `claude plugin
eval` format, run by the `o3-eval-runner` agent until the early-access flag lands, and by the CLI
unchanged after it. Sonnet runs the case, the skill under test, and any judge; a mechanical grader
(regex on the verdict line, a file assertion, a tool assertion) is always preferred to one.

**A skill ticket starts with a RED baseline.** Write the case and its graders first, run it once
with the skill withheld (`arm: without`), and paste the failures — the judged JSON and the model's
own rationalisations, verbatim — into the ticket before writing a line of guidance. A rule nobody
watched fail is a guess. The procedure, and how the failure's shape picks the form of the fix, is in
the eval README.

### Testing

Three layers — `unit` (`*.test.ts`), `render` (`*.render.test.tsx`), `stories` (`*.stories.tsx`).
Read `docs/testing.md` before writing one; decisions are in `docs/adr/0004-layered-test-approach.md`.

**Run tests as a checkpoint, not a loop.** `pnpm test` before opening a PR, and after a
migration batch or a new block — not after every edit, and never in watch mode during agent work.
There is no git hook; `pnpm verify` does not run tests. CI runs the suite as its own job.

**`pnpm vr` answers a different question than the suite does** — not "did it break?" but "what does
it look like now?". It builds Storybook for your working tree and for the merge base with `main`,
screenshots the stories your change can reach at two viewports, and opens a pixel diff. Local only:
no baselines are committed and nothing is uploaded. See
[`tools/visual-regression/README.md`](./tools/visual-regression/README.md), and tag a story
`vr:skip` if its pixels are genuinely non-deterministic.

Two rules that will otherwise cost an hour:

- A component with a story needs no test file — the story IS the test.
- Import `stegaClean` from `@sanity/client/stega`, never from the `next-sanity` barrel (lint-enforced;
  the barrel breaks every story for the block that imports it).
