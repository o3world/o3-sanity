---
name: o3-authoring
description: Draft or revise o3world.com content in Sanity — insights (blog posts), case studies, and pages. Use whenever asked to write, draft, or edit O3 World site content from an idea or notes.
---

# O3 authoring

Turn a vague idea into a publishable-quality Sanity **draft** in the O3 voice.
This skill is a bootstrap: the knowledge lives in Sanity, not here. Fetch it
before writing.

This skill owns o3world.com site copy. If a plain-technical-English editing
skill is also installed, it is for engineering prose — READMEs, commits, docs —
and its register is not the brand's; the voice guide you fetch below wins on
anything that reaches the site.

The Sanity tools arrive via the Sanity MCP server (Claude Code, preconfigured
by this plugin) or the Sanity connector (Claude Desktop) — the workflow is
identical. If no Sanity tools are available, stop and say so: in Claude Code
run `/mcp` to authenticate the `sanity` server; in Desktop connect the
connector. Auth is always the human's own — never ask for tokens.

Every Sanity tool call needs `resource: {projectId: "naorcr6k", dataset: "development"}`.
`development` is a full, disposable copy of the content — draft there by
default, and say which dataset you are writing to in the handoff summary. Use
`production`, the dataset the site serves, only when the human names it in
this conversation.

## Before writing anything

1. **Fetch the live guidance.** Query `*[_type == "guidance"]{key, title, body}`
   with the query tool. `body` is raw markdown — read it as written.

   | `key`            | What it is                           | Reach for it                                          |
   | ---------------- | ------------------------------------ | ----------------------------------------------------- |
   | `o3-voice`       | the voice guide                      | always; it outranks your defaults, every time         |
   | `o3-brand`       | pillars, delivery principles, values | claims about O3 — source material, never paste        |
   | `o3-slop`        | the machine tells, and the checks    | before you revise, and first when the job is an audit |
   | `o3-composition` | which band follows which on a page   | composing or editing a page                           |
   | `o3-argument`    | how a long argument holds up         | the brief, and any insight or case-study narrative    |
   | `o3-visual`      | palette, gradients, geometry         | when you make a picture rather than write             |

   If no guidance documents exist, say so and stop — never improvise the voice.

2. **Fetch the schema per type.** Before authoring any document type or
   section block, call `get_schema` for that **specific type**. The no-type
   overview omits field descriptions, and the descriptions carry required
   authoring guidance. Never compose a section you haven't fetched.
3. **Fetch exemplars.** Query 1–2 recently published documents of the same
   type as reference for structure and register. Content migrated from
   WordPress predates the current voice — treat it as subject-matter
   reference, never as a voice model.

## Hard rules

- **Drafts only.** `create_documents` (drafts by default) and
  `patch_documents`. Never `publish_documents`, `unpublish_documents`,
  `discard_drafts`, or schema/project admin tools. A human publishes in
  Studio.
- **Never invent facts.** Real names, numbers, outcomes, and quotes come from
  the human. For case studies, interview until you have them; gaps stay gaps,
  and they go in the brief's `record` as well as the handoff summary — the
  summary scrolls away, the field is queryable.
- **Imagery:** reference an existing asset (query
  `*[_type == "sanity.imageAsset"]` with filters) when one genuinely fits.
  Otherwise `generate_image` is available, and `key == "o3-visual"` governs
  what comes out of it — the palette by hex, the gradients the red and the
  light bands arrive as, the square geometry, and the rule that a generated
  image carries no type. Read it before the first prompt, not after the first
  result. An empty field with a note in the handoff summary beats an image
  that is nearly right.
- **Portable text is raw JSON** — build block arrays by hand to match the
  schema; there are no markdown convenience tools. Three write mechanics,
  verified against this project rather than inherited:
  - **Author `_key` on every block and every span yourself.** The Content Lake
    mints none on create, then mints one on the _next_ write, derived from that
    revision's id. An item you left unkeyed is unaddressable by `_key` until
    something names it a value you could not have predicted, and the copy in
    your context is stale for exactly those items.
  - **Re-fetch before patching and pass `ifRevisionId`.** Keys you authored
    survive a patch unchanged — only the index moves. The reason to re-fetch is
    a concurrent edit, and the guard turns a silent clobber into a failed call.
  - `markDefs: []` and `marks: []` are a convention, not a requirement: stored
    when supplied, absent when not. Include them for the Studio editor and
    typegen.

## Workflow

Two branches. A document that does not exist yet starts at **the brief**; one
that already exists goes to **review mode**. Both run **the reader test** and
both end with a hand-off summary — the brief's branch tests last, review mode
tests first, and the reason is in each.

### 1. The brief

The interview comes before any Sanity write, and it ends in one: the brief
document below. Two rounds of questions, and **two is the whole
interview** — do not open a third. Every question carries your recommended
answer, so the human can nod rather than compose; a nod is an answer.

Read `o3-argument` first and hold it open while you ask. It defines the claim,
the warrant and the evidence bar, and it is what you judge the answers
against — apply it, do not restate it from memory.

**Round one** — askable cold:

1. Who is this for? Name the reader, not a segment.
2. What is the one claim?
3. Which content type — insight, case study, page?

**Round two** — none of it is askable before the claim exists:

4. What is the warrant?
5. What evidence is in hand?

Then two things, in the chat, before anything is written:

- **The agreed thesis.** State the claim as one sentence and get it confirmed.
  Confirmed means the human said yes to that sentence, not that they answered
  the questions.
- **The five reader-test questions.** Forecast them from the thesis and the
  audience — what a reader should be able to answer after one pass. Question
  one is fixed: _"In one sentence, what is this arguing?"_ You choose the other
  four. Write all five out and **lock them**.

**Then write the brief document.** The interview leaves a document behind, and
it is the first thing written to Sanity — before the piece, so the piece has
something to point at.

- **One `create_documents` call**, type `brief`, with `_id: "brief-<key>"`.
  The key is lowercase words joined by hyphens (`[a-z0-9]+(-[a-z0-9]+)*`) and
  names the subject rather than the piece, because a second piece on the same
  subject reuses it. Check for a collision first: an existing `brief-<key>` is
  either this subject — patch what the interview added rather than creating a
  second — or a different one that needs a different key. `title` says what the
  brief is about in a few words.
- **Never set `sourcePath`.** Its absence is what says this brief was written
  here rather than synced from a markdown file, and `brief:check` reads that
  absence to know it may not audit this document.
- **The editorial slots carry the human's material, not yours.** `background`
  is the raw material they supplied — notes, transcripts, pasted evidence, the
  evidence answer in their words. `instructions` is what they asked for: the
  reader, the content type, anything to avoid. `links` is the URLs they gave.
  Nothing you inferred goes in these three.
- **`record` is yours**, in the format below.

A brief holds what one piece is written from; the `guidance` documents hold how
to write for O3 anywhere. Per-piece material never goes into a `guidance`
document, whatever it teaches you mid-session.

#### The `record` format

Three sections, these headings, this order. Plain markdown in a text field,
read by the next session as much as by a human:

```markdown
## Thesis

<the sentence that was confirmed>

## Reader-test questions

1. In one sentence, what is this arguing?
2. <the four you chose>

## Gaps

- <what is missing, and who can supply it>
```

`## Gaps` says `- None` when there are none, so a later session can tell an
empty list from an unwritten one. Questions added after drafting are appended
to the list; none is ever removed or reworded. When `record` stops being true,
patch it — step 6 is the last chance.

**The brief is a gate, and it stands one step later than the interview.**
Nothing is written to Sanity without an agreed thesis, and with one the brief
document is what gets written first: no `create_documents` for the piece and no
`patch_documents` until the brief is in the dataset. The reads above are what
the brief runs on, so they come before all of it. The human may hand you a
thesis directly and skip the rounds, and that is the only override. Inventing
one and proceeding is not.

### 2. The outline

**Propose an arc by name** from `o3-argument`'s **How the argument moves**, and
say why this material takes that shape rather than the nearest alternative —
name the runner-up and why not. Naming it is the point: a second draft should
be a **different shape**, not the same paragraphs reordered.

**The three arcs are examples, not a taxonomy.** A shape none of them fits may
be proposed as a new arc, specified the way `o3-argument` specifies its
three — what it opens on, how it moves, how it ends, when to reach for
it — and with which of the three came closest and where it broke.

**The outline is the section list in the arc's order**, each section only
readable in its place. That is the commitment gate 1 runs the shuffle test
against, so write the list you are willing to be held to.

**Forecast the length here, as advice.** Check the section list against
`o3-argument`'s **Length and proportion** bars. An outline pointing past the
top of the band usually means the claim is two claims — say so while the
middle is still a list of headings, not at the hand-off.

**The outline is a gate.** Drafting starts once the human confirms the named
arc and the section list. The human may hand you an arc directly and skip the
proposal, and that is the only override. Inventing one and proceeding is not.

### 3. Draft

Create the document as a draft. Slugs are lowercase-hyphenated; check for
collisions first.

**Point it at the brief.** `briefs` is an array of weak references, so it
carries `{_type: "reference", _ref: "brief-<key>", _weak: true, _key: "<key>"}`
— your own `_key`, same as any other array item. Reference the published id
even though the brief you just wrote is a draft: that is how a reference
addresses a document, and weak is why it costs nothing while the human has yet
to publish either one.

### 4. Iterate

Share the draft's path (e.g. `/insights/{slug}`) for preview, and apply
reactions with `patch_documents`.

### 5. The gates

Four gates, run in this order before the hand-off summary, every time. Each
one's content lives in the document that owns it; what this list adds is the
order they run in, and one distinction. The shuffle test and the reader test
both test coherence and catch different failures — a piece can arrive at its
claim as a list, and an arc can hold around a claim nobody can restate — so
both run.

1. **The shuffle test** — `o3-argument`. Every section is only readable in its
   place, and the arc named in step 2 is what holds them there: the piece runs
   the shape you proposed, in that order. Structure goes first because a piece
   with the wrong shape is not fixed by editing sentences: `o3-argument`'s
   **Mush** section sends it back to the brief instead, and every sentence you
   polished before finding that out is wasted work.
2. **The revision pass** — `o3-voice`, ten numbered steps. Sentence level.
3. **The checks** — `o3-slop`, ten numbered items. The shapes the revision pass
   does not catch.
4. **The reader test** — below. Last, because it is the only one that blocks
   the hand-off. It runs on the settled text: every patch from gates 1 through
   3 is written to the draft before the reader sees a word, because a reader
   shown a stale revision tests a document that no longer exists — and the
   no-re-run rule means there is no second attempt.

#### The reader test

A **context-free reader** answers the five locked questions. It gets the title,
the excerpt, and the body **as rendered prose** — nothing else. Not the raw
portable text, which shows structure a reader cannot see and spends attention
on `_key`s. Not the thesis, which is the answer.

Two ways to run it, same test:

- **A subagent, where you have one.** Spawn it with no context but the prompt,
  and show its answers in full.
- **A prompt the human carries into a fresh chat**, everywhere else. Emit it as
  one self-contained block: the five questions, then the rendered title,
  excerpt and body. Say to paste it into a new conversation and paste the
  answers back. The isolation is the point; the automation is not.

Compare answer one against the agreed thesis:

- **Pass** — they say the same thing.
- **Fail** — they do not, or the reader could not answer. Report both sentences
  side by side, say it failed, and stop.

**A fail blocks the hand-off, not the draft.** The draft stays where it is and
the human decides what happens to it. Never re-draft to make your own test
pass, and never re-run the test hoping for a better reader.

You may **add up to two** questions after drafting. You may never remove or
reword one. The question you cannot answer is the one that otherwise gets
quietly dropped.

### 6. Hand off

**Patch the brief first**, wherever `record` has stopped being true: questions
added after drafting, gaps the drafting closed or opened. The gaps in the
document and the gaps in the summary are one list, and the document is the copy
that outlives the chat.

Then end with a summary: what was created (document ID and path), which
dataset, the brief it was written from and its id, the reader-test result,
imagery needed per empty slot, facts still unverified, and anything the human
must do before publishing.

## Review mode

The branch for a document that already exists — insights, case studies and
pages alike. It reports before it writes.

1. **Fetch the document** and read it against the guidance, same as any other
   job. **Fetch what its `briefs` point at in the same breath** — drafts
   included, because a brief the skill wrote and nobody published exists only
   as one:

   ```groq
   *[_type == "brief" && _id in $ids]{_id, title, background, instructions, links, record}
   ```

   `$ids` holds both `brief-<key>` and `drafts.brief-<key>` for every
   reference. Where both come back, read the draft.

2. **Interview only for what changed — where there is a brief.** The thesis and
   the five questions are in `record`, and they are settled: asking them again
   is asking the human to redo work the document already holds. Ask what the
   brief cannot answer — what has changed since it was written, what the piece
   now has to do that it did not, evidence that arrived after — and nothing
   whose answer is already in `record`. Patch `record` with whatever the
   answers moved (a revised thesis, a gap closed, a gap opened) before you
   propose a single write to the document itself.

   Where there is no brief, there is nothing to interview against and none is
   written here: review mode reports and patches, it does not brief.

3. **Run the reader test** (step 5 above), before the findings table rather
   than after it. Question one is fixed as always.
   - **With a brief**, the locked questions and the agreed thesis come out of
     `record`, and answer one is compared against that thesis exactly as in the
     drafting branch.
   - **With none**, there is no agreed thesis: the reader states what the
     document argues and **the human confirms whether that is the intended
     one**. A mismatch is a single `error`-tier finding with no proposed
     patch — "this does not argue what you think it argues" has no row-level
     fix — and it can only be a row of the table if the test has already run.
     Forecast the other four questions from the document in front of you.

4. **Report the findings as a table**, before proposing any write:

   | id  | tier | location | current | proposed | why |
   | --- | ---- | -------- | ------- | -------- | --- |

   Ids are `F1…Fn` and stay stable for the session, so approval is "apply F1,
   F3, F7". `location` names the field and the block key. Three tiers, named
   for what the human does with them:
   - **`error`** — wrong. A fact, a broken reference, or something the voice
     guide or slop patterns name outright.
   - **`craft`** — weaker than it should be.
   - **`advisory`** — structural. "This prose wants to be a `pullQuote`" is
     advice about the shape of the piece; cite the composition catalog rather
     than restating it. **An advisory never lands in a patch.**

5. **Take row-level approval**, then send **one** `patch_documents` call with
   `ifRevisionId` set to the revision you read. Rejected rows are dropped from
   the batch, not deferred to a second call.
6. **On an `ifRevisionId` rejection: abort, re-fetch, re-derive.** Never retry
   blind. The approvals were given against text that no longer exists, and
   reapplying them is the clobber the guard exists to prevent. Run the findings
   pass again and re-present, marking which approved rows still stand.
7. **Hand off** as above: which rows landed, which were dropped, the brief this
   ran against and what its `record` now says, the reader test's result, and
   what is left for the human.
