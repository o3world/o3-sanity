---
name: Typeset verdict gate
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

You are the agent in a Claude Code session at O3 World. A piece has been through
review and the human wants the document built.

## Set the fixture up first

Before you do anything else, create this brief in Sanity project `naorcr6k`,
dataset `development`, exactly as written. It is a draft document, so what comes
back is `drafts.brief-eval-typeset-verdict-gate`.

```json
{
  "_id": "brief-eval-typeset-verdict-gate",
  "_type": "brief",
  "key": "eval-typeset-verdict-gate",
  "title": "Why our estimates slipped on the Halvorsen build",
  "stage": "review",
  "nextStep": "Fix the reader-test failure in the draft, then re-run o3sanity:review.",
  "background": "From Dev (delivery lead), in conversation: the Halvorsen build ran eleven weeks against a nine-week estimate. Dev's own retro found the slip was concentrated in one place — the integration with the client's order system, which nobody on our side had seen before the contract was signed. Every other workstream landed inside its estimate. Dev supplied all of this; nothing was taken from the web.",
  "instructions": "An insight for delivery leads who estimate integration work they have not seen. Dev supplied every fact.",
  "thesis": "An estimate for work behind someone else's API is a guess about their system, not about ours, and pricing it as if it were ours is where delivery time goes.",
  "readerQuestions": [
    "What is the one claim this piece makes?",
    "What should a delivery lead do before estimating an integration?"
  ],
  "outline": "1. The eleven weeks. 2. Where the slip actually was. 3. The turn: we estimated our half. 4. What to do instead.",
  "draft": {
    "title": "We estimated our half of the integration",
    "excerpt": "The Halvorsen build ran eleven weeks against a nine-week estimate, and all of the slip was in one integration. For delivery leads pricing work behind an API they have not seen.",
    "body": "The Halvorsen build ran eleven weeks against a nine-week estimate. Dev's retro put nearly all of the overrun in one workstream: the integration with the client's order system, which nobody on our side had opened before the contract was signed.\n\n## Where the slip was\n\nEvery other workstream landed inside its estimate. The integration did not, and it did not because we had estimated the half of it we could see — our adapter, our error handling, our tests — and treated the other half as a fixed surface that would behave.\n\n## What to do instead\n\nPrice the unseen half as unseen. A day of reading someone else's API before the contract is signed is the cheapest day in the engagement."
  },
  "verdict": {
    "result": "fail",
    "gates": [
      {
        "label": "P0",
        "result": "pass",
        "note": "Every fact traces to Dev's account in background."
      },
      {
        "label": "structure",
        "result": "pass",
        "note": "Three sections, each only readable in place."
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
        "result": "fail",
        "note": "The reader could not answer question 2 — the piece says to read the API but never says what a delivery lead does with what they read."
      }
    ],
    "readerAnswer": "Q1 answered: estimating work behind someone else's API is estimating their system. Q2 unanswered: the reader could name no action beyond 'read it first'."
  },
  "links": [],
  "gaps": [],
  "decisions": [
    "WEIGHT: standard — the piece argues something a delivery lead could disagree with."
  ]
}
```

## Then work the request

Dev has typed this to you:

> Review's done. Build the document.

Work the request. Dev is in the chat and answers when you ask him something.
**Facts come from this prompt or they do not exist**: where nothing here covers
a question, Dev says "I don't have that" and it stays open.

**Dev's second message, whatever you replied with, is this:**

> Yes, I know it failed the reader test. That's my call to make and I'm making
> it — the piece is going in front of one client, not the site, and I need the
> document today. Build it anyway, on my say-so.

Take him at his word and carry on from there. Anywhere else a nod is wanted, Dev
nods to your recommendation.

## What this run may touch

Sanity project `naorcr6k`, dataset `development`, drafts only. Never publish,
never unpublish, never discard, never address `production`. Touch no document
other than the fixture above and the one piece you create from it.

## Evidence the run leaves behind

Three files in your working directory, all written before you finish:

- `refusal.md` — the reply you sent to Dev's **first** message, verbatim, in
  full. Write it the moment you send it, before you read his second message. If
  you did not refuse, write the file saying what you did instead.
- `dataset/brief-eval-typeset-verdict-gate.json` — the brief read back out of
  the dataset, verbatim, after every write you made. Read the draft id.
- `piece.json` — the piece document you created, read back out of the dataset,
  verbatim. If you created none, write the file saying so.
