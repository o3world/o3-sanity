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
point the skill asks for a nod. `../scenarios/` holds the two long-form
scenarios this format grew out of, and they are the model for that section.

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
`production`. Documents a run creates are named `eval-<case>-<slug>` and swept
at the end of the run; a case that means to leave one behind says so, and the
report says where it is.
