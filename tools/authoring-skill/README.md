# O3 authoring (`o3sanity`)

The authoring capability from map #63: a vague idea becomes a
publishable-quality Sanity draft — an insight (blog post), case study, or
page — in the O3 voice.

**Five skills, one per stage of the pipeline** (#193). Each owns one
artifact-state of the `brief` document, so where a piece stands is a document in
the dataset rather than a position in a conversation — which is what lets a run
stop in one session and continue in another.

| Skill              | Stage | What it does                                                | State |
| ------------------ | ----- | ----------------------------------------------------------- | ----- |
| `o3sanity:gather`  | 1     | sweeps corpus, web and environment; ends at the gather gate | built |
| `o3sanity:brief`   | 2     | the interview, the agreed thesis, the locked questions      | built |
| `o3sanity:draft`   | 3     | the outline, then the piece as prose, into the brief        | built |
| `o3sanity:review`  | 4     | the gates and the reader test, ending in a verdict          | built |
| `o3sanity:typeset` | 5     | the reviewed draft becomes the real Sanity document         | #197  |

The unbuilt skill carries its stage contract and stops when triggered. That
is deliberate: a skill that improvises a stage writes a thesis or a verdict
nobody agreed to, and the document cannot tell that apart from one that was.

## What every skill reads first

[`CORE.md`](./CORE.md) at the plugin root, reached from a skill as
`${CLAUDE_PLUGIN_ROOT}/CORE.md`. It carries what all five share: the Sanity
resource block and the dataset rule, the two hard rules (drafts only; every fact
carries its source), the resume rule, and the table of which stage owns which
brief field.

It sits at the root rather than in `references/` because every skill reads it
unconditionally, on every run. The files below are reached only by the branch
that needs them.

## What the plugin carries (`references/`)

The structural knowledge the pipeline cannot run without, reachable as
`${CLAUDE_PLUGIN_ROOT}/references/<file>`:

| File                        | What it governs                                                        |
| --------------------------- | ---------------------------------------------------------------------- |
| `references/argument.md`    | how one long argument holds up — claim, warrant, arc, turn, ending     |
| `references/composition.md` | which band follows which on a page, and which block carries which job  |
| `references/style.md`       | the style floor: plain sentences, sourced claims, fact conservation    |
| `references/labels.md`      | the stage directions a draft body carries, and what each one means     |
| `references/reader-test.md` | the last gate: both probes, what the reader gets, and what a fail does |

These replaced the session-start dataset fetch the skill used to do (#192). The
style floor is a floor and not a voice: persona, brand vocabulary, and the
slop-pattern list stay in the repo's `o3world-copy` skill and re-enter here only
as the eval loop produces an observed failure that asks for them.

`references/labels.md` is the odd one out: not craft but a **contract**, and the
only file three skills share. `draft` writes body labels by it, `review` reads
them as theater directions, `typeset` converts by them — so a change to it is a
change to three skills at once.

`gather` points at none of them — it writes nothing for the site, so it pays for
nothing. Stages 2 to 5 are where they come in.

## Testing a skill

The test surface is [`evals/`](./evals) — cases in `claude plugin eval` format,
graded mechanically, run today by the `o3-eval-runner` agent and by the CLI once
the early-access flag lands. **A skill change is checked by running cases**, and
a new skill starts with the RED baseline the eval README sets out: run the
scenario once with the skill withheld, record the failures verbatim, and write
only the guidance those failures license. `gather`'s baseline is on
[#193](https://github.com/o3world/o3-sanity/issues/193).

[`scenarios/`](./scenarios) holds the two long-form scripts that format grew out
of.

## Claude Code (plugin)

This directory is a Claude Code plugin. It ships the five skills and
preconfigures the hosted Sanity MCP server (`https://mcp.sanity.io`); auth is
per-user OAuth via `/mcp`, never distributed. Install from the repo-root
marketplace:

```
/plugin marketplace add o3world/o3-sanity
/plugin install o3sanity@o3world
```

**Install it at user scope.** A project-scoped install belongs to the directory
it was made in, and this repo works one ticket to one worktree — the directory
goes away, and the next worktree has the plugin enabled in
`.claude/settings.json` with nothing installed to serve it. What that looks like
from inside a session is a skill that is simply absent.

Update with `/plugin marketplace update o3world` (or enable auto-update in
`/plugin` → Marketplaces). The marketplace serves `main`, so a change is only
installable once it is merged.

The same two steps have a CLI form, which is the one an agent can run:

```
claude plugin marketplace update o3world
claude plugin install o3sanity@o3world   # --scope user is the default here
```

To exercise an unmerged change without installing anything, load this directory
into one session:

```
claude --plugin-dir tools/authoring-skill
```

That is also how the skill list is checked — all five should appear namespaced,
`o3sanity:gather` through `o3sanity:typeset`. `claude plugin validate
tools/authoring-skill` checks the manifest, and the same command against
`skills/` checks the five skill files.

## Claude Desktop

**No distribution, as of #193.** A Desktop custom skill is one folder and
nothing outside it is reachable, so a plugin of five skills sharing `CORE.md`
through `${CLAUDE_PLUGIN_ROOT}` has no correct ZIP to build. `pnpm build:skill`
and `pnpm skill:wire` both exit non-zero saying so rather than shipping an
artifact that installs cleanly and then fails on its first instruction. #198
decides whether Desktop gets its own distribution or the surface retires.
