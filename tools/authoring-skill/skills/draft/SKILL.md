---
name: draft
description: Proposes the outline — an arc by name, confirmed at a gate — then writes the piece as prose against it: title, excerpt and body, into the brief document rather than into Sanity blocks, so a rewrite costs no block surgery. Use once a thesis is agreed, or when asked to outline, write, rewrite, or extend the body of an o3world.com insight, case study, or page. Stage 3 of 5; hands off to o3sanity:review.
---

# Draft

Stage 3 of five. **Its workflow is not written yet — it lands in #195.**

**Read `${CLAUDE_PLUGIN_ROOT}/CORE.md`** for the dataset, the two rules, and the
resume rule.

## The stage contract

|                  |                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------- |
| Expects on entry | a brief whose `stage` is `brief`, carrying a thesis and the locked reader questions |
| Writes           | `outline`, then `draft.title`, `draft.excerpt`, `draft.body`                        |
| Leaves           | `stage` = `draft`, and `nextStep` naming what stage 4 does first                    |

The piece is prose here, not blocks. `draft.body` is markdown carrying the block
each passage becomes as an inline label; the grammar of those labels is #195's,
and stage 5 reads them.

## If you were triggered now

Say so and stop. Report which brief you are looking at, what its `stage` and
`nextStep` say, and that stage 3's workflow lands in #195.

Do not improvise the stage. Prose written against no agreed thesis reads exactly
like prose written against one, and stage 4 reviews it against a thesis that was
never agreed — so the check passes and the piece argues something nobody chose.
