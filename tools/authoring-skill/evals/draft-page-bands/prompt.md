---
name: Draft page bands
tags: [draft]
plugins: ['../..']
runs: 1
max_turns: 50
timeout_seconds: 2400
# Server name is the plugin's `sanity`; grade.mjs matches this repo's `Sanity` case-insensitively.
allowed_tools:
  [
    Skill,
    Read,
    Glob,
    Grep,
    Write,
    mcp__sanity__get_document,
    mcp__sanity__query_documents,
    mcp__sanity__get_schema,
    mcp__sanity__create_documents,
    mcp__sanity__patch_documents,
  ]
model: sonnet
---

You are the agent in a Claude Code session at O3 World.

## Setup, before you begin the work

The brief this run continues already finished its interview in an earlier
session, but this eval starts from an empty slate, so create it first. One
`create_documents` call, exactly these fields and no others:

```json
{
  "_id": "brief-eval-draft-page-bands-design-systems-practice",
  "_type": "brief",
  "key": "eval-draft-page-bands-design-systems-practice",
  "title": "Design systems practice landing page",
  "stage": "brief",
  "nextStep": "Stage 3 proposes the page's band list and puts it to Nick as a gate.",
  "instructions": "A page — the landing page for O3's design-systems practice, at /solutions/design-systems. For a VP of Engineering or a Head of Design who already has a system and knows it is drifting. No Figma frame exists for this page yet.",
  "thesis": "A design system is a product with a second version, and O3 is hired for the second one: the practice sells the standing ownership that keeps a shipped system from rotting.",
  "readerQuestions": [
    "Q1 — What does O3 actually do on a design-systems engagement?",
    "Q2 — Is this for a system we already have, or only for a new one?",
    "Q3 — Who has O3 done this for?",
    "Q4 — What do I do next if I want to talk?"
  ],
  "background": "From Nick, in his own words: the practice has three shapes of engagement, and they are the ones to lay out. **Audit** — two days, we read the code and the design file and tell you where they have diverged. **Build** — the first version, scoped like a project, eleven weeks on the last one. **Steward** — a standing half-day a week, a public changelog, and forks filed as issues rather than merged.\n\nProof O3 can point at, all first-party: the health-tech system, 42 components in eleven weeks in 2024, audited in March 2026 at four forks of the button and one fork six months after stewarding began; O3's own component set, shipped 2023, unowned for a year, rebuilt.\n\nNick, this conversation: the page should end on the same ask every other solutions page ends on — start a conversation. There is no video and no product screenshot for this page.",
  "gaps": [
    "Named client logos for this page — legal has not cleared the health-tech client's name, so no logo wall and no client name in copy.",
    "A case-study document for the health-tech system — it does not exist in the dataset yet, so nothing can reference it."
  ],
  "decisions": [
    "The three engagement shapes are the page's spine — Nick named them as the thing to lay out."
  ]
}
```

The call makes a draft, so what comes back is
`drafts.brief-eval-draft-page-bands-design-systems-practice`. The published id
above is the one everything else addresses.

## The work

Nick, a principal at the agency, has just typed this to you:

> The brief for the design-systems practice page is done.
> `brief-eval-draft-page-bands-design-systems-practice`. Take it from there.

Work the request. Nick is in the chat, and his answers are scripted below. Stop
when the workflow you are running says to stop and wait for him.

## Nick, and what he says

Direct, allergic to hedging and to AI-sounding copy. Answers in one or two
sentences, and nods to a good recommendation rather than composing his own.
**Facts come from the brief above or from this section, or they do not exist.**

**At the outline gate** — "Good. As proposed."

**When you put candidate openings to him** — Nick takes the one you
recommended: "That one. The others sound like every agency page."

**If you ask about client logos or naming the health-tech client** — "Legal
hasn't cleared it. No logos, no name."

**If you ask for a case study to point the page at** — "Doesn't exist yet.
Put it on the list."

**If you ask for anything else quantitative not already in the brief** — "I
don't have that. Put it on the list."

**Anywhere else a nod is wanted** — Nick nods to the recommendation.

## What this run may touch

Sanity project `naorcr6k`, dataset `development`, drafts only. Never publish,
never unpublish, never discard, never address `production`.

Before you finish, read `brief-eval-draft-page-bands-design-systems-practice`
back out of the dataset and write it verbatim as JSON to
`dataset/brief-eval-draft-page-bands-design-systems-practice.json` in your
working directory. It is the run's evidence: a claim about the brief that the
dataset does not confirm is a claim about nothing.
