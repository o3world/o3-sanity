---
name: typeset
description: Turns a reviewed draft into the real Sanity document — portable text blocks, slug, required fields, and the weak reference back to the brief. Runs only on a brief whose review verdict is `pass`; a failing or missing verdict stops it and sends the piece back to o3sanity:review. Use when asked to typeset, create the document for, or publish-prep an approved o3world.com draft. Stage 5 of 5.
---

# Typeset

Stage 5 of five. The approved markdown becomes the document, and the run ends
with the piece in the human's hands. Nothing here is written: every word in the
document came out of `draft`, and the work is putting it in the right containers
without losing any of it.

**Read `${CLAUDE_PLUGIN_ROOT}/CORE.md` before anything else** — the dataset, the
two rules, and how a run in progress is resumed. Everything here assumes it.

## The stage contract

|                  |                                                                        |
| ---------------- | ---------------------------------------------------------------------- |
| Expects on entry | a brief whose `stage` is `review` and whose `verdict.result` is `pass` |
| Writes           | the piece document, and `pieceId` on the brief                         |
| Leaves           | `stage` = `handed-off`, and `nextStep` naming what the human does next |

**`handed-off`, not `typeset`.** Every other stage writes its own name, and this
one writes the enum's last value instead, because the pipeline is over and the
piece is now a human's to publish. `typeset` is the stage you are running; the
brief records where the work now sits.

## 1. The gate

Read the brief. `verdict.result == "pass"` is the licence to proceed, and it is
the only one.

**Anything else stops the run** — a `fail`, or no verdict at all. Say which it
was, name the gate that failed, and end the message on this line with nothing
after it:

```
TYPESET: refused — <which it was, and the gate that stopped it>, back to o3sanity:review
```

The check is mechanical because the temptation is not. "Review's done" means a
review ran, and a review that ran is exactly how a failing verdict is produced.
Done and passed are different states, and this stage is the last thing standing
between a draft that only reached the first one and a document on the live
content model.

### The override

**The human's explicit say-so in this conversation is the only way past a
failing verdict.** Not a `nextStep` that sounds encouraging, not a gate that
failed narrowly, not their urgency — them, saying to build it anyway, after you
have told them what failed.

When they do, build it, and record that they did:

```
Verdict gate overridden by the human: <what they said, and which gate had failed>
```

That string goes on `decisions`, whole. Six weeks later a piece built on an
override and a piece built on a passing verdict are the same document; the entry
is the only thing that tells them apart, and a run that phrases it its own way
has written a note where the record was needed.

## 2. Read what you are converting

Three things, every run:

- **The brief.** `draft.title`, `draft.excerpt` and `draft.body` are what you
  convert. `gaps` and `decisions` say what the piece may not do, and they carry
  forward — a gap nobody closed is still open after typesetting.
- **[`labels.md`](../../references/labels.md) and
  [`portable-text.md`](../../references/portable-text.md)**, from
  `${CLAUDE_PLUGIN_ROOT}/references/`. The first is the grammar the draft was
  written in; the second is every mechanic for what you send. On a page,
  [`composition.md`](../../references/composition.md) as well.
- **The schema, per type.** `get_schema` for the document type, for **every
  section block a label names**, and for **every named field-level type the
  piece writes into** — each before the thing built from it. `bodyText` is the
  field-level one that keeps coming up: it is an array type and neither a
  document nor a band, so the rule names it rather than leaving it to a
  category. The no-type overview omits field descriptions, and the descriptions
  are where a field's authoring guidance lives. A band composed from memory is a
  band composed against a schema you invented.

## 3. Build the document

One `create_documents` call, which drafts by default.

**Conserve every fact.** The piece that comes out carries every name, number,
date, quotation and citation `draft.body` went in with, and adds none. This is
the one stage that touches reviewed prose without being asked to write any, so a
fact lost between the markdown and the blocks is lost with no gate left to catch
it — and a clause improved on the way through is drafting, after the draft was
approved.

Two things the conversion is not allowed to decide:

- **Nothing is dropped.** A label's parts and the passages under it line up; a
  passage with no asset behind it still becomes its member, with the gap
  recorded. `portable-text.md` has the shape.
- **Nothing is added.** A field nobody decided stays empty and goes on the
  hand-off list. `seo` is the one that keeps coming up.

## 4. Patch the brief, and hand off

**Patch the brief first**, wherever it has stopped being true. Re-fetch it, and
pass `ifRevisionId` on this patch and on every other one — see
`portable-text.md`. Holding a `_rev` is not the same as passing it.

| Field       | What goes in it                                                            |
| ----------- | -------------------------------------------------------------------------- |
| `pieceId`   | the id of the document you created                                         |
| `stage`     | `handed-off`                                                               |
| `nextStep`  | what the human does — publish in Studio, and fill the named gaps           |
| `gaps`      | what the piece still needs, appended: empty slots, assets, unfilled fields |
| `decisions` | any call this stage made, and the override entry above if there was one    |

`thesis`, `readerQuestions`, `outline`, `draft` and `verdict` belong to earlier
stages. Leave them. Never set `sourcePath`.

Then close with the hand-off summary: the document id and the path it will serve
at, the dataset, the brief it ran from, every gap and empty slot, and what the
human does before publishing. End on this line, with nothing after it:

```
TYPESET: <document id> — <dataset>, <n> gaps
```

The summary scrolls away and the brief does not, which is why the gaps are in
both. The line is what the next thing in the chain reads.
