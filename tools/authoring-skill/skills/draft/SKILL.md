---
name: draft
description: Proposes the outline — an arc by name, confirmed at a gate — then writes the piece as prose against it — title, excerpt and body, into the brief document rather than into Sanity blocks, so a rewrite costs no block surgery. Use once a thesis is agreed, or when asked to outline, write, rewrite, or extend the body of an o3world.com insight, case study, or page. Stage 3 of 5; hands off to o3sanity:review.
---

# Draft

Stage 3 of five. The shape is agreed before a word of prose exists, and then the
prose is written to the shape.

**Read `${CLAUDE_PLUGIN_ROOT}/CORE.md` before anything else** — the dataset, the
two rules, and how a run in progress is resumed. Everything here assumes it.

## The stage contract

|                  |                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------- |
| Expects on entry | a brief whose `stage` is `brief`, carrying a thesis and the locked reader questions |
| Writes           | `outline`, then `draft.title`, `draft.excerpt`, `draft.body`                        |
| Leaves           | `stage` = `draft`, and `nextStep` naming what stage 4 does first                    |

**The proposal lives in your message, not in a field.** `outline` takes the
shape the human confirmed; `draft` takes the prose written to it. Writing either
one early is how the document comes to claim a confirmation nobody gave, and a
resuming session cannot tell the two apart.

The piece is prose here, not blocks. A rewrite at this stage costs a `text`
patch; the same rewrite after stage 5 costs block surgery.

## 1. Read what the shape is made of

Open the files. **A name you remember is not a name in the file** — the arcs and
the bands both have names, and proposing one you did not read is proposing a
shape the corpus does not have.

| The piece is a… | Read, from `${CLAUDE_PLUGIN_ROOT}/references/`                                              |
| --------------- | ------------------------------------------------------------------------------------------- |
| insight         | `argument.md`, `style.md`, `labels.md`                                                      |
| case study      | `argument.md`, `composition.md`, `style.md`, `labels.md`                                    |
| page            | `composition.md`, `argument.md` (its claim and evidence bars only), `style.md`, `labels.md` |

Then read the brief itself: `thesis` and `readerQuestions` are what you are
writing to, `background` is what you are writing from, and `gaps` and
`decisions` are the two lists that say what this piece may not do. A fact that
is on `gaps` is not available to the draft however well it would fit.

**On a page, `composition.md` outranks `argument.md` wherever they disagree.**
The argument guide hands page arrangement to the catalog; take it at its word.
Two disagreements are known and the catalog wins both: a page ends on a
`ctaSection` despite the warning against a closing sales line, and a band the
catalog places for rhythm stays despite "cut what does not break the next
section". `argument.md` still governs the page's claim, warrant and evidence.

## 2. Propose the shape

### How much freedom the type has

| Type       | Its shape is…                                                          | Freedom  |
| ---------- | ---------------------------------------------------------------------- | -------- |
| insight    | an arc, chosen by name — or a new one specified the way the three are  | flexible |
| case study | the chapter template below, in order, every slot filled or named empty | strict   |
| page       | a band list, with the ink bookends fixed and the middle argued         | mixed    |

**An insight — an arc by name.** One of `argument.md`'s three, or a fourth you
specify the way it specifies them: what it opens on, how it moves, how it ends,
when to reach for it, and which of the three came closest and where it broke.
Name the runner-up either way.

**A case study — the template.** Chapters in the order the work happened, each a
`kicker` and a title: what the client came with, dated and named; the mechanism,
one chapter per phase; what shipped; what happened, numbered and sourced. A slot
with nothing to fill it is named at the gate as a gap, never quietly dropped. A
deviation from the order is argued at the gate rather than taken.

**A page — a band list.** Each band by its schema name, in order, with its job
and its surface. Surface rhythm is part of the proposal: the ink bookends and
the single mid-page ink moment decide which band carries the page's centre, so
they are decided here and not applied afterwards as styling.

### Annotate every section

Each section carries two lines, and this is the mechanic that makes flow
checkable rather than felt:

- **Requires** — the concepts the section leans on. Written `—` where it leans
  on nothing.
- **Grounds** — the concepts it introduces, which every later section may then
  require.

List the **prerequisites** once, above the sections: what the named reader walks
in already holding. A section's Requires is met when it appears in the
prerequisites or in an earlier section's Grounds. Demand too much up front and
you shut readers out; ground too much inside and the opening drowns.

**Where a Requires is met by nothing, say so on its own line** — the three
honest answers are a section that grounds it, a narrower claim, or a gap nobody
can close in this piece, and the human picks between them:

```
UNGROUNDED: <concept> — required by <section>, grounded by nothing before it. <what would close it>
```

**A Requires that names something on `gaps` is ungrounded by definition.** The
gap list is already the record that nobody has it, so no section can ground it
and no amount of drafting will supply it. Check each section's Requires against
`gaps` before you write the gate line — that check is the one that catches the
question the brief locked and the material cannot answer.

### Map the locked questions

Name, for each locked question, the section that answers it. This is the only
point where the questions and the shape are both in front of you. A question no
section answers is a hole a reader falls into; a section answering no question is
context, which may stay, but say what it is for.

### Forecast the length

For prose, against `argument.md`'s bands — a long argument is 1,100–1,400 words
and nothing in a decade reaches 2,000. For a page, the bar is
`composition.md`'s band count, four to eight. An outline pointing past the top
usually means the claim is two claims, and saying so while the middle is still a
list of headings is cheap.

### The proposal, in full

Copy this shape.

```
Arc: <name>
Runner-up: <name> — <why this material does not take it>

Prerequisites: <concept>, <concept>

1. **<section>** — <what it does, in one line>
   Requires: <concept>, <concept>
   Grounds: <concept>
   Answers: Q1, Q3

2. **<section>** — …
   Requires: …
   Grounds: …
   Answers: Q2

UNGROUNDED: <concept> — required by <section>, grounded by nothing before it. <what would close it>

Length: <n> words across <n> sections — <the band that sits in>

OUTLINE GATE: <arc name> / <n> sections / <n> ungrounded — your call before a word of prose
```

**A page uses this shape instead**, and the difference is four lines, not a
mental substitution — a page counts bands, and the word `sections` on a page's
gate line is the wrong unit reported to the human:

```
Bands: heroSection (ink) → layoutSection (bone) → railPanelsSection (bone) → ctaSection (ink)
Runner-up: <the second band you turned down> — <why not>

Prerequisites: <concept>, <concept>

1. **heroSection** — <the job this band does on the page>
   Requires: —
   Grounds: <concept>
   Answers: Q1

UNGROUNDED: <concept> — required by <band>, grounded by nothing before it. <what would close it>

Length: <n> bands — composition.md's bar is four to eight

OUTLINE GATE: page / <n> bands / <n> ungrounded — your call before a word of prose
```

Nothing follows the gate line. **Its ungrounded count is the number of
`UNGROUNDED:` lines above it, and the two have to agree** — a count of 1 with no
line is a flag written into a paragraph, where the human reading the gate will
not find it. Where nothing is ungrounded the count is `0` and the line is
absent.

## 3. The gate

Stop. No prose, no patch, no field — and no piece document at any point in this
stage, since the insight, case study or page is stage 5's to create. Drafting
starts when the human confirms the shape as proposed — the arc or band list, the
section list, and the question map, which they are confirming as much as the
order.

**A human who hands you an outline is the only override.** Inventing one and
proceeding is not, and neither is a shape that "barely changed" from a previous
pass.

Six things you may catch yourself thinking here. Each one was thought, in those
words, by a model running this stage without this file — and each is answered:

| The thought                                                                          | What is true                                                                                                                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| "A rejected alternative reads as hedging — give one shape, not a menu."              | A menu hedges. A runner-up with a reason is the evidence that a choice was made rather than a first idea kept.                       |
| "The ledger is bookkeeping for whoever drafts, not for whoever approves."            | The ledger is most of what is being approved. It is the only part of the outline that says the sections are ordered, not listed.     |
| "I flagged that in the paragraph above."                                             | A flag nobody can find is a flag nobody acts on. It goes on its own `UNGROUNDED:` line.                                              |
| "The thesis moved but the shape mostly survives, so this pass can draft on."         | A second pass stops at the same gate. "Mostly survives" is the claim the gate exists to test.                                        |
| "This brief is specific enough that the shape is not a decision only they can make." | The gate does not scale with the task. A brief specific enough to make the shape obvious is a brief where confirming costs one line. |
| "Those brief fields are `readOnly`, so they are not mine to write."                  | `readOnly` means Studio does not edit them, because they are machine-written. These are the fields this stage exists to write.       |

**When the human confirms, patch `outline` with the shape they confirmed** —
their amendments applied, the annotations and the question map included, as
markdown. Stage 4 tests the draft against what each section said it required and
stage 5 reads the same document; an annotation left in the chat reaches neither.

### Running again on an amended brief

A brief whose thesis or questions moved gets a shape proposed **fresh**. Name
the previous arc, say what about the new thesis it no longer fits, and rebuild
the ledger rather than carrying it over. A second draft is a different shape,
not the same paragraphs reordered — and naming both arcs is what lets the human
check that in one line instead of reading 1,200 words to find out.

## 4. The front door

The title, the excerpt and the first paragraph are one decision, not three
fields: a reader meets them in that order inside fifteen seconds, and between
them they make a single promise. Read `argument.md`'s front-door section before
writing any of the three.

**A page has a front door too**, and it runs the same way: the page title, the
`card.excerpt` a listing shows, and the `heroSection` band standing where a
first paragraph stands. It is the one place `argument.md` still governs a page,
because a promise is a claim rather than an arrangement.

**Offer two or three, each implying a different thesis-emphasis, and let the
human pick.** Not three phrasings of one opening — three openings that would
each commit the piece to a different first move.

```
### Opening 1 — <the thesis this one implies>
Title: <title>
Excerpt: <one or two sentences, naming who should keep reading>
First paragraph: <the paragraph, written out in full>

### Opening 2 — <a different thesis>
Title: …
Excerpt: …
First paragraph: …

Recommend: <n> — <why this material takes it>
```

Then ask, and wait. The body is written to the opening they picked.

## 5. Write the body

Markdown into `draft.body`, with the labels
`${CLAUDE_PLUGIN_ROOT}/references/labels.md` defines — an insight body is
almost all clean markdown, a page names every band. The test that grammar
exists to pass: delete every line starting with `(` and the piece reads aloud
unbroken.

Write to the outline, section by section in its order, and keep the annotations
honest — a section may only lean on what its Requires named. `style.md` is the
floor every sentence meets, and two rules from CORE do the most work here:

- **Every fact carries its source, named in the sentence that carries the
  claim** — the client, the project, the person who said it. `links` is where a
  fact-checker looks; a reader sees only the prose.
- **A gap stays a gap.** A number nobody has does not become a number under
  drafting pressure. Where the shape wants one, write the sentence without it or
  say plainly that it is not known.

Then read it once against `argument.md`'s shuffle test, at both levels: a
section only readable in its place, and a paragraph that opens on something the
paragraph before it established. What that test catches is not fixed by adding a
connective — it is fixed by finding the sentence the next paragraph is answering
and putting it last in this one.

## 6. Patch the brief, and hand off

One field per patch, under `ifRevisionId` — CORE's two patch mechanics:

| Field           | What goes in it                                                        |
| --------------- | ---------------------------------------------------------------------- |
| `draft.title`   | the picked opening's title                                             |
| `draft.excerpt` | its excerpt                                                            |
| `draft.body`    | the piece as markdown, labelled                                        |
| `stage`         | `draft`                                                                |
| `nextStep`      | what stage 4 does first, in a sentence — it is `o3sanity:review`       |
| `decisions`     | any scoping call this stage made: a section cut, a shape turned down   |
| `gaps`          | anything the drafting found that nobody has, appended to what is there |

`thesis`, `readerQuestions`, `verdict` and `pieceId` belong to other stages.
Leave them. Never set `sourcePath`.

Close by saying which brief you wrote to, which dataset, the arc or band list by
name, the word or band count against the forecast, and what is still on `gaps`.
