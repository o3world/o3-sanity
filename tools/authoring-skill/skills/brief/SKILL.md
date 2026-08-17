---
name: brief
description: Turns what gathering found into the plan for one piece — the agreed thesis, the locked reader questions, and the outline, each confirmed by the human before any prose exists. Use once a gather gate has been answered, or when asked to plan, scope, shape, or outline an o3world.com insight, case study, or page. Stage 2 of 5; reads the brief that o3sanity:gather left and hands off to o3sanity:draft.
---

# Brief

Stage 2 of five. **Its workflow is not written yet — it lands in #194.**

**Read `${CLAUDE_PLUGIN_ROOT}/CORE.md`** for the dataset, the two rules, and the
resume rule.

## The stage contract

|                  |                                                                  |
| ---------------- | ---------------------------------------------------------------- |
| Expects on entry | a brief whose `stage` is `gather`, with an answered gate         |
| Writes           | `instructions`, `thesis`, `readerQuestions`, `outline`           |
| Leaves           | `stage` = `brief`, and `nextStep` naming what stage 3 does first |

## If you were triggered now

Say so and stop. Report which brief you are looking at, what its `stage` and
`nextStep` say, and that stage 2's workflow lands in #194.

Do not improvise the stage. A thesis and five reader questions invented without
the rounds that produce them are indistinguishable, in the document, from ones a
human agreed to — and every stage after this is written and reviewed against
them. An empty field costs one session; a fabricated agreement costs the piece.

Where the human wants to move now, the honest route is the one the retired
monolith already allowed: they state the thesis themselves, in this
conversation, and you record it as theirs.
