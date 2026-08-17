# Scenarios

**The graded test surface is [`../evals/`](../evals).** A scenario is the
long-form script a case's persona section is written from: the two here predate
the eval format, they are run by hand through the `o3-authoring-scenario` agent,
and their judgement is a human reading a transcript rather than a grader.

A scenario is an idea for a piece plus
scripted stakeholder answers — a persona, the facts it knows, and what it says
at every point the skill asks for a nod. It is not sample content; it exists so
that a change to `SKILL.md` can be checked against behaviour instead of against
a reading of the diff.

Two scenarios, and between them they exercise every move the pipeline makes:

| File                     | Content type | What it puts under load                                                         |
| ------------------------ | ------------ | ------------------------------------------------------------------------------- |
| `eu-ai-watermark.md`     | insight      | evidence handed over, publicly checkable facts, raw material from a prior draft |
| `sanity-landing-page.md` | page         | evidence delegated to the corpus, band composition, a subject already covered   |

## Running one

The `o3-authoring-scenario` agent (`.claude/agents/o3-authoring-scenario.md`)
takes one scenario, runs the skill against it exactly as written, and returns a
structured transcript — which guidance it read, every question and the answer
it took, the outline and the confirmation that released it, each gate and its
result, and every point where the skill's text did not steer it. The transcript
is the product; the draft is a by-product.

Give the agent the scenario file and nothing else. An agent that improves the
skill mid-run measures itself instead of the skill.

## Verifying a change

Run and diff. Keep a transcript from before the change, run the same scenario
against the amended skill, and read the two side by side — the diff is the
evidence that the change did what it claimed, and the place any regression
shows up. Judge behaviour, not phrasing: did the run gather and cite before it
interviewed, hold the gather gate, fork the outline by content type, surface a
subject collision, fill the required fields, leave pipeline state in the
brief's `record`.

Scripts are the committed artifact; transcripts are not. A transcript belongs
to one run against one revision of the skill, and it goes stale the moment
either changes. Keep the ones you are diffing outside the repo.

Editing a script breaks the comparison it exists for. Where a scenario needs to
change — new material, a sharper persona — say so in the commit, and treat
every prior transcript as a baseline for a different test.

## What a run touches

Runs write real drafts, because a draft that was never written proves nothing.
They write to the `development` dataset only, they never publish, and they
never touch `production` — the runner agent's standing rule, and the skill's.
