---
name: typeset
description: Turns a reviewed draft into the real Sanity document — portable text blocks, slug, required fields, and the weak reference back to the brief. Runs only on a brief whose review verdict is `pass`; a failing or missing verdict stops it and sends the piece back to o3sanity:review. Use when asked to typeset, create the document for, or publish-prep an approved o3world.com draft. Stage 5 of 5.
---

# Typeset

Stage 5 of five. **Its workflow is not written yet — it lands in #197.**

**Read `${CLAUDE_PLUGIN_ROOT}/CORE.md`** for the dataset, the two rules, and the
resume rule.

## The stage contract

|                  |                                                                        |
| ---------------- | ---------------------------------------------------------------------- |
| Expects on entry | a brief whose `stage` is `review` and whose `verdict.result` is `pass` |
| Writes           | the piece document, and `pieceId` on the brief                         |
| Leaves           | `stage` = `typeset`, and `nextStep` naming what the human does next    |

**The verdict is a blocking condition.** Where `verdict.result` is `fail`, or
there is no verdict at all, this stage does not run: say which it was and send
the piece back to `o3sanity:review`. A draft is only ever typeset on a check
that actually passed.

## If you were triggered now

Say so and stop. Report which brief you are looking at, what its `stage`,
`nextStep` and `verdict.result` say, and that stage 5's workflow lands in #197.

Do not improvise the stage. This is where a brief becomes a document with a slug
on the live site's content model, and it is the one stage whose output a human
finds by browsing rather than by asking — an early one lands a half-formed piece
where everyone can see it.
