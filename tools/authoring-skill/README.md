# O3 authoring (`o3sanity`)

A Claude Code plugin that takes a vague idea to a publishable-quality Sanity
draft — an insight (blog post), case study, or page — in the O3 voice. It
drafts and it never publishes. The last stage hands a human a draft in Studio,
and the human decides.

Five skills, one per stage of a pipeline (map #63). Each owns one
artifact-state of a `brief` document, so where a piece stands is a document in
the dataset rather than a position in a conversation — which is what lets a run
stop in one session and continue in another.

## The pipeline

| Skill              | Stage | What it does                                                 | Writes to the brief                         | Ends on                                      |
| ------------------ | ----- | ------------------------------------------------------------ | ------------------------------------------- | -------------------------------------------- |
| `o3sanity:gather`  | 1     | sweeps the corpus, the web and the environment               | `background`, `links`, `gaps`               | `GATHER GATE: found n / missing n / …`       |
| `o3sanity:brief`   | 2     | two rounds of questions, then a sentence the human agrees to | `instructions`, `thesis`, `readerQuestions` | `THESIS AGREED: <the sentence>`              |
| `o3sanity:draft`   | 3     | proposes a shape, gates it, then writes the prose to it      | `outline`, `draft`                          | `OUTLINE GATE: …`, then the drafted body     |
| `o3sanity:review`  | 4     | five blocking gates and a context-free reader test           | `verdict`                                   | `BLOCKING: true\|false (<reason>)`           |
| `o3sanity:typeset` | 5     | the reviewed draft becomes the real Sanity document          | `pieceId`, and the piece itself             | `TYPESET: <document id> — <dataset>, n gaps` |

Each stage gates on the state the one before it left, and every gate is a line
a machine can match rather than a paragraph a human has to interpret. Stage 5
refuses to run on anything but `verdict.result == "pass"`.

The pipeline ends at `handed-off`: the piece is a draft on the live content
model, and publishing it is a human's move in Studio.

## The brief contract

The middle column above is the whole of it. A skill writes the fields its own
stage produces and leaves the rest alone, so a field belonging to a stage
nobody has dispatched stays empty. That emptiness is load-bearing: it is how a
later session tells an unanswered gate from an answered one. Filling a field
early is how a run quietly claims a confirmation nobody gave.

Four fields belong to whichever stage is running: `stage` (the stage that
finished), `nextStep` (what the next session does first), `decisions` (any
scoping call the run made), and `gaps` (opened by gather, appended to by
everyone). Between `stage` and `nextStep` they are the resume rule — a run
that stopped mid-flight carries on from there rather than from the top.

[`CORE.md`](./CORE.md) is where the skills read this, and it is the normative
copy.

## What the plugin carries

Every skill opens by reading `${CLAUDE_PLUGIN_ROOT}/CORE.md`. It holds what all
five share: the Sanity resource block and the dataset rule, the two hard rules
(drafts only; every fact carries its source), the weight classifier, the resume
rule, how a stage patches the brief, and the field table above.

It sits at the plugin root rather than in `references/` because every skill
reads it unconditionally, on every run. The files below are reached only by the
branch that needs them, as `${CLAUDE_PLUGIN_ROOT}/references/<file>`:

| File                          | What it governs                                                        | Read by                |
| ----------------------------- | ---------------------------------------------------------------------- | ---------------------- |
| `references/argument.md`      | how one long argument holds up — claim, warrant, arc, turn, hierarchy  | brief, draft, review   |
| `references/composition.md`   | which band follows which on a page, and which block carries which job  | draft, review, typeset |
| `references/style.md`         | the style floor: plain sentences, sourced claims, fact conservation    | draft, review          |
| `references/labels.md`        | the stage directions a draft body carries, and what each one means     | draft, review, typeset |
| `references/reader-test.md`   | the last gate: both probes, what the reader gets, and what a fail does | review                 |
| `references/portable-text.md` | every write mechanic — keys, the revision guard, labels into blocks    | typeset                |

These replaced the session-start dataset fetch the skill used to do (#192). The
style floor is a floor and not a voice: persona, brand vocabulary, and the
slop-pattern list stay in the repo's `o3world-copy` skill, and re-enter here
only as the eval loop produces an observed failure that asks for them.

`references/labels.md` is the odd one out — not craft but a **contract**.
`draft` writes body labels by it, `review` reads them as theater directions,
and `typeset` converts by them, so a change to it changes what three skills do
in lockstep. The other shared files are read for judgement, and two skills
reading one of those can disagree about a piece without either being wrong.

`references/portable-text.md` is the opposite case: `typeset` is its only
reader, and it holds every portable-text write mechanic in the plugin. A run
building a document from anything else is building against mechanics it
inferred.

`gather` points at none of them. It writes nothing for the site, so it pays for
nothing; stages 2 to 5 are where they come in.

`scripts/` is the exception to all of this: it is **executed, not read**.
[`scripts/slop-lint.mjs`](./scripts/slop-lint.mjs) counts the machine tells that
have a fixed shape, and `review` runs it across its two revision passes as
`${CLAUDE_PLUGIN_ROOT}/scripts/slop-lint.mjs --delta`. Its rules come from the
repo's `docs/guidance/slop.md` and are calibrated to score zero over approved
site copy — [`scripts/fixtures/`](./scripts/fixtures/README.md) is that
calibration, and the six rules it deleted. The signal is the delta between a
draft and its revision; the absolute decides nothing.

## Testing a skill

The test surface is [`evals/`](./evals) — cases in `claude plugin eval`
format, graded mechanically, run today by the `o3-eval-runner` agent and by the
CLI once the early-access flag lands. A case is a prompt, a scripted persona,
and the graders that say what right looks like. **A skill change is checked by
running cases**, not by reading the diff.

A new skill starts with the **RED baseline** the [eval
README](./evals/README.md) sets out: run the case once with the skill withheld,
record the failures verbatim, and write only the guidance those failures
license. Guidance written without one is a guess wearing a rule's clothes. Each
skill's baseline is on its ticket — gather on
[#193](https://github.com/o3world/o3-sanity/issues/193), then #194 to #197.

`pnpm skill:lint` validates all five skill files against the agent-skill spec,
and CI runs the same command as its own job.

## Install

This directory is a Claude Code plugin. It ships the five skills and
preconfigures the hosted Sanity MCP server (`https://mcp.sanity.io`); auth is
per-user OAuth via `/mcp`, never distributed.

**The marketplace rides the clone.** `.claude/settings.json` at the repo root
declares two marketplaces under `extraKnownMarketplaces` — `o3world`, which is
this repo, and `sanity-agent-toolkit`, for the Portable Text skills this plugin
does not carry — and enables `o3sanity@o3world` and `sanity@sanity-agent-toolkit`.
Trust the folder and Claude Code registers both with no further prompt, so
`/plugin marketplace add` is no longer a step anyone types. Both entries carry
`autoUpdate`. The agent-toolkit plugin configures the same hosted Sanity MCP
server this one does, so enabling both connects to `https://mcp.sanity.io`
twice and pays for the tool list twice.

Installing is still a step. From Claude Code v2.1.195 a plugin that only
project settings enable, and that comes from an external source such as a
GitHub repository, does not load until you install it — Claude Code reports it
as not installed and prints the command:

```
claude plugin install o3sanity@o3world            # --scope user is the default here
claude plugin install sanity@sanity-agent-toolkit
```

**Install at user scope.** A project-scoped install belongs to the directory
it was made in, and this repo works one ticket to one worktree — the directory
goes away, and the next worktree has the plugin enabled in
`.claude/settings.json` with nothing installed to serve it. What that looks
like from inside a session is a skill that is simply absent.

**Updates need no version bump.** `plugin.json` declares no `version`, so
Claude Code identifies the plugin by the commit it was fetched at and every
push is an update. `autoUpdate` on the marketplace entry picks it up in the
background shortly after a session starts; `claude plugin marketplace update
o3world` forces it now. The marketplace serves `main`, so a change is only
installable once it is merged.

**Claude Desktop installs from the same marketplace.** The plugin needs no
separate build and no ZIP. One constraint holds for it: nothing in the plugin
may depend on a Claude Code feature that Desktop does not have, and the one
Code-shaped thing it does rely on is `${CLAUDE_PLUGIN_ROOT}` — the variable
every skill resolves `CORE.md` and the references through. A Desktop
verification pass has not run yet, so treat that variable as the one thing to
check there first.

To exercise an unmerged change without installing anything, load this directory
into one session:

```
claude --plugin-dir tools/authoring-skill
```

That is also how the skill list is checked: all five should appear namespaced,
`o3sanity:gather` through `o3sanity:typeset`. `claude plugin validate
tools/authoring-skill` checks the manifest — it does not read the skill
frontmatter as YAML, which is what `pnpm skill:lint` is for.
