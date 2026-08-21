---
name: Typeset a page
tags: [typeset]
plugins: ['../..']
runs: 1
max_turns: 60
timeout_seconds: 1800
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

You are the agent in a Claude Code session at O3 World. A reviewed page draft is
waiting to become a real document.

## Set the fixture up first

Before you do anything else, create this brief in Sanity project `naorcr6k`,
dataset `development`, exactly as written. It is a draft document, so what comes
back is `drafts.brief-eval-typeset-page-bands`.

```json
{
  "_id": "brief-eval-typeset-page-bands",
  "_type": "brief",
  "key": "eval-typeset-page-bands",
  "title": "Design system handover — service page",
  "stage": "review",
  "nextStep": "Typeset the approved band list into a page document.",
  "background": "From Priya (practice lead), in conversation: we want a service page for design-system handover work. The three engagement shapes are Audit, Build and Steward — Audit is a fortnight reading someone else's library, Build is the library and the runbook together, Steward is a standing retainer where we take the open decisions each quarter. The page lives at services/design-system-handover and is a service page, so it needs a card. Priya supplied every fact; nothing was taken from the web.",
  "instructions": "A service page for engineering and design leaders shopping for handover help. Priya supplied every fact. No client names, no figures — she has not cleared any.",
  "thesis": "A design system is handed over when the decisions behind it are, and O3 sells three sizes of doing that.",
  "readerQuestions": [
    "What is O3 offering on this page?",
    "Which of the three shapes fits the reader?"
  ],
  "outline": "Bands: heroSection (ink) → layoutSection (bone) → railPanelsSection (white) → ctaSection (ink). Confirmed with Priya.",
  "draft": {
    "title": "Design system handover",
    "excerpt": "Audit, build or steward — three sizes of handing a design system over so the receiving team keeps it.",
    "body": "(heroSection: surface=ink, variant=band) headline, subheading\n\n## Design systems that outlive the team that built them\n\nWe hand over the decisions, not only the files.\n\n(layoutSection: surface=bone, columns=2) richText, figure\n\nMost libraries arrive as a link and a walkthrough. Months later the receiving team has forked half of it, because the argument behind each component left with the people who made it. A handover that transfers files without transferring decisions leaves that team to re-derive every argument the library already settled.\n\nA screenshot of a runbook page, showing one component's decision and the person who takes the next one. Caption: One page per component, and a name against every open decision.\n\n(railPanelsSection: surface=white, layout=cards) Audit, Build, Steward\n\n### Audit\n\nA fortnight reading someone else's library and writing down what it decided. You get the runbook and the list of decisions nobody has taken.\n\n### Build\n\nThe library and the runbook together, written in your repo as the components land. Best when the system does not exist yet.\n\n### Steward\n\nA standing retainer. We take the open decisions each quarter and leave the record behind. Best when the team that built it has moved on.\n\n(ctaSection: surface=ink) heading, body, button\n\n### Planning a handover?\n\nTell us what you are handing over and who is receiving it.\n\nStart a conversation → /contact"
  },
  "verdict": {
    "result": "pass",
    "gates": [
      {
        "label": "P0",
        "result": "pass",
        "note": "Every claim traces to Priya's account in background."
      },
      {
        "label": "structure",
        "result": "pass",
        "note": "Four bands, ink bookends, rail into the close."
      },
      {
        "label": "front door",
        "result": "pass",
        "note": "Title, card excerpt and hero make one promise."
      },
      { "label": "revision", "result": "pass", "note": "Two passes; inside the style floor." },
      { "label": "slop", "result": "pass", "note": "No tells across the page." },
      {
        "label": "reader test",
        "result": "pass",
        "note": "Both questions answered from the page alone."
      }
    ],
    "readerAnswer": "Q1: handover help for design systems. Q2: Audit, Build or Steward, by what the reader already has."
  },
  "links": [],
  "gaps": ["No image asset exists for the runbook figure — Priya has not cleared a screenshot."],
  "decisions": ["WEIGHT: standard — the page argues that a library is not a handover."]
}
```

## Then work the request

Priya has typed this to you:

> The band list is signed off. Build the page.

Work the request. Priya is in the chat and answers when you ask her something.
**Facts come from this prompt or they do not exist**: where nothing here covers
a question, Priya says "I don't have that" and it stays open. The page lives at
`services/design-system-handover`; she has no icon, no SEO copy and no cleared
screenshot. Anywhere a nod is wanted, Priya nods to your recommendation.

## What this run may touch

Sanity project `naorcr6k`, dataset `development`, drafts only. Never publish,
never unpublish, never discard, never address `production`. Touch no document
other than the fixture above and the one page you create from it.

## Evidence the run leaves behind

Two files in your working directory, both written before you finish:

- `piece.json` — the page document you created, read back out of the dataset,
  verbatim, in full. Not what you sent: what came back.
- `dataset/brief-eval-typeset-page-bands.json` — the brief read back out of the
  dataset, verbatim, after every write you made. Read the draft id.
