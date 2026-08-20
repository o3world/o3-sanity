---
name: Typeset an insight
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

You are the agent in a Claude Code session at O3 World. A reviewed insight is
waiting to become a real document.

## Set the fixture up first

Before you do anything else, create this brief in Sanity project `naorcr6k`,
dataset `development`, exactly as written. It is a draft document, so what comes
back is `drafts.brief-eval-typeset-insight`.

```json
{
  "_id": "brief-eval-typeset-insight",
  "_type": "brief",
  "key": "eval-typeset-insight",
  "title": "Handing over a design system",
  "stage": "review",
  "nextStep": "Typeset the approved draft into an insight document.",
  "background": "From Nadia (engagement lead), in conversation: we handed the Rowan Health design system over in a 40-minute meeting whose only artifact was a Figma link. Six weeks later their platform team had rebuilt three of the nine components, because the library carried two button variants, both live and both documented, and no record of which one won. We spent the last two weeks of the engagement writing a runbook in their repo — one page per component, the decision, its date, and the person who takes the next one. Nine pages. Their team has amended four of them since. Nadia supplied every fact; nothing was taken from the web.",
  "instructions": "An insight for design-system leads who ship a library and call it a handover. Nadia supplied every fact. No figures beyond the ones she gave.",
  "thesis": "A handover that transfers files without transferring decisions leaves the receiving team to re-derive every argument the library settled, which is why they rebuild it.",
  "readerQuestions": [
    "What is the one claim this piece makes?",
    "What does a team actually need handed over?",
    "What would the author do differently?"
  ],
  "outline": "1. The 40-minute handover and what happened six weeks later. 2. What a library hands over. 3. The runbook we wrote instead. 4. What we would do differently.",
  "draft": {
    "title": "A library hands over files, not decisions",
    "excerpt": "We handed Rowan Health a design system in 40 minutes and a Figma link. Six weeks later they had rebuilt a third of it. For anyone who ships a component library and calls it a handover.",
    "body": "The handover meeting ran 40 minutes and produced one artifact: a Figma link. Six weeks later Rowan Health's platform team had rebuilt three of the nine components from scratch, because nobody could say which of the two button variants was the current one.\n\n## What a library hands over\n\nA component library hands over files. What a team needs handed over is the decision behind each file — why there are two buttons, which one won, and what happens to the loser. Rowan Health's library had both buttons, both live, both documented, and no record of the argument that produced them.\n\n(pullQuote)\n\n> A library hands over files. A system hands over decisions.\n\n## The runbook we wrote instead\n\nWe spent the last two weeks of the engagement writing a runbook in the client's own repo: one page per component, naming the decision, the date it was taken, and the person who takes the next one. Nine pages. Rowan Health's team has amended four of them since we left, which is the point of writing it in their repo rather than ours.\n\n(figure)\nA screenshot of one runbook page, showing the decision line and its date. Caption: One page per component, and a name against every open decision.\n\n## What we would do differently\n\nWrite it from the first week rather than the last. The decisions were still being taken while we wrote them down, and three of the nine pages record a call we made on the spot, because writing the page found the gap."
  },
  "verdict": {
    "result": "pass",
    "gates": [
      {
        "label": "P0",
        "result": "pass",
        "note": "Every fact traces to Nadia's account in background."
      },
      {
        "label": "structure",
        "result": "pass",
        "note": "Four sections, each only readable in place."
      },
      {
        "label": "front door",
        "result": "pass",
        "note": "Title, excerpt and opening make one promise."
      },
      { "label": "revision", "result": "pass", "note": "Two passes; inside the style floor." },
      { "label": "slop", "result": "pass", "note": "No tells across the piece." },
      {
        "label": "reader test",
        "result": "pass",
        "note": "All three questions answered from the text alone."
      }
    ],
    "readerAnswer": "Q1: a handover of files without decisions gets re-derived. Q2: the decision behind each file. Q3: write the runbook from week one."
  },
  "links": [],
  "gaps": [
    "No image asset exists for the runbook figure — Nadia has the screenshot and has not sent it."
  ],
  "decisions": [
    "WEIGHT: standard — the piece argues something a design-system lead could disagree with."
  ]
}
```

## Then work the request

Nadia has typed this to you:

> It's through review. Make it a real document.

Work the request. Nadia is in the chat and answers when you ask her something.
**Facts come from this prompt or they do not exist**: where nothing here covers
a question, Nadia says "I don't have that" and it stays open. She has no
author record, no categories, no SEO copy and no image asset — asked for any of
them, she says "I don't have that". Anywhere a nod is wanted, Nadia nods to your
recommendation.

## What this run may touch

Sanity project `naorcr6k`, dataset `development`, drafts only. Never publish,
never unpublish, never discard, never address `production`. Touch no document
other than the fixture above and the one piece you create from it.

## Evidence the run leaves behind

Three files in your working directory, all written before you finish:

- `piece.json` — the piece document you created, read back out of the dataset,
  verbatim, in full. Not what you sent: what came back.
- `rendered.md` — the piece's body rendered back out of `piece.json` as
  markdown, in order, block by block: headings as `##`, paragraphs as
  paragraphs, a pull quote as `>`, a figure as its description line. Nothing
  else — no title, no excerpt, no commentary. Render it from `piece.json`, not
  from the brief.
- `dataset/brief-eval-typeset-insight.json` — the brief read back out of the
  dataset, verbatim, after every write you made. Read the draft id.
