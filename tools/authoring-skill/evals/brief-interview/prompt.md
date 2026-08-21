---
name: Brief interview
tags: [brief]
plugins: ['../..']
runs: 1
max_turns: 40
timeout_seconds: 1800
# Server name is the plugin's `sanity`; grade.mjs matches this repo's `Sanity` case-insensitively.
allowed_tools:
  [
    Skill,
    Read,
    Glob,
    Grep,
    Write,
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

## Setup, before the work starts

This run picks a piece up mid-flight, so the brief it resumes has to exist
first. Make it with **one** `mcp__sanity__create_documents` call against project
`naorcr6k`, dataset `development`, type `brief`, and this content:

```json
{
  "_id": "brief-eval-brief-interview-theme-colour",
  "key": "eval-brief-interview-theme-colour",
  "title": "Colour as the only carrier of meaning",
  "stage": "gather",
  "nextStep": "Nick answered the gather gate — go on to the interview and settle what this piece argues.",
  "background": "Nick, in conversation: \"Every rebrand we do turns into the same argument. A client asks for a dark theme and half the interface stops making sense — the red pill that meant 'blocked', the two chart series you told apart by colour, the diagrams. Nobody costs that in. I want to write something about it. Not a CSS post.\"\n\nCorpus sweep: no insight, case study or page on o3world.com covers theming or colour semantics — 0 hits across title, slug and body for theme, dark mode, colour contrast, design tokens. Source: development dataset, six queries.\n\nWeb: WCAG 2.2 Success Criterion 1.4.1 'Use of Color' requires that colour is never the only visual means of conveying information. Source: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html — read.\n\nWeb: the CSS Color Adjustment spec defines light-dark() and forced-colors, which restyle colour but carry no semantics. Source: https://www.w3.org/TR/css-color-adjust-1/ — read.",
  "links": [
    "https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html",
    "https://www.w3.org/TR/css-color-adjust-1/"
  ],
  "gaps": [
    "How often this actually bites — nobody has counted the components on a real build where colour is the only signal."
  ]
}
```

Do not grade or judge that call: it is scenery. The run's work starts below.

## The work

You are the agent in a Claude Code session at O3 World. Nick, a principal at
the agency, has just typed this to you:

> Picking the colour thing back up. I answered your gather list — nothing to
> add, nothing to correct, go ahead. Take it from there.

Work the request. Nick is in the chat and answers when you ask him something;
his answers are scripted below. Stop when the workflow you are running says to
stop and wait for him.

## Nick, and what he says

Direct, allergic to hedging and to AI-sounding copy. Answers in one or two
sentences, and nods to a good recommendation rather than composing his own.
**Facts come from this section or they do not exist.** Where nothing here
covers a question, Nick says "I don't have that" and it stays open.

**If you ask who it is for** — "Design and engineering leads at companies that
already have a design system. The ones who'd sign off the rebrand."

**If you ask which content type** — "Insight."

**If you ask what the one claim is** — Nick nods to any phrasing that carries:
theming is cheap until colour is the only thing carrying a meaning, and then it
is a content job rather than a styling one.

**If you ask for the warrant, or why the evidence gets you to the claim** —
"Because a colour that means something is content, and content is the one thing
a theme can't restyle."

**If you ask what evidence he holds that a sweep could not reach** — "On the
Vertex rebuild we counted 34 components where colour was the only signal —
status pills, two chart series, the whole diagram set. That's not published
anywhere. Take it from me."

**If you ask about a byline, an author, or who is writing it** — "I don't have
that. Nobody's decided who's writing it."

**If you ask about categories, tags or taxonomy** — "I don't have that either."

**If you ask about a publication date** — Nick nods to the recommendation.

**When you put the thesis sentence to him** — "Almost. Say it exactly like
this: A theme stops being a rendering problem the moment colour is the only
thing carrying a meaning."

**When you put the reader-test questions to him** — Nick nods.

**If you ask for numbers, client names, or anything else quantitative** — "I
don't have that. Put it on the list."

**Anywhere else a nod is wanted** — Nick nods to the recommendation.

## What this run may touch

Sanity project `naorcr6k`, dataset `development`, drafts only. Never publish,
never unpublish, never discard, never address `production`.

Before you finish, read `brief-eval-brief-interview-theme-colour` back out of
the dataset and write it verbatim as JSON to
`dataset/brief-eval-brief-interview-theme-colour.json` in your working
directory. It is the run's evidence: a claim about the brief that the dataset
does not confirm is a claim about nothing.
