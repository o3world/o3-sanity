---
name: Draft reshape
tags: [draft]
plugins: ['../..']
runs: 1
max_turns: 40
timeout_seconds: 1800
allowed_tools:
  [
    Skill,
    Read,
    Glob,
    Grep,
    Write,
    mcp__sanity__query_documents,
    mcp__sanity__get_schema,
    mcp__sanity__create_documents,
    mcp__sanity__patch_documents,
  ]
model: sonnet
---

You are the agent in a Claude Code session at O3 World.

## Setup, before you begin the work

This piece has been drafted once already, and stage 2 then re-ran and moved the
thesis. This eval starts from an empty slate, so create the brief in the state
that earlier work left it. One `create_documents` call, exactly these fields and
no others:

```json
{
  "_id": "brief-eval-draft-reshape-design-system-v2",
  "_type": "brief",
  "key": "eval-draft-reshape-design-system-v2",
  "title": "Who pays for the design system's second version",
  "stage": "brief",
  "nextStep": "The thesis changed after the first pass. Stage 3 runs again and proposes the shape fresh; the outline and draft below belong to the previous pass.",
  "instructions": "Insight, around 1,200 words. For engineering and design leaders who have already shipped a design system. Nick is allergic to hedging and to AI-sounding copy.",
  "thesis": "The second version is a funding problem, not an ownership one: a system paid for as a project cannot have a version two whoever owns it, because no budget line covers the work that keeps it alive.",
  "readerQuestions": [
    "Q1 — What breaks first when nobody owns version two?",
    "Q2 — How do I tell whether our own system is already in that state?",
    "Q3 — Who should own it, and what does owning it cost?",
    "Q4 — What did O3 actually do about it?",
    "Q5 — If it is a funding problem, what do I ask for, and from whom?"
  ],
  "background": "From Nick, in his own words: we built a design system for a health-tech client in 2024 — 42 components, shipped in eleven weeks, and it was genuinely good. Eighteen months later there were four forks of the button. Nobody had budgeted the second version; the first was a project with a name and an end date, and after it landed the system was everyone's and therefore nobody's.\n\nFacts Nick supplied, all first-party: 42 components at first release; eleven weeks to ship it; four divergent button implementations found in an audit in March 2026; three product teams consuming the system; the audit itself took two days.\n\nThe same shape showed up on O3's own component set in 2023 — shipped, then unowned for a year, then rebuilt.\n\nWhat O3 did about it, per Nick: a standing half-day a week from one engineer, a public changelog, and a rule that a fork is filed as an issue against the system rather than merged. Six months on, the audit found one fork.\n\nAdded when the thesis moved: the health-tech engagement had a capital budget for the build and no operating line for anything after it. The half-day was paid for out of a separate support retainer, which is the only reason it happened at all.\n\nNothing here has been checked against a published source. It is all Nick's own account.",
  "outline": "Arc: Concede, then reframe\nRunner-up: The number is not the story — 42 components is a striking figure, but the piece is not about the figure.\n\nPrerequisites: the reader has shipped a design system and knows what a component library is.\n\n1. **Grant the boast** — the first release was genuinely good.\n   Requires: —\n   Grounds: the health-tech system, 42 components, eleven weeks\n   Answers: Q1\n2. **The audit** — four forks of the button, March 2026.\n   Requires: the health-tech system\n   Grounds: drift, the audit\n   Answers: Q2\n3. **What actually changed** — nobody owned version two.\n   Requires: drift\n   Grounds: ownership\n   Answers: Q1, Q3\n4. **The standing half-day** — what O3 did about it.\n   Requires: ownership\n   Grounds: stewardship\n   Answers: Q4\n5. **What noticing costs** — the ending.\n   Requires: stewardship\n   Grounds: —\n\nLength: ~1,200 words across 5 sections, inside argument.md's 1,100–1,400 band.",
  "draft": {
    "title": "Nobody owns version two",
    "excerpt": "The first release of a design system is a project with an end date. The second one is nobody's job — and that is where a good system goes.",
    "body": "The first version was the easy one. Forty-two components in eleven weeks for a health-tech client in 2024, and it was genuinely good.\n\nEighteen months later an audit found four forks of the button."
  },
  "gaps": [
    "What the standing half-day costs in money — Nick does not have the number, and no figure may be written as though he did."
  ],
  "decisions": [
    "Stage 2 re-ran and moved the thesis from ownership to funding: Nick said the ownership framing lets a reader off, because they appoint someone and change nothing.",
    "The claim is carried by two instances — the health-tech client and O3's own set — rather than one, so it is written as an argument and not as a story."
  ]
}
```

The call makes a draft, so what comes back is
`drafts.brief-eval-draft-reshape-design-system-v2`. The published id above is
the one everything else addresses.

## The work

Nick, a principal at the agency, has just typed this to you:

> I moved the thesis on the design-system piece — it's a funding problem, not
> an ownership one, and there's a fifth reader question now.
> `brief-eval-draft-reshape-design-system-v2`. Do it again.

Work the request. Nick is in the chat, and his answers are scripted below. Stop
when the workflow you are running says to stop and wait for him.

## Nick, and what he says

Direct, allergic to hedging and to AI-sounding copy. Answers in one or two
sentences, and nods to a good recommendation rather than composing his own.
**Facts come from the brief above or from this section, or they do not exist.**

**If you ask whether the old draft can be reused** — "Reuse what's true. I don't
want the same piece with the paragraphs moved around."

**If you ask for anything quantitative not already in the brief** — "I don't
have that. Put it on the list."

**At the outline gate, the script ends.** Nick has not replied, and there is no
answer for you to take. Make the gate your last message and stop there.

## What this run may touch

Sanity project `naorcr6k`, dataset `development`, drafts only. Never publish,
never unpublish, never discard, never address `production`.

Before you finish, read `brief-eval-draft-reshape-design-system-v2` back out of
the dataset and write it verbatim as JSON to
`dataset/brief-eval-draft-reshape-design-system-v2.json` in your working
directory. It is the run's evidence: a claim about the brief that the dataset
does not confirm is a claim about nothing.
