---
name: brief
description: Turns what gathering found into the commitment one piece is written against — the agreed thesis and the locked reader questions, each confirmed by the human before any prose exists. Use once a gather gate has been answered, or when asked to plan or scope an o3world.com insight, case study, or page. Stage 2 of 5; reads the brief that o3sanity:gather left and hands off to o3sanity:draft.
---

# Brief

Stage 2 of five. Two rounds of questions, one sentence the human agrees to, and
five questions the piece will be tested against. Every stage after this one is
written to them and reviewed against them.

**Read `${CLAUDE_PLUGIN_ROOT}/CORE.md` before anything else** — the dataset, the
two rules, the weight of a run, and how a run in progress is resumed.

**Read `${CLAUDE_PLUGIN_ROOT}/references/argument.md` and keep it open while you
ask.** It sets out what a claim has to be, what a warrant is, and when evidence
is too thin. It is what you judge the answers against, so apply it rather than
recalling it.

## The stage contract

|                  |                                                                  |
| ---------------- | ---------------------------------------------------------------- |
| Expects on entry | a brief whose `stage` is `gather`, with an answered gate         |
| Writes           | `instructions`, `thesis`, `readerQuestions`                      |
| Leaves           | `stage` = `brief`, and `nextStep` naming what stage 3 does first |

The piece itself is not created here, and neither is the outline. Both belong to
stages nobody has dispatched: a draft written against an unagreed thesis is the
one thing this stage exists to prevent.

## Ask only what only they hold

Three things a human holds that no sweep reaches:

1. **First-party fact and genuine opinion** — what O3 did, what it cost, who it
   was for, and what they actually believe is true.
2. **What went wrong** — the failure, the constraint, the thing that did not
   work and the version of it that did.
3. **Judgement** — the analogy, the prediction, the call on what matters.

Anything else is something you can settle yourself from what gathering found.
Settle it, and put your answer into the round as the recommended answer rather
than as a question. That is what makes two rounds enough.

**Every question carries your recommended answer**, drawn from the sweep, so the
human nods instead of composing. A nod is an answer.

## On a light run

CORE's classifier collapses gathering and the interview into one round, and
gathering already asked it. So on a light run you ask no rounds at all: go
straight to step 4 with the thesis you would have recommended, take the
confirmation, and finish the stage. Steps 1 to 3 are the standard path.

An answer that turns out to carry a real claim upgrades the run — announce it
and pick the rounds up from step 1.

## 1. Round one — askable cold

One message, this shape:

```
## Round 1

1. Who is this for? Name the reader, not a segment. ➡️ <recommendation>
2. What is the one claim? ➡️ <recommendation>
3. Which type — insight, case study, or page? ➡️ <recommendation>

Nod to all three, or say which to change.
```

Then wait. Questions dribbled out one at a time are the same questions at four
times the cost, and the human loses track of what is still open.

## 2. The required fields, read off the schema

Once the type is known, call `get_schema` **with that type** — without it you
get type names and no fields. Take every field the type marks required, plus its
taxonomy references, and read the field descriptions: they carry the authoring
guidance that turns a recommendation into an informed one.

Add any field the reader test will need, required or not. On a page that is
`card.excerpt`: the test hands the reader an excerpt, that is where a page's
comes from, and the schema does not require it. A reader given an empty one
tests two-thirds of the piece, and the test does not re-run.

Leave out the fields the drafting writes — `title`, `slug`, `excerpt`. They are
required, and they are the piece, so asking now is asking the human to nod at a
headline nobody has written.

Put the rest in one list with a recommendation against each line. This is a list
to nod at, not a round. Where the human has no answer, the slot decides what
happens next:

- **A slot the piece itself decides** — a date, a page type — takes your
  recommendation, and **the recommendation goes on `decisions` because you took
  it**. Unrecorded, it reads to the next session as a fact somebody supplied. An
  unset required field is a draft they cannot publish without coming back to
  you, and a publication date is a publishing slot rather than a claim about the
  world: stamp the day you drafted and say that you stamped it.
- **A reference slot** — a byline, a category, a client — stays empty and goes
  on `gaps`. Recommend the closest existing document by name; a byline is a
  person's name and a missing category is a taxonomy change, and neither is
  yours to mint.

## 3. Round two — none of it askable before the claim

```
## Round 2

4. What is the warrant — why does that evidence get you to that claim?
   ➡️ <recommendation>
5. What do you hold that the sweep could not reach? ➡️ <recommendation>

Nod, or correct me.
```

They read the found list at the gate, so do not put it in front of them again.
Question five asks for what it missed.

**There is no third round.** Everything a third round would ask is either
something you can settle from what gathering found — settle it — or a gap, and a
gap is recorded rather than asked twice.

## 4. The agreed thesis

One sentence, put to them as a sentence rather than as a summary of the
interview. Where they give you wording, the wording is theirs: this field is
what every later stage is written to, so a tidied paraphrase is a piece written
against something nobody agreed to.

Confirmed means they said yes to that sentence. Answering the questions is not
confirmation, and neither is enthusiasm about the subject.

Write it back on its own line:

```
THESIS AGREED: <the sentence, exactly as confirmed>
```

**Nothing this stage writes to the dataset happens before that line.** The
interview going well is not authorisation; the sentence is. The one override is
a human who hands you a thesis themselves — record it as theirs, write the line,
and carry on from step 5.

## 5. The five reader-test questions

Five, forecast from the thesis and the reader they named: what a reader can
answer after one pass. Question one is fixed, word for word:

> In one sentence, what is this arguing?

On a page, question two is fixed as well — _"What does this page recommend, and
why?"_ — because a page has to carry its argument past a reader who never
retains the name of the thing it is selling.

**Every question past the first tests a part of the thesis, and one of them is
the question the named reader arrives with.** A question about the background a
reader needs in order to follow the claim is a note that you found the context
interesting, and stage 3 will build a section to answer it — which is how a
third of a piece ends up on what led to the subject rather than on the subject.
Check each one against the thesis sentence, then write all five out and lock
them.

Locked means the review stage tests this draft against these five, in this
order. A question can be added later; none is reworded.

## 6. Patch the brief

Gathering created the brief and this stage patches it, by CORE's two patch
mechanics: per-field `set` ops over the fields below, never a document rebuilt
in context and sent back whole, and `ifRevisionId` on the call.

| Field             | What goes in it                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `instructions`    | what they asked for: the reader they named, the type they picked, what to argue and on what warrant, what to avoid |
| `thesis`          | the confirmed sentence, in their words                                                                             |
| `readerQuestions` | the five, in the order they were locked                                                                            |
| `decisions`       | the run's weight, and every recommendation you took rather than were given                                         |
| `gaps`            | appended: every reference slot nobody could fill, and anything the rounds turned up that nobody has                |
| `stage`           | `brief`                                                                                                            |
| `nextStep`        | what stage 3 does first, in a sentence                                                                             |

`outline`, `draft`, `verdict` and `pieceId` belong to stages nobody has
dispatched. Leave them empty, and never set `sourcePath`.

## Then hand on

Say what was agreed — the thesis, the five questions, what went on the gap list
— and name the dataset you wrote to. Then hand to `o3sanity:draft`, which builds
the outline this brief now supports.
