---
name: o3world-copy
description: Write, rewrite, or review copy in the O3 World voice — headlines, subheads, CTAs, section text, case-study narratives, stats, bios, proposals, or any user-facing words for o3world.com. Use whenever generating or editing copy in seed JSON (tools/migration/data/seed/), Sanity documents, or drafts, and when asked to "write copy", "punch up", "make this sound like us", or review tone.
---

# O3 World copy

O3's voice sits between Hemingway and Orwell: short sentences, plain words,
concrete claims. We are the client's partner in all things experiences, and the
copy's job is to help them see a clear path forward — not to impress them with
vocabulary.

The brand foundation (pillars, delivery principles, values) lives in
[brand.md](brand.md). It is **source material, not copy**. Never paste a pillar
into a headline. Write what the belief looks like as a specific claim.

## Voice rules

1. **Short declarative sentences.** One idea per sentence. If a sentence has a
   comma splice or three clauses, break it.
2. **Plain words.** Never a long word where a short one works. Technical jargon
   only when there is no other way to say it — "GROQ" is fine when you mean
   GROQ; "leverage synergies" is never fine.
3. **Active voice, real subjects.** Someone does something. "We built the front
   door," not "a unified experience was delivered."
4. **Specific beats superlative.** A number, a named obstacle, a real
   consequence. "41% fewer missed appointments," not "dramatic results."
5. **Name the reader's reality, then our move.** The strongest O3 structure is
   tension → turn: their problem in their terms, then what we do about it.
6. **Show the belief, don't label it.** We never settle for the status quo —
   so the copy makes an unsettling claim; it doesn't say "we're innovative."
7. **No agency clichés.** Banned unless quoting someone: seamless, world-class,
   cutting-edge, leverage, empower, delight, transform(ational), elevate,
   best-in-class, holistic, robust, solutions (as a noun for "work"),
   passionate. No exclamation marks.
8. **Person:** "you/your" for the client's world, "we" for O3. Never "users
   will be able to" — say what people can do.

## Structures by surface

These match the section blocks in the Sanity schema; live examples are in
`tools/migration/data/seed/page/` and `.../caseStudy/`.

- **Hero headline** (`headlineLines`, 1–2 lines): tension → turn. Real example
  (home): "You see the problem in front of you." / "We're working on the one
  behind it." Sentence case, full stops.
- **Subheading**: pays off the headline with the concrete offer, 1–2 sentences.
  "Strategy, design, engineering and AI under one roof. The same senior team
  that finds the move is the team that builds it."
- **Section heading**: a claim, not a category label. "Most firms ship what
  you asked for. We solve what was actually in the way." — not "Our Work."
  (Eyebrows carry the category label: "Our Partners", "Why O3".)
- **CTA labels**: 2–4 words, a verb and an object. "View our work", "See all
  partners". Never "Learn more", "Get started", "Click here".
- **Case-study `narrativeHeadline`**: two sentences — a human subject living
  the problem, then our move. "Families were navigating twelve portals to
  manage one child's care. We built the front door that made it feel like one."
- **Stats**: `value` is the number, `label` is a plain consequence. "41% /
  fewer missed appointments." No "increase in engagement metrics."
- **Body prose** (about-page register): admits cost and tradeoffs plainly —
  that's what grounded sounds like. "It's a slower way to grow. It's the only
  way to do work this deep."

## Revision pass (run every time)

Draft, then:

1. Cut 20% of the words. There is always 20%.
2. Read each sentence for a doer and a deed. Passive → active.
3. Swap every latinate word with a plain one unless precision dies ("utilize"
   → "use", "facilitate" → "help", "methodology" → "how we work").
4. Check every claim for a specific: could a competitor paste this sentence
   into their site? If yes, it isn't done.
5. Check the banned list (rule 7).
6. Read it aloud. Anywhere you'd breathe wrong, break or cut.

## Worked example

Off-brand input:

> We leverage cutting-edge technologies and a holistic, user-centric
> methodology to deliver seamless digital experiences that empower our
> clients to transform their business and delight their customers.

On-brand rewrite:

> Your customers don't care what we built with. They care that it works.
> We design and build products around that fact — and around the business
> they're supposed to move.

## Where the copy lives

- Seed pages and case studies: `tools/migration/data/seed/{page,caseStudy}/*.json`
  — edits reach the dataset via `pnpm --filter @o3/migration load` (the
  "production" dataset is disposable early-alpha; just run it).
- Live content: Sanity project `naorcr6k`, editable in the embedded studio at
  `/studio` or via MCP `patch_documents`.
- Schema/field naming is governed by the `content-naming` skill — this skill
  governs only the words inside the fields.
