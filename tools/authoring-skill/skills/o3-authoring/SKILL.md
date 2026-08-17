---
name: o3-authoring
description: Draft, resume, or revise o3world.com content in Sanity — insights (blog posts), case studies, and pages. Use when asked to write, draft, edit, or continue O3 World site content from an idea or notes.
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

## The pipeline

Five stages — **gather → converge → outline → build → verify** — and the brief
document is their spine. Stage 1 runs before the brief exists and is what the
brief gets created from; from there each stage reads the brief, does its work,
and patches the brief before the next one starts. Where a piece stands is a
document in the dataset rather than a position in a conversation, which is what
lets a run stop here and continue in a different session, on either surface.

Two branches. A document that does not exist yet runs the pipeline. One that
already exists goes to **review mode**. Both run the reader test and both end
with a hand-off summary — the pipeline tests last, review mode tests first, and
the reason is in each.

**A run that is already underway resumes rather than restarts.** Stage 1 sweeps
the dataset, and a brief on this subject is the first thing it finds: its
`## Pipeline` section names the stage reached, the confirmations taken, and the
next step. Start at that stage. A confirmation in the record has been taken —
read it back for a nod if you like, but never re-run the interview that
produced it.

**A human asking for a fresh piece outranks the record.** Resuming is for a run
that stopped mid-flight. A new piece on a subject that already has a finished
brief reuses that brief and runs its own stages from the top.

## Before writing anything

1. **Fetch the live guidance.** Query `*[_type == "guidance"]{key, title, body}`
   with the query tool. `body` is raw markdown — read it as written.

   | `key`            | What it is                           | Reach for it                                          |
   | ---------------- | ------------------------------------ | ----------------------------------------------------- |
   | `o3-voice`       | the voice guide                      | always; it outranks your defaults, every time         |
   | `o3-brand`       | pillars, delivery principles, values | claims about O3 — source material, never paste        |
   | `o3-slop`        | the machine tells, and the checks    | before you revise, and first when the job is an audit |
   | `o3-composition` | which band follows which on a page   | any block-bearing field — see below                   |
   | `o3-argument`    | how a long argument holds up         | the brief, and any insight or case-study narrative    |
   | `o3-visual`      | palette, gradients, geometry         | when you make a picture rather than write             |

   One query returns all six; the last column says which you read closely for
   the job in front of you, and the rest you read far enough to know what is in
   them.

   `o3-composition` governs a page's `sections`, and it also governs an insight
   or case-study body, because `bodyText` admits `figure`, `embed` and
   `pullQuote` — choosing among those is composition, at a smaller scale. Read
   it whenever you compose a field that holds blocks.

   If no guidance documents exist, say so and stop — never improvise the voice.

2. **Fetch the schema per type.** Before authoring any document type or
   section block, call `get_schema` for that **specific type**. The no-type
   overview omits field descriptions, and the descriptions carry required
   authoring guidance. Never compose a section you haven't fetched.

   `brief` is a type you author, so it is on this rule with the rest: `key` and
   `record` are `readOnly` and `title` is required, and fetching it is how you
   find that out.

   Where the human's opening names the content type, fetch that type now — you
   need it at stage 2, where its required fields are what that stage asks
   about. Where the opening leaves it open, round one's third question settles
   it and the fetch follows the answer. Section blocks wait for stage 3: which
   blocks a piece needs is unknowable until its outline exists.

3. **Fetch exemplars.** Query 1–2 recently published documents of the same
   type as reference for structure and register. Content migrated from
   WordPress predates the current voice — treat it as subject-matter
   reference, never as a voice model. Its **shape** is a separate question:
   where `o3-argument` names a migrated piece as the canonical instance of an
   arc, that piece is a legitimate example of the shape, and its sentences are
   still not the model. What the corpus **says** is stage 1's business, not
   this step's.

## Hard rules

- **Drafts only.** `create_documents` (drafts by default) and
  `patch_documents`. Never `publish_documents`, `unpublish_documents`,
  `discard_drafts`, or schema/project admin tools. A human publishes in
  Studio.
- **Never invent facts.** Real names, numbers, outcomes, and quotes reach the
  piece one of two ways: the human supplied them, or you gathered them with a
  source. Everything else — what you inferred, reasoned to, or recall without
  a source — stays out of the piece and out of the brief's editorial slots,
  however confident you are. Attribute what you gathered where it lands: a URL
  for the web, a document id for the dataset. Gaps stay gaps, and they go in
  the brief's `record` as well as the handoff summary — the summary scrolls
  away, the field is queryable.

  **In the piece, the source is named in the sentence that carries the claim** —
  the outlet, the firm, the researchers who did the work. `links` is where a
  fact-checker looks; a reader sees only the prose, and `o3-slop`'s
  weasel-attribution check is run against the prose. "Reporting says" and
  "studies show" are claims with the source removed, and a claim you cannot
  attribute in its own sentence comes out of the piece.

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

## Stage 1 — Gather

Gathering runs by default, before the interview, and it ends at a human gate.
The human describes a subject; you arrive at the interview holding what is
already known about it, so the questions are the ones only they can answer.

**Internal — the corpus.** Query the dataset for what it holds on this
subject, and read those documents for what they **say**: the facts, numbers,
quotes and claims O3 has already put in public. The exemplar fetch above reads
a document for form; this one reads it for content, and they are different
reads of the same corpus.

Resolve every pointer the human gives. "Pull from our case studies" names a
search you run, not a gap you log — a pointer resolved to document ids is
retrieval, and retrieval is sourced material.

Four things to come back with, past the material itself:

- **Documents already on this subject.** A slug collision is a naming problem;
  a subject collision is an editorial one, and the dataset will not flag it.
  Query broadly — by title, by slug segment, by the subject's own words — and
  carry every hit to the gate.
- **Briefs.** A brief on this subject is either the run you are resuming or the
  one this piece reuses; read its `record` before you plan a thing.
- **Provisional notes.** `migration.provisionalNote` marks a claim nobody has
  verified. A number found under one is not evidence — it is a gap wearing a
  number's clothes.
- **Attributable quotes.** Who said it and where it was published, or it is not
  a quote you can use.

**External — the web.** Where the piece's claims are publicly checkable, check
them: one source per claim, and the source is a URL you actually opened.
Regulations, product announcements, dated events and third-party figures all
belong here — a piece that cites an article number, a penalty or a deadline
needs a source for each, and gathering them is this stage's job rather than the
human's. Where the surface running you has no web access, say so plainly at the
gate; each unchecked claim goes on the gap list as unverifiable here, not as a
fact.

**Raw material handed over from outside the dataset** — a prior draft, a
transcript, a deck, given as material for a fresh piece rather than as a
document to revise — is supplied material. It goes into `background` as it
stands. Two things it is not: it is not review mode, which is keyed on a
_Sanity_ document existing; and its claims are not sourced by having been
written down once. Treat a fact from a prior draft the way you treat a fact
from the human, and gather a source for it like any other.

Where that prior draft **is** a Sanity document, the human's instruction decides
which it is. Asked to revise it, you are in review mode. Asked for a fresh piece
that mines it, it is material — and it is also a document on this subject, so it
comes to the gate below with the rest.

**Then the gate.** Present three lists and stop:

- **Found** — each item with its source, a URL or a document id.
- **Missing** — what the piece needs that nobody has, and who could supply it.
- **Unverifiable** — claims you could not source, and what would settle each.

Say what a subject collision leaves open, in the three real options: **extend**
the existing document, **supersede** it, or **differentiate** deliberately with
a stated difference. The human answers before you converge.

**Supersede has a mechanic worth stating**, because you may not retire anything
yourself — `discard_drafts` and `unpublish_documents` are off-limits. It means:
write the new piece, and put retiring the old one on the gap list as a human
step, naming the document. Until they do it the superseded document still holds
its slug, so the new piece takes one of its own.

This is a gate: the interview does not start until the human has responded to
these lists. Their corrections and additions are material — carry them into the
brief with the rest.

## Stage 2 — Converge, the interview

It ends in the first Sanity write of the run: the brief
document. Two rounds of questions, and **two is the whole interview** — do not
open a third. Every question carries your recommended answer, so the human can
nod rather than compose; a nod is an answer. What you gathered is what makes
the recommendations worth nodding at, so bring it into the questions.

Read `o3-argument` first and hold it open while you ask. It defines the claim,
the warrant and the evidence bar, and it is what you judge the answers
against — apply it, do not restate it from memory.

**Round one** — askable cold:

1. Who is this for? Name the reader, not a segment.
2. What is the one claim?
3. Which content type — insight, case study, page?

**The required fields**, once the type is known. Read them off the schema you
fetched: every field the type marks required, plus its taxonomy references —
on an insight that is `publishedAt`, `author` and `categories`; on a case study
the client and the industries; on a page the `pageType`. Put them in one
message as a list with a recommended answer each, drawn from the corpus you
swept. This is a list to nod at, not a third round of the interview.

Add any field the reader test will need, required or not. On a page that is
`card.excerpt`: the test hands the reader an excerpt, that field is where a
page's comes from, and the schema does not require it. A reader given an empty
one tests two-thirds of the piece, and the test does not re-run.

Where the human has no answer, the default depends on what the slot holds:

- **A required slot the piece itself decides** — a date, a page type — takes
  your recommendation, and the recommendation is recorded as a decision. An
  unset required field is a draft the human cannot publish without coming back
  to you, and a publication date is a publishing slot rather than a claim about
  the world: stamp the day you drafted and say you stamped it.
- **A reference slot** — a byline, a category, a client — stays empty and
  becomes a gap. Recommend the closest existing document by name; never mint a
  new one. A byline is a person's name and a missing category is a taxonomy
  change, and neither is yours to invent.

**Round two** — none of it is askable before the claim exists:

4. What is the warrant?
5. What evidence is in hand? They read the found list at the gate, so do not
   put it in front of them twice — ask what it missed, which is what they hold
   that the sweep could not reach.

Then two things, in the chat, before anything is written:

- **The agreed thesis.** State the claim as one sentence and get it confirmed.
  Confirmed means the human said yes to that sentence, not that they answered
  the questions.
- **The five reader-test questions.** Forecast them from the thesis and the
  audience — what a reader should be able to answer after one pass. Question
  one is fixed: _"In one sentence, what is this arguing?"_ On a page, question
  two is fixed as well: _"What does this page recommend, and why?"_ — a page
  can carry its argument past a reader who never retains the name of the thing
  it is selling. You choose the rest.

  **Every question past the first tests a part of the thesis, and one of them
  is the question the named reader arrives with.** A question about the
  background a reader needs in order to follow the claim is a note that you
  found the context interesting, and at stage 3 a section gets built to answer
  it — which is how a third of a piece ends up on the thing that led to the
  subject rather than on the subject. Check each question against the thesis
  sentence before you commit to it, then write all five out and **lock them**.

**Then write the brief document.** The interview leaves a document behind, and
it is the first thing written to Sanity — before the piece, so the piece has
something to point at.

- **One `create_documents` call**, type `brief`, with `_id: "brief-<key>"`. The
  call makes a draft, so the document you get back is `drafts.brief-<key>`; the
  id you write is the published one, and that is the id everything else
  addresses. The key is lowercase words joined by hyphens
  (`[a-z0-9]+(-[a-z0-9]+)*`) and names the subject rather than the piece,
  because a second piece on the same subject reuses it. Stage 1 already listed
  the briefs: an existing `brief-<key>` is either this subject — patch what the
  interview added rather than creating a second — or a different one that needs
  a different key. `title` says what the brief is about in a few words.
- **Never set `sourcePath`.** Its absence is what says this brief was written
  here rather than synced from a markdown file, and `brief:check` reads that
  absence to know it may not audit this document.
- **The editorial slots carry supplied and gathered material, nothing you
  inferred.** `background` is the raw material: the human's notes, transcripts
  and pasted evidence in their words, and beside them what stage 1 found, each
  item carrying its source. `instructions` is what they asked for — the reader,
  the content type, what to argue, what to avoid. `links` is every URL, theirs
  and the ones you gathered.
- **`record` is yours**, in the format below. `record` and `key` are both
  `readOnly` in Studio, which keeps a human out of fields the skill maintains;
  the API takes your write to either.

A brief holds what one piece is written from; the `guidance` documents hold how
to write for O3 anywhere. Per-piece material never goes into a `guidance`
document, whatever it teaches you mid-session.

### The `record` format

Five sections, these headings, this order, and no sixth. Plain markdown in a
text field, read by the next session as much as by a human. Everything a later
stage adds lands under one of the five — the outline as confirmed, the question
map, the arc and its runner-up all go in `## Decisions`, which is where a
resuming session looks for what was settled. A run that invents a heading for
them writes a record shaped unlike every other one, and the next session is
reading for structure as much as for content:

```markdown
## Pipeline

- Stage: <gather | converge | outline | build | verify | handed off>
- Confirmations: <each one taken, and what it settled>
- Next: <the one thing a session picking this up does first>

## Thesis

<the sentence that was confirmed>

## Reader-test questions

1. In one sentence, what is this arguing?
2. <the rest, in the order you locked them>

## Decisions

- <what was chosen, and what it ruled out>

## Gaps

- <what is missing, and who can supply it>
```

`## Pipeline` is what makes a run resumable, so **it is written four times, not
once at the end**: it arrives with the brief carrying stage 1's result and the
thesis; stage 3 adds the outline as confirmed and what was ruled out reaching
it; stage 4 adds what the drafting decided and any gap it opened or closed; the
hand-off writes the last stage and what the human does next. Stage 5 patches
nothing of its own — the gates run against a settled draft, and their results
land in the hand-off's write. Three confirmations exist to record: the gather
gate, the agreed thesis, and the outline gate.

**Write `record` with `set`, and read it back.** Set the whole field every time,
then query it and check the line you meant to move actually moved. Read it back
by splitting the string on a heading and reading the chunk, or by checking
`length()` against what you sent. A `match` probe answers a different question —
GROQ tokenizes the pattern, so a trailing period or a hyphen returns `false`
against a field that is perfectly intact, and you will go looking for a
truncation that never happened. It is one
long text field rewritten wholesale at four points in a run, and its failures
are silent — the call reports success and the field is stale or truncated. A
`diffMatchPatch` against offsets you wrote by hand fails that way every time. A
stale `## Pipeline` is worse than an absent one, because it is what the next
session trusts most.

**A brief outlives one piece.** The key names the subject, so a second piece
reuses the brief — and `record` holds one `## Thesis` and one question list. The
new piece's thesis and questions go under those headings, and the set they
replace moves to `## Decisions` verbatim, named with the piece it was locked
against. Nothing is reworded and nothing is dropped: the retired set is what
tells a later session the earlier piece was briefed too.

`## Decisions` holds the scoping calls — material you deliberately cut, an
angle deferred to another piece, a required field you filled from a
recommendation, a subject collision resolved. A decision is not a gap: nobody
is waiting on it, and the reason it is written down is that a later session
would otherwise read the absence as an oversight and put the material back.

A gap is what a human still has to supply or decide before this can publish — a
fact nobody has, a slot nobody filled, a claim nobody could source. `## Gaps`
says `- None` when there are none, so a later session can tell an empty list
from an unwritten one, and a gap that closes says so where it stands rather
than disappearing: that it was once open is part of what the next session
needs. Questions added after drafting are appended to the list; none is ever
removed or reworded.

**The brief is a gate, and it stands one step later than the interview.**
Nothing is written to Sanity without an agreed thesis, and with one the brief
document is what gets written first: no `create_documents` for the piece and no
`patch_documents` until the brief is in the dataset. The reads above are what
the brief runs on, so they come before all of it. The human may hand you a
thesis directly and skip the rounds, and that is the only override. Inventing
one and proceeding is not.

## Stage 3 — Outline

The outline forks on the content type, because a page is composed and an
argument is arranged, and the two guidance documents split on exactly that
line.

### An insight or a case study — propose an arc

**Propose an arc by name** from `o3-argument`'s **How the argument moves**, and
say why this material takes that shape rather than the nearest alternative —
name the runner-up and why not. Naming it is the point: a second draft should
be a **different shape**, not the same paragraphs reordered.

**The three arcs are examples, not a taxonomy.** A shape none of them fits may
be proposed as a new arc, specified the way `o3-argument` specifies its
three — what it opens on, how it moves, how it ends, when to reach for
it — and with which of the three came closest and where it broke.

**The outline is the section list in the arc's order**, each section only
readable in its place. That is the commitment the shuffle test runs against, so
write the list you are willing to be held to.

**Forecast the length here, as advice.** Check the section list against
`o3-argument`'s **Length and proportion** bars. An outline pointing past the
top of the band usually means the claim is two claims — say so while the
middle is still a list of headings, not at the hand-off.

### A page — propose a band list

Propose the page from `o3-composition`'s catalog. **The band list is the
section list**: each band named by block type, in order, with its job on the
page and the surface it lands on. Surface rhythm is part of the proposal, not
a styling detail applied afterwards — the ink bookends and the single mid-page
ink moment decide which band can carry the turn, so they are decided here.

**The length bar is the band count**, `o3-composition`'s own. `o3-argument`'s
word-count bands are measured across insights and mean nothing on a landing
page; a page inside the band count is the right length whatever it weighs.
`o3-argument`'s proportion split is still worth a glance — a page whose middle
has vanished has no mechanism — but the count is the bar.

**On a page, `o3-composition` outranks `o3-argument` wherever they disagree.**
The argument guide opens by saying a page is not made of bands and hands page
arrangement to the catalog; take it at its word. Two disagreements are known:
the argument guide's warning against a closing sales line, against the
catalog's rule that a page ends on a `ctaSection` — the catalog wins; and the
argument guide's "a section that could be cut without breaking the next one
should be cut", against a band the catalog places for rhythm — the catalog
wins. `o3-argument` still governs the page's claim, its warrant and its
evidence bar. It does not govern the arrangement.

### Both types

**Answer the locked questions with the section list.** Name, for each of the
five, the section that answers it. This is the only point where the questions
and the shape are both in front of you, and it is cheap here and expensive
later: a question no section answers is a hole a reader will fall into, and a
section answering no question is context — it can stay, but say what it is for,
because context is where a piece's proportions go wrong. Carry the map to the
gate. It is as much of what the human is confirming as the order is.

**The outline is a gate.** Drafting starts once the human confirms the outline
as proposed — the named arc and its section list, or the band list and its
surfaces, and the question map either way. The human may hand you one directly
and skip the proposal, and that is the only override. Inventing one and
proceeding is not.

**Fetch the block schemas once the gate is taken**, per the per-type rule
above: every section block the outline names, and the object types inside them.
This is the first moment the list exists.

Then patch `record`, per the format above.

## Stage 4 — Build

Create the document as a draft.

**The front door — the title, the excerpt and the first paragraph.** One
decision rather than three fields: a reader meets them in that order, inside
fifteen seconds, and between them they make one promise. Read `o3-argument`'s
**front door** section before you write any of the three, because it is the one
that tests them against each other, and `o3-voice` for what a title carries.
Propose all three together with your recommendation, the way you proposed the
outline — they are the only strings in the piece a human sees before the body
exists, and the ones a run otherwise fills in silently between the slug and the
blocks.

**Fill the fields the piece decided, and leave the rest for the human.** The
required-fields round at stage 2 settled which are which. A field nobody asked
about and no gate reads — `seo` is the one that keeps coming up — is a gap in
the hand-off rather than a slot to fill from inference.

**The slug.** Lowercase-hyphenated, checked for collisions first. A free slug
is not a free subject — the subject check belongs to stage 1 and its answer was
taken at the gather gate. Where you arrived here without one, because the human
handed over a thesis and skipped ahead, run it now: `create_documents` is the
point of no return for a second document on a subject that already has one.

**Point it at the brief.** `briefs` is an array of weak references, so it
carries `{_type: "reference", _ref: "brief-<key>", _weak: true, _key: "<key>"}`
— your own `_key`, same as any other array item. Reference the published id
even though the brief you just wrote is a draft: that is how a reference
addresses a document, and weak is why it costs nothing while the human has yet
to publish either one.

**Iterate.** Share the draft's path (e.g. `/insights/{slug}`) for preview, ask
for reactions once, and apply what comes back with `patch_documents`. Then say
you are moving to the gates, and move — the exit is one round, and a round with
no reactions in it is still a round.

A reaction arriving later is welcome, and where it lands decides what it costs.
Before the reader test, apply it and run gates 1 through 4 again on the changed
sections. After the reader test, the piece is settled: the reader test never
re-runs, so the reaction goes to `## Gaps` for the human rather than into the
body. The same holds for a defect you find yourself once the reader has read —
record it, do not quietly patch the text the test was run against.

Then patch `record`, per the format above.

## Stage 5 — Verify

Five gates, run in this order before the hand-off summary, every time. Each
one's content lives in the document that owns it; what this list adds is the
order they run in, and one distinction. The shuffle test and the reader test
both test coherence and catch different failures — a piece can arrive at its
claim as a list, and an arc can hold around a claim nobody can restate — so
both run.

1. **The shuffle test** — `o3-argument`. Every section is only readable in its
   place, and the outline confirmed at stage 3 is what holds them there: the
   piece runs the shape you proposed, in that order. Structure goes first
   because a piece with the wrong shape is not fixed by editing sentences:
   `o3-argument`'s **Mush** section sends it back to the brief instead, and
   every sentence you polished before finding that out is wasted work. On a
   page, a band the catalog places survives this test even where the argument
   guide would cut it — that is the precedence rule at stage 3, applied.

   **Run it at both levels.** `o3-argument` shuffles sections and then
   paragraphs, and the second pass is the one that catches a piece whose
   sections are in the right order and whose paragraphs read as a stack of true
   observations. A reader who says the piece does not flow has almost always hit
   the paragraph level, where there is nothing to point at.

2. **The front door** — `o3-argument`'s **front door** section, and `o3-voice`
   on what a title carries. Read the title, the excerpt and the opening
   paragraph in a row, as a reader meets them, and check each stands on ground
   the other two do not. It is its own gate because it is the part of the piece
   every other gate looks past: the sentence passes below judge one sentence at
   a time and have no reason to read three of them across two fields against
   each other, and the reader test hands a reader the title and the excerpt and
   then asks what the body argues.
3. **The revision pass** — `o3-voice`, ten numbered steps. Sentence level, and
   its first step is a sentence-level instruction rather than a word target:
   tighten every sentence that can be tightened. `o3-argument` sets the total
   and `o3-voice` sets the sentence, so the band the outline forecast is what
   the piece lands in — a piece already inside it does not cut its way out, and
   a piece that drafted above it cuts until it is in. **Count body prose, not
   headings or pull-quote text**, so two runs cannot pass and fail the same gate
   on what they counted. Where the cut needed to reach the band would take out
   something the argument needs, the forecast was wrong rather than the draft:
   say so, name what would have to go, and let the human decide between the band
   and the material.
4. **The checks** — `o3-slop`, ten numbered items. The shapes the revision pass
   does not catch.
5. **The reader test** — below. Last, because it is the only one that blocks
   the hand-off. It runs on the settled text: every patch from gates 1 through
   4 is written to the draft before the reader sees a word, because a reader
   shown a stale revision tests a document that no longer exists — and the
   no-re-run rule means there is no second attempt.

### The reader test

A **context-free reader** answers the five locked questions. It gets the title,
the excerpt, and the body **as rendered prose** — nothing else. Not the raw
portable text, which shows structure a reader cannot see and spends attention
on `_key`s. Not the thesis, which is the answer.

**On a page, those three fields need translating**, and this is the
translation: the title is the page's, the excerpt is `card.excerpt`, and the
body is the bands flattened into what a visitor meets from the top — eyebrows,
headings and subheadings in order, each feature or panel heading with its body,
labelled detail lists, button labels in square brackets. Keep the cues a visitor
genuinely sees; drop `_key`, `_type`, block names and surfaces.

Two ways to run it, same test:

- **A subagent, where you have one.** Spawn it with no context but the prompt,
  and show its answers in full.
- **A prompt the human carries into a fresh chat**, everywhere else. Emit it as
  one self-contained block: the five questions, then the rendered title,
  excerpt and body. Say to paste it into a new conversation and paste the
  answers back. The isolation is the point; the automation is not.

Compare answer one against the agreed thesis:

- **Pass** — they say the same thing. An answer that carries the claim but
  re-weights it is a pass: a reader who leads on the half you put second, or
  drops an emphasis into a later answer, has read the piece. Say which weight
  moved and record it in `## Decisions`.
- **Fail** — a different claim, or the reader could not answer. Report both
  sentences side by side, say it failed, and stop.

**A fail blocks the hand-off, not the draft.** The draft stays where it is and
the human decides what happens to it. Never re-draft to make your own test
pass, and never re-run the test hoping for a better reader.

You may **add up to two** questions after drafting. You may never remove or
reword one. The question you cannot answer is the one that otherwise gets
quietly dropped.

Here the test has already run when you add one, and it may not be re-run — so an
added question is a note to whoever picks the piece up next, not something this
run answers. Record it in `record` as unanswered, and say why it was worth
adding.

**Two kinds arrive, and they are filed differently.** A question the draft
suggested is that note. A question the piece declines to answer is a defect in
its scope: a reader arrives with it, the piece sends them elsewhere, and it goes
to `## Gaps` to be settled before publish and into the hand-off as something the
piece does not do. That one should be rare, and it is rare when stage 2 put the
reader's own question on the list and stage 3 named the section that answers it.
Where it happens anyway, say so plainly — a scope defect reported as
housekeeping is how a piece ships without the answer it was written for.

## Hand off

**Patch the brief first**, wherever `record` has stopped being true: the stage
is now `handed off`, `Next:` says what the human does, questions added after
drafting are appended, and gaps the drafting closed or opened are recorded. The
gaps in the document and the gaps in the summary are one list, and the document
is the copy that outlives the chat.

Then end with a summary: what was created (document ID and path), which
dataset, the brief it was written from and its id, what gathering found and
what it could not source, the reader-test result, imagery needed per empty
slot, facts still unverified, and anything the human must do before publishing.

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
   reference, and the perspective is `raw` — any other one collapses the two
   ids into one before the filter sees them, which is the whole reason for
   naming both. Where both come back, read the draft.

2. **Interview only for what changed — where there is a brief.** The thesis and
   the five questions are in `record`, and they are settled: asking them again
   is asking the human to redo work the document already holds. Ask what the
   brief cannot answer — what has changed since it was written, what the piece
   now has to do that it did not, evidence that arrived after — and nothing
   whose answer is already in `record`. Read the recorded thesis and reader
   back and ask whether they still hold; never ask the human to state them
   again. Patch `record` with whatever the answers moved (a revised thesis, a
   gap closed, a gap opened) before you propose a single write to the document
   itself.

   Where there is no brief, there is nothing to interview against and none is
   written here: review mode reports and patches, it does not brief.

3. **Run the reader test** (stage 5 above), before the findings table rather
   than after it. Question one is fixed as always, and on a page so is question
   two.
   - **With a brief**, the locked questions and the agreed thesis come out of
     `record`, and answer one is compared against that thesis exactly as in the
     pipeline branch.
   - **With none**, there is no agreed thesis: the reader states what the
     document argues and **the human confirms whether that is the intended
     one**. A mismatch is a single `error`-tier finding with no proposed
     patch — "this does not argue what you think it argues" has no row-level
     fix — and it can only be a row of the table if the test has already run.
     Forecast the other questions from the document in front of you.

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
   ran against and what its `record` now says — or that there was none — the
   reader test's result, and what is left for the human.
