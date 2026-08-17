---
name: gather
description: Start here for any new piece of o3world.com content — an insight, case study, or page. Sweeps the Sanity corpus, the web, and any source the human names, then reports found / missing / unverifiable at a gate before a word is drafted. Use whenever someone asks to write, draft, research, or continue O3 site content, or hands over notes for a piece. Stage 1 of 5; hands off to o3sanity:brief.
---

# Gather

Stage 1 of five. Everything already known about a subject is found and written
down before anyone argues about it, so the human is asked only what only they
can answer.

**Read `${CLAUDE_PLUGIN_ROOT}/CORE.md` before anything else** — the dataset, the
two rules, and how a run in progress is resumed. Everything here assumes it.

This stage produces exactly two things: a `brief` document holding what the
sweep found, and a gate the human answers. No other document in the dataset is
created or patched before that answer.

## 1. Take the info dump

**Open on the weight line.** A new piece arrives here, so this is where a run
says what size it is: CORE's classifier, first line of your first reply, above
the invitation below.

Invite the dump in that same reply, before you search anything, and say it is
meant to be messy:

> Dump everything you have on this — notes, links, half-finished drafts,
> numbers, who said what, what you have already told a client. Don't organise
> it.

Ask alongside it only for what a sweep cannot find out: who the piece is for,
and which type it is where the opening leaves that open. Two or three questions.
The interview belongs to stage 2.

Both answers go into `background` with the rest of what they said. `instructions`
is stage 2's field, so the audience and the type are recorded here as material
the human supplied, not written into a slot this stage does not own.

**A source they name is a pointer you resolve, not a note you file.** "Pull from
our case studies" is a search you run. A path is a file you open. A URL is a URL
you fetch. Carry every pointer into the sweep below.

## 2. Sweep three lanes

Work all three. Each item you come back with carries where it came from.

### The corpus lane

Query the dataset for what it holds on this subject and read those documents for
what they **say** — the facts, numbers, quotes and claims O3 has already put in
public.

Query **broadly**: by title, by slug segment, by the subject's own words, and by
the words a colleague would have used instead. A single narrow query reports a
clean subject on a subject that is not clean.

Four things to come back with, past the material itself:

- **Documents already on this subject.** A slug collision is a naming problem; a
  subject collision is an editorial one, and the dataset will not flag it. Every
  hit goes to the gate by id.
- **Briefs.** A brief on this subject is the run you are resuming or the one this
  piece reuses. Read its `stage` and `nextStep` first — see CORE's resume rule.
- **Provisional notes.** `migration.provisionalNote` marks a claim nobody
  verified. A number found under one is a gap wearing a number's clothes.
- **Attributable quotes.** Who said it and where it was published, or it is not a
  quote this piece can use.

### The web lane

Where a claim in the material is publicly checkable, check it: one source per
claim, and the source is a URL you actually opened. Regulations, product
announcements, dated events and third-party figures all belong here. Prefer the
primary document to a summary of it.

Read what the source **says**, not only that it exists. A forecast is not an
outcome, and a figure republished by three outlets has one source, not three.

Where the surface running you has no web access, say so plainly at the gate, and
every unchecked claim goes on the Unverifiable list rather than into the brief
as a fact.

### The environment lane

Sources the human named that live somewhere this machine can reach: a file, a
repo path, a transcript, a document behind a tool you have. Retrieve each one and
read it.

**A pointer you could not reach is a finding, and it goes on the gap list naming
the pointer exactly as given** — the URL, the path — and what it was meant to
carry. Try it before you call it unreachable, and try the obvious near misses: a
moved URL, the same file under another name. A pointer that fails and is not
written down leaves the next session with a brief that reads as though it was
never offered.

Material handed over from outside the dataset — a prior draft, a transcript, a
deck — goes into `background` as it stands. Its claims are not sourced by having
been written down once: a fact from a prior draft needs a source like any other.

## 3. Write the brief

**Gathering produces a brief document. Write it every run, before the gate.** A
sweep that found little is the run whose record matters most: without it the
next session repeats the same three dead ends and arrives back here.

One `brief-<key>` per subject. Look for it first — the corpus lane already
listed the briefs.

- **It exists** — patch it. Do not create a second.
- **It does not** — one `create_documents` call, `_type: "brief"`, with
  `_id: "brief-<key>"`, a `key` of lowercase words joined by hyphens
  (`[a-z0-9]+(-[a-z0-9]+)*`), and a `title` saying what the brief is about in a
  few words. The key names **the subject, not the piece**, because a second piece
  on the subject reuses it. The call makes a draft, so what comes back is
  `drafts.brief-<key>`; the id you write is the published one, and that is the id
  everything else addresses.

Set these fields and no others:

| Field        | What goes in it                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `background` | the human's dump in their own words, then every item the sweep found, each carrying its source     |
| `links`      | every URL — theirs and the ones you opened                                                         |
| `gaps`       | one entry per thing nobody has: unreachable pointers by name, unverifiable claims, facts they lack |
| `stage`      | `gather` — this stage finished, whatever the sweep turned up                                       |
| `nextStep`   | what a session picking this up does first, in a sentence                                           |
| `decisions`  | the weight you announced, and the collision the human resolved below                               |

`thesis`, `readerQuestions`, `outline`, `draft`, `verdict` and `pieceId` belong
to stages nobody has dispatched. Leave them empty. Never set `sourcePath`.

## 4. Put the gate to the human

Report in this shape, and end on the line:

```
## Found
- <what it is> — <where it came from>

## Missing
- <what the piece needs> — <who could supply it>

## Unverifiable
- <the claim> — <what would settle it>

GATHER GATE: found 3 / missing 2 / unverifiable 1 — your call before stage 2
```

**Every Found item names where it came from, in its own line** — a URL for the
web, a document id for the corpus, a path for a file, and "you, in this
conversation" for what the human told you. An item with no origin at all is
recall wearing a finding's clothes, and the next stage cannot tell the two
apart.

What the human supplied is found material, not missing material. It goes on the
Found list attributed to them, and their own account of the subject is often the
only thing on it — a sweep where every pointer died still found what they said.
Missing is for what nobody has yet.

The three counts match the three lists, and nothing follows the gate line.

### Where the corpus already has this subject

Add this block above the gate line, one entry per colliding document, and put
the three options to the human as the thing you are waiting on:

```
## Already on this subject
- <title> (`<document id>`) — <what it covers, and where it agrees or disagrees>

Extend, supersede, or differentiate?
```

- **Extend** — the new material goes into the existing document, and no new
  piece is written.
- **Supersede** — the new piece replaces it. Retiring the old one is a human
  step: write it on the gap list naming the document. Until they do it that
  document still holds its slug, so the new piece takes one of its own.
- **Differentiate** — both stand, and the human says what the difference is.
  Record their answer on `decisions`.

Recommend one, and say why. The human picks. A collision you resolve yourself is
an editorial decision made by the tool, and it reaches the brief as settled fact
where a later session cannot see a choice was ever made.

**A find that complicates the piece is the one to lead with**, especially an
existing document that contradicts what the human wants to argue. It costs a
sentence here and a redraft later.

## Then stop

This is a gate. Stage 2 does not begin until the human has answered it — the
lists and, where there is one, the collision. Their corrections and additions
are material: patch them into `background`, `links` and `gaps` before handing on
to `o3sanity:brief`.
