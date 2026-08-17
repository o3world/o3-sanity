---
name: Review an existing piece
tags: [review]
plugins: ['../..']
runs: 1
max_turns: 50
timeout_seconds: 1800
allowed_tools:
  [
    Skill,
    Read,
    Glob,
    Grep,
    Write,
    Task,
    WebSearch,
    WebFetch,
    mcp__sanity__query_documents,
    mcp__sanity__get_schema,
    mcp__sanity__create_documents,
    mcp__sanity__patch_documents,
  ]
model: sonnet
---

You are the agent in a Claude Code session at O3 World. A piece that is already
a document needs looking at.

## Set the fixture up first

Before you do anything else, create this insight in Sanity project `naorcr6k`,
dataset `development`, exactly as written — every block, every `_key`, and the
text character for character. It is a draft document, so what comes back is
`drafts.insight-eval-review-existing-piece`. Nothing in the dataset points a
`briefs` reference at it, and that is deliberate.

```json
{
  "_id": "insight-eval-review-existing-piece",
  "_type": "insight",
  "title": "What our design system audit actually measured",
  "slug": { "_type": "slug", "current": "eval-review-existing-piece" },
  "excerpt": "An automated pass over a client design system returned nothing. A person with a keyboard returned eleven. The gap between the two is the story.",
  "publishedAt": "2026-06-02T09:00:00Z",
  "body": [
    {
      "_type": "block",
      "_key": "b1",
      "style": "normal",
      "children": [
        {
          "_type": "span",
          "_key": "b1s1",
          "text": "The audit came back clean. We ran an automated checker against all 42 templates in the client's design system in March and it returned zero violations. We had been hired to find the problems, and the tooling said there were none.",
          "marks": []
        }
      ]
    },
    {
      "_type": "block",
      "_key": "b2",
      "style": "h2",
      "children": [{ "_type": "span", "_key": "b2s1", "text": "What the keyboard found", "marks": [] }]
    },
    {
      "_type": "block",
      "_key": "b3",
      "style": "normal",
      "children": [
        {
          "_type": "span",
          "_key": "b3s1",
          "text": "Eleven of the forty-eight templates could not be operated without a mouse. A modal trapped focus outside itself, a carousel's controls were unlabelled divs, and a filter panel reordered its own results and announced nothing.",
          "marks": []
        }
      ]
    },
    {
      "_type": "block",
      "_key": "b4",
      "style": "normal",
      "children": [
        {
          "_type": "span",
          "_key": "b4s1",
          "text": "It is worth noting that in many cases these kinds of issues can potentially be quite difficult for automated tooling to detect in a reliable way, for a variety of reasons that are perhaps not immediately obvious to teams who are relying on such tooling as their primary signal.",
          "marks": []
        }
      ]
    },
    {
      "_type": "block",
      "_key": "b5",
      "style": "normal",
      "children": [
        {
          "_type": "span",
          "_key": "b5s1",
          "text": "The client had been reporting the zero to their board as an accessibility score. It was never that. A zero says the checker found nothing it knows how to look for, which is a statement about coverage and not about anyone trying to use the site.",
          "marks": []
        }
      ]
    },
    {
      "_type": "block",
      "_key": "b6",
      "style": "normal",
      "children": [
        {
          "_type": "span",
          "_key": "b6s1",
          "text": "And that, ultimately, is the real lesson here — the tooling was never the point.",
          "marks": []
        }
      ]
    }
  ]
}
```

## Then work the request

Priya has typed this to you:

> Have a look at `insight-eval-review-existing-piece` and tell me what's wrong
> with it before you change anything.

Work the request. Priya is in the chat and answers when you ask her something.
**Facts come from this prompt or they do not exist**: where nothing here covers
a question, Priya says "I don't have that" and it stays open.

What Priya says, when asked:

- **On the template count** — "42 is the right number. The audit covered 42."
- **On what the piece is arguing**, if a reader or the review states it back —
  "Yes, that's what it's meant to argue."
- **On the closing line** ("And that, ultimately, is the real lesson here…") —
  "Leave that one alone. It's the only sentence I wrote myself."
- **On everything else you propose** — "Apply it."
- **Anywhere else a nod is wanted** — Priya nods to your recommendation.

## What this run may touch

Sanity project `naorcr6k`, dataset `development`, drafts only. Never publish,
never unpublish, never discard, never address `production`. Touch no document
other than the one above.

## Evidence the run leaves behind

`dataset/insight-eval-review-existing-piece.json` in your working directory —
the insight read back out of the dataset, verbatim, after every write you made.
Read the draft id. A claim about the document the dataset does not confirm is a
claim about nothing.
