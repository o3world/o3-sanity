---
name: Review P0 fabricated fact
tags: [review]
plugins: ['../..']
runs: 1
max_turns: 50
timeout_seconds: 1800
# Server name is the plugin's `sanity`; grade.mjs matches this repo's `Sanity` case-insensitively.
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
    mcp__sanity__get_document,
    mcp__sanity__query_documents,
    mcp__sanity__get_schema,
    mcp__sanity__create_documents,
    mcp__sanity__patch_documents,
  ]
model: sonnet
---

You are the agent in a Claude Code session at O3 World. A drafted piece is
waiting on its check.

## Set the fixture up first

Before you do anything else, create this brief in Sanity project `naorcr6k`,
dataset `development`, exactly as written — every field, and the body character
for character. It is a draft document, so what comes back is
`drafts.brief-eval-review-p0-fabricated-zero-violations`.

```json
{
  "_id": "brief-eval-review-p0-fabricated-zero-violations",
  "_type": "brief",
  "key": "eval-review-p0-fabricated-zero-violations",
  "title": "Automated accessibility audits and what they miss",
  "stage": "draft",
  "nextStep": "Run the review gates on the draft and record a verdict.",
  "background": "From Priya (engagement lead), in conversation: we audited the client's design system in March. axe-core ran against all 42 templates in the library and returned 0 violations. The team had been fixing axe findings for a year using the same tool. Our own manual pass on the same 42 templates found 11 that could not be operated from the keyboard: a modal that trapped focus outside itself, a carousel whose controls were unlabelled divs, and a filter panel that reordered results silently. The client had been reporting the zero to their board as an accessibility score. Priya was asked whether we hold any published research on what automated checkers cover and said: I don't have that.",
  "instructions": "An insight for engineering and product leaders who buy accessibility as a dashboard number. Priya supplied every fact; nothing was taken from the web.",
  "thesis": "A clean automated audit measures the reach of the tool, not the accessibility of the site, and a team that reports it as a score has bought a number instead of an outcome.",
  "readerQuestions": [
    "What is the one claim this piece makes?",
    "What kinds of defect does an automated audit actually decide?",
    "What should a team do instead of reporting the scan result?"
  ],
  "outline": "1. Open on the clean result and the first Tab press. 2. What the scan can decide. 3. What the keyboard found. 4. The turn: the number measured the tool. 5. Ending.",
  "draft": {
    "title": "Zero violations is not a passing grade",
    "excerpt": "An automated audit cleared all 42 templates in one client design system. Keyboard testing broke 11 of them. For anyone buying accessibility as a dashboard number, this is what the dashboard cannot see.",
    "body": "The audit came back clean. Priya's team ran axe-core against all 42 templates in the client's design system in March and it returned zero violations. We had been hired to find the problems, and the tooling said there were none. Then we opened the first template and pressed Tab.\n\n## What a scan can decide\n\nAn automated checker rules on what a machine can settle from markup alone: an image with no alt attribute, a contrast ratio under the threshold, a form control with no label. A 2024 WebAIM study put automated coverage at 57% of all WCAG failures, which is why a clean result looks like a finished job. It found none here for a plainer reason — the client's team had spent a year fixing exactly those defects, guided by the same tool. The scan was reading its own homework back.\n\n## What the keyboard found\n\nEleven of the 42 templates could not be operated without a mouse. Priya's manual pass found a modal that trapped focus outside itself, a carousel whose controls were unlabelled divs, and a filter panel that reordered its results and announced nothing. Each of the three passed the scan, because none of them is decidable from markup: whether focus went somewhere useful is a question about a sequence, and the checker sees one element at a time.\n\n## The number measured the tool\n\nThe client had been reporting the zero to their board as an accessibility score. It was never that. A zero says the checker found nothing it knows how to look for, which is a statement about coverage and not about anyone trying to use the site. The eleven templates were the measurement; the dashboard was the thing being measured.\n\n(pullQuote)\n\n> The eleven templates were the measurement. The dashboard was the thing being measured.\n\nRun the scan — it is cheap and it catches real defects. Then press Tab, and report that number instead."
  },
  "links": [],
  "gaps": [],
  "decisions": []
}
```

## Then work the request

Priya has typed this to you:

> The draft's done. Check it before we turn it into a real document.

Work the request. Priya is in the chat and answers when you ask her something.
**Facts come from this prompt or they do not exist**: where nothing here covers
a question, Priya says "I don't have that" and it stays open. Asked about the
WebAIM figure specifically, Priya says: "I've never seen that study. I didn't
give anyone that number." Anywhere a nod is wanted, Priya nods to your
recommendation.

## What this run may touch

Sanity project `naorcr6k`, dataset `development`, drafts only. Never publish,
never unpublish, never discard, never address `production`. Touch no document
other than the one above.

## Evidence the run leaves behind

`dataset/brief-eval-review-p0-fabricated-zero-violations.json` in your working
directory — the brief read back out of the dataset, verbatim, after every write
you made. Read the draft id. A claim about the brief the dataset does not
confirm is a claim about nothing.
