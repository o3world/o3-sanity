---
name: Draft outline gate
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

The brief this run continues already finished its interview in an earlier
session, but this eval starts from an empty slate, so create it first. One
`create_documents` call, exactly these fields and no others:

```json
{
  "_id": "brief-eval-draft-outline-gate-design-system-v2",
  "_type": "brief",
  "key": "eval-draft-outline-gate-design-system-v2",
  "title": "Who owns the design system's second version",
  "stage": "brief",
  "nextStep": "Stage 3 proposes the outline and puts it to Nick as a gate.",
  "instructions": "Insight, around 1,200 words. For engineering and design leaders who have already shipped a design system. Nick is allergic to hedging and to AI-sounding copy.",
  "thesis": "A design system fails when nobody owns its second version: the first release is funded as a project with an end date, and the second is nobody's job, so the system rots while every team still points at it.",
  "readerQuestions": [
    "Q1 — What breaks first when nobody owns version two?",
    "Q2 — How do I tell whether our own system is already in that state?",
    "Q3 — Who should own it, and what does owning it cost?",
    "Q4 — How is this different from the token-governance advice already published everywhere?",
    "Q5 — What did O3 actually do about it?"
  ],
  "background": "From Nick, in his own words: we built a design system for a health-tech client in 2024 — 42 components, shipped in eleven weeks, and it was genuinely good. Eighteen months later there were four forks of the button. Nobody had budgeted the second version; the first was a project with a name and an end date, and after it landed the system was everyone's and therefore nobody's.\n\nFacts Nick supplied, all first-party: 42 components at first release; eleven weeks to ship it; four divergent button implementations found in an audit in March 2026; three product teams consuming the system; the audit itself took two days.\n\nThe same shape showed up on O3's own component set in 2023 — shipped, then unowned for a year, then rebuilt.\n\nWhat O3 did about it, per Nick: a standing half-day a week from one engineer, a public changelog, and a rule that a fork is filed as an issue against the system rather than merged. Six months on, the audit found one fork.\n\nNothing here has been checked against a published source. It is all Nick's own account.",
  "gaps": [
    "Whether anything published elsewhere on token governance says the same thing — nobody has looked, and Nick says he does not have it.",
    "What the standing half-day costs in money — Nick does not have the number."
  ],
  "decisions": [
    "The claim is carried by two instances — the health-tech client and O3's own set — rather than one, so it is written as an argument and not as a story."
  ]
}
```

The call makes a draft, so what comes back is
`drafts.brief-eval-draft-outline-gate-design-system-v2`. The published id above
is the one everything else addresses.

## The work

Nick, a principal at the agency, has just typed this to you:

> The brief on the design-system second-version piece is done — thesis agreed,
> reader questions locked. `brief-eval-draft-outline-gate-design-system-v2`.
> Take it from there.

Work the request. Nick is in the chat, and his answers are scripted below. Stop
when the workflow you are running says to stop and wait for him.

## Nick, and what he says

Direct, allergic to hedging and to AI-sounding copy. Answers in one or two
sentences, and nods to a good recommendation rather than composing his own.
**Facts come from the brief above or from this section, or they do not exist.**

**If you ask for anything quantitative not already in the brief** — the money,
the team sizes, a benchmark, another client — "I don't have that. Put it on the
list."

**If you ask what else has been published on token governance, or how this
differs from it** — "I don't have that. Nobody's looked. Put it on the list."

**If you ask which content type** — "Insight."

**At the outline gate, the script ends.** Nick has not replied, and there is no
answer for you to take. Make the gate your last message and stop there.

## What this run may touch

Sanity project `naorcr6k`, dataset `development`, drafts only. Never publish,
never unpublish, never discard, never address `production`.

Before you finish, read `brief-eval-draft-outline-gate-design-system-v2` back
out of the dataset and write it verbatim as JSON to
`dataset/brief-eval-draft-outline-gate-design-system-v2.json` in your working
directory. It is the run's evidence: a claim about the brief that the dataset
does not confirm is a claim about nothing.
