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

Naming and wiring rules for schemas, fields, blocks, and renderers. Vocabulary lives in `CONTEXT.md` → Naming; the procedure is the `content-naming` skill (`.claude/skills/content-naming/`). Read both before touching `packages/sanity/src/schemas/`, `packages/content-ui/src/` or
either app's `src/content/`. A block's renderer is **bound per app** wherever it lives, so adding or
renaming one is two bindings — `apps/web` and `apps/o3xo` — and the `satisfies` check in each
registry is what fails when you do only one. Where the renderer itself belongs is the table below.

### Where a component lives

Four homes. Find the row, and the row answers the placement question without a ruling.

| What it is                                               | Where it lives                                                                                 | What says so                                                                      |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Engine** — brand-free machinery                        | `packages/`, importing no app and reading no brand fact inside; a brand arrives as a parameter | that workspace's verdict in [`roster.json`](./tools/engine-seam/data/roster.json) |
| **Shared, one design** — both brands draw the same thing | schema in `packages/sanity`, renderer in `packages/content-ui`                                 | `CORE_SECTION_BLOCKS` and `BASE_BLOCKS`                                           |
| **Demoted, two designs** — one schema, a renderer each   | schema stays in `packages/sanity`; each app holds its own renderer and story                   | `APP_FIRST_RENDERERS`                                                             |
| **Brand-only** — one brand draws it at all               | whole in that app: schema, knobs, renderer, story, one directory                               | `BRAND_SECTION_BLOCKS`                                                            |

The last three rosters all sit in the block registry,
[`packages/sanity/src/schemas/blocks/registry.ts`](./packages/sanity/src/schemas/blocks/registry.ts).
Two seam tests hold the rows apart: `purity.test.ts` fails on an engine leak, and
`app-first-seam.test.ts` fails when a recorded renderer is still in the shared library, when an app
is missing its own, or when a fork nobody recorded appears.

Two rules move a component between rows, and both read off something mechanical rather than a
judgement made in the moment.

**Promotion** is
[ADR 0029](./docs/adr/0029-a-brand-only-block-lives-app-first-schema-included.md): a block joins the
core list the moment the second brand draws it, and until then it lives app-first, schema included.
ADR 0028 is where the same motion was first set for components.

**Demotion** is #286, and the trigger is the component map's classification. "Diverges structurally"
in [`docs/figma-components-o3xo.md`](./docs/figma-components-o3xo.md) demotes. "Needs variant or
field work" never does, and neither does a token or `cva`-value difference. Cite the kit frame and
node id when you apply it. A demoted block keeps its shared schema and stays core — two honest
designs over one shape, not a re-merged compromise — and the record entry carries the why and the
ticket. Adding one is a compile error in both apps until each binds its own renderer, which is what
makes the record bite before the test runs. Demotion is reversible on the same trigger read
backwards. A field changing meaning or becoming required for one brand is a schema fork instead,
which is outside the rule and stops the session (`awaiting:nick`).

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

**o3xo answers to a different file**, the _O3XO: UI kit_ (ADR 0028's second addendum). Its map is
[`docs/figma-components-o3xo.md`](./docs/figma-components-o3xo.md) and its watcher is
`pnpm figma:sync --brand o3xo` (#242) — cite a frame and a node id from that document when you build
an o3xo component, and edit it in the same breath as
[`tools/figma-sync/data/tracked-nodes-o3xo.json`](./tools/figma-sync/data/tracked-nodes-o3xo.json).

### Captured prototypes

Answered visual prototypes are committed to `apps/storybook/prototypes/` and served by Storybook as
dated, read-only snapshots (ADR 0010). They are **not** a source of record — take intent and sequence
from one, never values; tokens and variant axes come from Figma. Read
[`apps/storybook/prototypes/README.md`](./apps/storybook/prototypes/README.md) before adding one.
Prototypes that answered a _logic_ question stay on a throwaway branch instead.

**One capture is the exception, and it is the globe.**
`apps/storybook/prototypes/2026-08-globe-export/` holds the official globe exports, and they **are**
the source of record for that component — `OrbitalSphere` takes every value from them. Figma only
ever carried the globe as a flattened raster (one a blurred crop under a scrim, one a video capture
with a cursor in it), so there is no frame to outrank the export; a frame showing this globe is a
screenshot of it. Where the two disagree, the export wins, and a newer export is the only thing that
supersedes it. Do not "correct" the component's values back toward a frame. This exception is
specific to that directory — every other capture follows the rule above.

### Components and shadcn

**shadcn's anatomy, O3's tokens** (ADR 0008). shadcn is already adopted in
`packages/ui`; a component the CLI generates is a **draft** that must be
translated to O3 tokens before it lands — `bg-background` and friends do not
exist here and render as nothing. `shadcn-seam.test.ts` fails the build if you
skip it. Read [`packages/ui/README.md`](./packages/ui/README.md) before adding
one.

One Figma variant axis → one `cva` variants key. That rule is what makes the
component map in #38 mechanical rather than ad hoc.

Both brands render `packages/ui` and `packages/content-ui`, so a component there
may only name a token role **every** brand's package defines. `bg-accent` is
O3XO's alone and Tailwind bakes the value in as the utility's fallback, so it
paints yellow on an O3 page; `brand-token-seam.test.ts` derives the shared
vocabulary from the token packages and fails the suite on a brand-only role.

### Domain docs

Single-context layout — `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Changing a dataset

**The blanket `load` is GONE for o3 — the command refuses the brand outright,
in every dataset, and there is no flag** (`tools/migration/src/lib/loadRetired.ts`,
2026-09-03). Editors and content population own the datasets, `development`
mirrors `production` via `pnpm dataset:sync`, and a load reverts whatever the
seed files do not know about — so there is no longer a dataset where it is the
harmless operation it once was.

A dataset change ships as a **targeted migration**: a script under
`tools/migration/src/migrations/`, scoped to exactly the documents or assets
the change is about. `statsToBand.ts` is the worked example and the shape to
copy — it reports before it writes, refuses a dataset it was not told about out
loud, reruns as a no-op, and overwrites no field it did not come to change. Run
it, then say on the ticket what it touched.

`pnpm --filter @o3/migration verify` remains useful as a read-only check.
`load` still serves **o3xo**, whose only dataset holds nothing but the
pipeline's output and where no editor authors.

The production protections still apply to targeted work there: ADR 0003 is
inverted — what an editor wrote outranks the committed JSON. `pnpm
dataset:drift` names the documents an editor changed (lock them with
`-- --lock`, or port the edits into `data/`), `pnpm dataset:backup` writes a
tarball, and `pnpm dataset:sync` pulls production's content into `development`
without deleting anything.

**To rehearse an op, sync is only half of it.** `dataset:sync` imports with
`--replace`, so it overwrites what the two datasets share and leaves
development-only documents standing — and what development holds that
production does not is exactly what makes a rehearsal lie. `pnpm --filter
@o3/migration dev-mirrors-prod -- --apply` removes them, and only ever runs
against `development`. Sync, then mirror, then run the op: what you are looking
at is what production will look like. Back development up first — a
development-only document exists nowhere else. See `docs/agents/ops.md` →
"Production holds user content now".

**What `migration.locked` guards is a document's content being REPLACED FROM
OUTSIDE IT** — the pipeline overwriting an editor's version with the committed
JSON. That is the scope ADR 0003 gives it ("the pipeline never touches a locked
document, in any mode") and the scope `load` implements.

It is not a freeze on the document. A **transformation** — a script whose only
input is the document's own fields, moving or reshaping what is already there
and overwriting nothing — is outside the rule, and skipping locked documents
there just leaves the most carefully-tended pages as the broken ones.
`statsToBand.ts` is the case: it reads a case study's own `stats` and adds a
band drawn from them, so there is no outside version to lose.

The test is where the new value comes from. From `data/` or any source outside
the document, the lock applies and the run stops. From the document itself, it
does not.

**After a targeted migration, look at the result in a browser.** Skipping the
look once (#42's build-out) left a whole homepage reconciliation invisible:
the seeds were correct, the dataset was stale, and every screenshot taken to
check the work was of the old content.

**Creating or deleting a dataset is never your job.** Deleting a
dataset here is unrecoverable — backups are an Enterprise feature and are not
enabled — and the Comments add-on (`production-comments`) is complimentary, so
it never counts toward a plan's dataset limit. Both rules, the rebuild-from-
scratch recipe, and the everyday command list live in
[`docs/agents/ops.md`](./docs/agents/ops.md). Read it before running any
`datasets` CLI command or touching sanity.io/manage.

### Agent guidance lives in two homes

There is no guidance corpus and no `guidance` document type; the authoring
plugin carries its knowledge as files rather than fetching it (#192). Which
home a rule belongs to follows what it governs:

- **Shape** — `tools/authoring-skill/references/`. `argument.md` (how a long
  argument holds up), `composition.md` (which band follows which on a page),
  `style.md` (the style floor: plain sentences, a claim sourced in its own
  sentence, fact conservation), `labels.md` (the stage directions a draft body
  carries), `reader-test.md` (the last gate) and `portable-text.md` (every
  write mechanic). A skill reads these as
  `${CLAUDE_PLUGIN_ROOT}/references/<file>`; the table in the plugin's README
  says which skill reads which.
- **Voice** — `.claude/skills/o3world-copy/`, with `docs/guidance/brand.md`,
  `slop.md` and `visual.md` as its material. Persona, brand vocabulary and the
  slop-pattern list are deliberately not in the plugin; they re-enter it only
  when the eval loop produces a failure that asks for them.

**A rule lives in one home.** Restating one in the other is how the two drift,
and the drift is silent — it just makes everything written that session quietly
wrong.

### Briefing a piece

The references tell an agent how to write anywhere; a **brief** is what one
piece is written from
([ADR 0027](./docs/adr/0027-the-brief-is-a-document.md)). It is the repo's one
corpus — markdown registered by frontmatter in a globbed directory, synced to
`brief` documents:

```bash
pnpm brief:sync     # tools/guidance/briefs/*.md → brief documents
pnpm brief:check    # fails if a file-backed brief has drifted
pnpm brief:export   # a dataset-born brief becomes a file in the corpus
```

The commands are thin. The engine under them is `tools/guidance/src/corpus/` —
one pure function from (sources, dataset snapshot) to a plan: what to write,
what drifted, what no source claims. `brief-sync.ts` and `brief-check.ts`
supply the client and nothing else, which is what lets the plan be unit-tested
without a project or a token.

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

**`pnpm skill:lint` is the spec check**, and CI runs it as its own job. It validates each of the
five `SKILL.md` files with `skills-ref validate` — frontmatter that parses as YAML, a `name` that
matches the directory, a description inside the limit. `claude plugin validate` checks the manifest
and passes frontmatter that two YAML parsers reject, so it is not a substitute.

### Code review

`/code-review medium`, and no other level. `low` misses things, and `high`, `xhigh`, `max` and `ultra`
cost more than a review on this repo returns. Run it before a merge, not after every edit.

### Testing

Three layers — `unit` (`*.test.ts`), `render` (`*.render.test.tsx`), `stories` (`*.stories.tsx`).
Read `docs/testing.md` before writing one; decisions are in `docs/adr/0004-layered-test-approach.md`.

**Run tests as a checkpoint, not a loop.** `pnpm test` before opening a PR, and after a
migration batch or a new block — not after every edit, and never in watch mode during agent work.
There is no git hook; `pnpm verify` does not run tests. CI runs the suite as its own job.

**`pnpm vr` answers a different question than the suite does** — not "did it break?" but "what does
it look like now?". It builds Storybook for your working tree and for the merge base with `main`,
screenshots the stories your change can reach at two viewports, and opens a pixel diff. Local only:
no baselines are committed and nothing is uploaded. `--brand o3xo` runs the o3xo host instead; the
brand decides which module graph selects which stories, so o3xo work needs it (#242). See
[`tools/visual-regression/README.md`](./tools/visual-regression/README.md), and tag a story
`vr:skip` if its pixels are genuinely non-deterministic.

**`pnpm build:assert` holds the build to its rendering strategy** (#265). Run it after
`pnpm --filter @o3/web build`. It fails, naming the route, when a route the allowlist does not permit
is server-rendered on demand — the shape that bills a function invocation per page view. The
allowlist is [`tools/build-assert/src/policy.ts`](./tools/build-assert/src/policy.ts); CI runs the
assertion as its own job. See [`tools/build-assert/README.md`](./tools/build-assert/README.md).

Two rules that will otherwise cost an hour:

- A component with a story needs no test file — the story IS the test.
- Import `stegaClean` from `@sanity/client/stega`, never from the `next-sanity` barrel (lint-enforced;
  the barrel breaks every story for the block that imports it).
