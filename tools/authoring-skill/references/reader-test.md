# The reader test

A reader who has only the document answers the questions the piece was written
to answer. Every other check reads the piece knowing what it is for; this one
does not, which is why it catches the thing none of the others can — a piece
that is well-shaped, well-sourced, plainly written, and does not land.

**A wrong answer is a defect in the document.** The reader is never re-briefed,
argued with, or replaced.

## What the reader gets

Three things and nothing else: the title, the excerpt, and the body **as
rendered prose**.

- **Labels come out.** `draft.body` carries a block label on each passage.
  Those are stage directions for typesetting — the grammar is in
  [`labels.md`](./labels.md) — and a reader shown them is reading machinery
  instead of an argument. Strip every one.
- **The thesis stays out.** It is the answer to question one. So does the
  brief, the outline, the reader questions' provenance, and this file.
- **On a page, the three fields need translating.** The title is the page's,
  the excerpt is `card.excerpt`, and the body is the bands flattened into what
  a visitor meets from the top: eyebrows, headings and subheadings in order,
  each feature or panel heading with its body, labelled detail lists, button
  labels in square brackets. Keep the cues a visitor genuinely sees; drop
  `_key`, `_type`, block names and surface names.

## Two probes, one round

Both run against the same settled text, in the same round, each with its own
reader.

**Probe one — the locked questions.** Give the reader `readerQuestions`
verbatim and in order, and ask for an answer to each in the reader's own words,
plus "I could not answer this from the document" where that is the honest
answer. This probe decides the gate.

**Probe two — what the document did not say.** A separate reader, the same
text, three questions: what did you have to guess at, what did the piece assume
you already knew, and where does it contradict itself? This probe finds no
verdict; it produces findings.

**Probe two's findings are recorded, not fixed here.** Fixing one changes the
text probe one has already judged, and the test does not run twice. They go to
`gaps` and into the closing message as the next pass's work.

## Where it runs

- **A subagent, where the surface has one.** Sonnet, dispatched with the prompt
  and no other context. Show its answers in full — a summary of the reader is
  the review's opinion again.
- **A fresh chat, everywhere else.** Emit one self-contained block: the
  questions, then the rendered title, excerpt and body. Say to paste it into a
  new conversation and paste the answers back. The isolation is the point; the
  automation is not.

## Judging probe one

Compare answer one against the agreed thesis:

- **Pass** — they say the same thing. An answer that carries the claim but
  re-weights it is a pass: a reader who leads on the half you put second has
  read the piece. Say which weight moved, and record it on `decisions`.
- **Fail** — a different claim, or the reader could not answer.

Then every remaining question: **a locked question the reader cannot answer
from the document is a fail.** The question was agreed before drafting because
the piece exists to answer it, and an absence is the one defect no
sentence-level check can see.

Report the reader's sentence and the agreed one side by side. Where there is no
agreed thesis — an existing piece with no brief — the reader states what the
document argues and **the human confirms whether that is the intended one**. A
mismatch there is a finding with no proposed fix: "this does not argue what you
think it argues" has no row-level edit.

## The four rules that keep it a test

- **It runs on settled text.** Every edit from an earlier gate is written to the
  draft before the reader sees a word. A reader shown a stale revision has
  tested a document that no longer exists.
- **It runs once.** Never re-run it hoping for a better reader.
- **A fail blocks the hand-off, not the draft.** The draft stays where it is and
  the human decides what happens to it. Never re-draft to make your own test
  pass: the reader who would have judged the rewrite has already run.
- **Questions are added, never removed or reworded.** Up to two, and a question
  added after the test has run is a note for whoever picks the piece up next
  rather than something this run answers. Record it unanswered, and say why it
  was worth adding.

Two kinds of added question, filed differently. One the draft suggested is that
note. One the piece **declines** to answer is a defect in its scope — a reader
arrives with it and the piece sends them elsewhere — and it goes to `gaps` to be
settled before publish, and into the closing message as something the piece does
not do. Say that plainly: a scope defect reported as housekeeping is how a piece
ships without the answer it was written for.

## Writing it down

`verdict.readerAnswer` takes each locked question in the order it was locked,
the reader's answer to it, and whether that answer passed. Probe two's findings
go to `gaps`. What the reader said is the evidence; the review's summary of it
is not.
