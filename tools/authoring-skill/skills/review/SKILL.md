---
name: review
description: Runs the gates on a drafted piece — structure, front door, style floor, and a context-free reader test — and records a pass or fail verdict on the brief. Use whenever an o3world.com draft needs checking before it becomes a real document, or when asked to review, critique, sanity-check or fact-check one. Stage 4 of 5; its verdict is what unblocks o3sanity:typeset.
---

# Review

Stage 4 of five. **Its workflow is not written yet — it lands in #196.**

**Read `${CLAUDE_PLUGIN_ROOT}/CORE.md`** for the dataset, the two rules, and the
resume rule.

## The stage contract

|                  |                                                                   |
| ---------------- | ----------------------------------------------------------------- |
| Expects on entry | a brief whose `stage` is `draft`, carrying `draft.body`           |
| Writes           | `verdict.result`, `verdict.gates`, `verdict.readerAnswer`         |
| Leaves           | `stage` = `review`, and `nextStep` naming what stage 5 does first |

The verdict is a gate, not advice: `pass` is what lets stage 5 run, and a `fail`
is the record of why rather than a reason to delete the draft. Its exact
contract — which gates run, in what order, and what each records — is #196's.

## If you were triggered now

Say so and stop. Report which brief you are looking at, what its `stage` and
`nextStep` say, and that stage 4's workflow lands in #196.

Do not improvise the stage, and above all do not write a `verdict`. A passing
verdict is the only thing standing between a draft and a real document, so one
written without the gates behind it removes the check while looking exactly like
it ran. Reading the draft and saying what you think of it, in the chat, with no
write to the brief, is fine and is not a verdict.
