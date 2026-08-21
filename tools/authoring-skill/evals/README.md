# Evals

The o3sanity plugin's test surface. A case is a prompt, a scripted persona, and
the graders that say what right looks like — the only behavioural seam the
plugin has. A skill change is checked by running cases, not by reading the diff.

Cases are authored in [`claude plugin eval`](https://code.claude.com/docs)
format. The early-access flag is not on for this account, so the CLI refuses to
run them today and the [`o3-eval-runner`](../../../.claude/agents/o3-eval-runner.md)
agent runs them instead. **The format is the durable artifact and the runner is
disposable**: same layout, same grader types, same report shape, so a case
written today runs unchanged the day the flag lands.

## Layout

```
evals/
├── grade.mjs               the mechanical graders, and the case-format check
├── fixtures.mjs            run-scoped fixture ids, and the ledger teardown reads
├── <case>/
│   ├── prompt.md           frontmatter + the task
│   └── graders/
│       └── <grader>.md     one grader, typed by its frontmatter
└── results/                run output, timestamped, never committed
```

`evals/` at the plugin root is where `claude plugin eval` looks by default, so
nothing in `plugin.json` has to point at it.

## `prompt.md`

```yaml
---
name: References read
tags: [smoke]
plugins: ['../..'] # the plugin under test, relative to the case
runs: 1 # CLI default is 3
max_turns: 8
timeout_seconds: 300
allowed_tools: [Read, Glob, Write]
model: sonnet
---
The task, written to the agent that will run it.
```

`append_system_prompt` and `env` are also accepted; `env` keys must start with
`EVAL_`. Anything else is rejected by the format check.

**The persona lives in the body.** Plugin eval has no persona field, so a case
that needs a human writes the scripted answers into the prompt under their own
heading — who the stakeholder is, what they know, and what they say at every
point the skill asks for a nod. `gather-gate/prompt.md` is the fullest one, and
the model to copy: the register, the dump he pastes when invited, an answer per
question the skill asks, and the line that makes the section exhaustive —
_facts come from this section or they do not exist_.

## Graders

One file per grader, `type` in the frontmatter, the body a rubric or the reason
the assertion exists. **Prefer a mechanical grader to a judge**: it is cheaper,
it is repeatable, and it does not have an opinion.

| `type`        | Fields                                | Asserts                            |
| ------------- | ------------------------------------- | ---------------------------------- |
| `regex`       | `pattern`, `flags`, `match`, `target` | text somewhere the run produced    |
| `tool_used`   | `tool`, `input_match`, `min`, `max`   | a tool was called, or was not      |
| `tool_order`  | `before`, `after`                     | one call preceded another          |
| `file_exists` | `path` (glob)                         | the run produced a file            |
| `llm`         | `criteria`, `focus`, `target`         | a judgement no assertion can carry |
| `baseline`    | `baseline_file`, `criteria`           | this run against a recorded one    |

`match` is `contains` (default), `not_contains`, or `count:N`. `target` is
`last_message` (default), `trace`, `files` — the paths the run produced — or
`{ source: file, path: <produced file> }` for its contents.

**Evidence the engine cannot read stops the grading.** A `transcript.jsonl`
line that does not parse, or a grader typed outside that table, exits
`grade.mjs` non-zero with nothing on stdout — there is no run to judge. Graded
anyway is the dangerous outcome: a dropped tool call fails a `tool_used` grader
it satisfied, or passes a `max: 0` one it violated, and the report reads as a
judgement of the skill ([#200](https://github.com/o3world/o3-sanity/issues/200)).

**Evidence nobody wrote down stops it too.** The transcript is narrated by hand
until the CLI captures it, so silence in one is ambiguous where silence from a
real capture is not: a call nobody logged and a call nobody made look the same,
and every `min: 0` grader passes on both. A transcript-reading grader with no
transcript, a `tool_used` or `tool_order` grader with no call recorded at all,
and a `tool_use` line missing its name or carrying a sentence where its
arguments belong are all refused rather than scored
([#202](https://github.com/o3world/o3-sanity/issues/202)). What survives is one
line missing from many — write a prohibition as a dataset assertion where you
can, because a document read back from Sanity cannot be forgotten into a pass.

**Write MCP tool names as the plugin declares them.** The plugin's `.mcp.json`
registers the server as `sanity`, so a case names `mcp__sanity__query_documents`
— that is the name under `claude plugin eval`. This repo's own `.mcp.json`
registers `Sanity`, so a local run records `mcp__Sanity__query_documents`
instead. `grade.mjs` compares tool names case-insensitively so one case covers
both, and `allowed_tools` follows the plugin.

Three idioms worth copying:

- **The verdict line.** Review ends in `BLOCKING: true|false (reason)` as the
  last line, and a `regex` grader on `last_message` with `flags: m` is what
  makes it a gate rather than a sentence.
- **The skill fired.** `type: tool_used`, `tool: Skill`,
  `input_match: '"skill"\s*:\s*"(?:[\w-]+:)?<skill>"'`. Under an ablation run
  this is an indicator rather than a score — of course the skill did not fire
  on the arm where it was withheld.
- **The dataset says so.** There is no GROQ grader type and none is needed. The
  runner saves every document a run touched to `workspace/dataset/<id>.json`,
  read back from the dataset, so a claim about the brief is an ordinary `regex`
  grader over a produced file — and it stays that when the CLI takes over.

## Authoring a case, from a skill ticket

1. `mkdir evals/<case>/graders`, write `prompt.md` with `model: sonnet`, and
   write the graders **first**. A grader written after the run describes what
   happened instead of what was wanted.
2. `node grade.mjs --validate <case>` — the format check, and the same check
   `pnpm test` runs over every case in this directory.
3. Run the RED baseline (below) and paste its failures into the ticket.
4. Write the skill against those failures.
5. Re-run. GREEN is the same graders passing.

## Running one

Dispatch the `o3-eval-runner` agent with the case directory:

> Run the eval case `tools/authoring-skill/evals/references-read`, arm `with`.

It runs the prompt, captures the transcript and the artifacts under
`results/<timestamp>/<case>/<arm>-<n>/`, applies the graders with `grade.mjs`,
and emits `aggregate-result.json`:

```
cases[].arms.{with,without}[].graders[] → { name, type, passed, score }
```

When the flag lands the same case runs as
`claude plugin eval tools/authoring-skill --case <case> --model sonnet --judge-model sonnet`,
and `--ablation with-without` fills the `without` arm the runner fills by hand.

**Results are not committed.** A judged run belongs to one revision of one
skill and goes stale the moment either changes; `results/` is gitignored for
that reason. Quote the JSON in the ticket, where it stays attached to the
change it judged.

## The RED baseline

**No skill without a failing test first.** Every skill ticket runs its scenario
once _without_ the skill and records the failures verbatim before a line of
guidance is written. That run is the licence for every line the skill later
carries; guidance written without one is a guess wearing a rule's clothes.

Run the case with `arm: without` — the runner withholds the plugin's skills and
answers from its own defaults — and keep three things:

- **the judged JSON**, which says which graders a bare model already passes.
  Those need no guidance, and writing it anyway costs context for nothing.
- **the rationalisations, verbatim.** The sentence the model talks itself out
  of a step with is the sentence the skill has to answer.
- **the shape of the failure**, because it picks the form of the fix: a
  wrong-shaped output takes a positive recipe of what the output is; a skipped
  step takes a hard gate; an omission takes a required slot in the template; a
  discipline failure takes a prohibition and a rationalisation table. Reach for
  a prohibition on a shaping problem and it lands worse than no guidance at
  all.

Then write the skill, re-run, and put both arms in the ticket. Under the CLI
this is one command — `--ablation with-without` runs both arms and reports them
side by side.

## Model policy

Sonnet, everywhere: the runner, the skill under test, and any `llm` judge. A
skill that steers Sonnet steers a larger model too, and the cases are run often
enough that the difference is the whole budget. The model is pinned in
`prompt.md`, in the runner's frontmatter, and checked by the format test — a
case that names another model fails before it runs.

## What a run may touch

The `development` dataset, drafts only. Never publish, never address
`production`.

**The fixture id belongs to the case; the document belongs to one run.** A case
writes `brief-eval-<case>-<slug>` and its graders name that same id, so the case
reads the same whoever runs it. The run mints a six-character tag and puts it on
the end of every id it seeds — `brief-eval-typeset-insight--k3f9q2` — so two
runs of one case in one dataset never write the same document. `fixtures.mjs`
does both halves: `scope` puts the tag on an id going into the dataset, `settle`
takes it back out of everything the run captured, so a grader targeting
`dataset/brief-eval-typeset-insight.json` finds the file and matches its
contents. **No case file mentions a tag**, and none should: a case that names
one is a case that runs once.

**A piece is deleted by name, not by prefix.** The tag cannot reach a piece
document, because typeset derives its id from the slug — `insight-<slug>`,
`page-<slug>`, no prefix — and that id shape is the thing the typeset cases
exist to check. A prefix here would test a rule the plugin does not have. The
ledger covers it instead: the runner appends every id it brings into being to
`created-ids.txt` as the create call happens, and teardown discards exactly
those. The ledger is what was missing when six runs of the typeset cases left
pieces in `development` that no sweep could identify
([#201](https://github.com/o3world/o3-sanity/issues/201)).

**The harness deletes and the skill under test never does.** `CORE.md` gives
discarding a draft to a human in Studio and every case prompt repeats it, so a
run that swept up after itself would be failing its own rule. Teardown runs
after the last message is captured, outside the case's `allowed_tools`, and it
is not a transcript line.

Run cases in batches of two or three. What limits the batch is how much of a
report you can read, not id collision. A run that dies before teardown still
leaves its documents behind, but its `created-ids.txt` survives in `results/` —
`fixtures.mjs teardown` on that old run directory is how they go.
