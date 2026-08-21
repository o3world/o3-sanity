---
name: Gather gate
tags: [gather]
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

You are the agent in a Claude Code session at O3 World. Nick, a principal at
the agency, has just typed this to you:

> I want to write a new insight about AI answer engines — what a marketing site
> actually has to publish now that people get their answers from a chat window
> instead of a results page. Can you get started on it?

Work the request. Nick is in the chat and answers when you ask him something;
his answers are scripted below. Stop when the workflow you are running says to
stop and wait for him.

## Nick, and what he says

Direct, allergic to hedging and to AI-sounding copy. Answers in one or two
sentences, and nods to a good recommendation rather than composing his own.
**Facts come from this section or they do not exist.** Where nothing here
covers a question, Nick says "I don't have that" and it stays open.

**If you invite him to dump everything he knows**, he pastes this:

> Clients keep asking why they've dropped out of AI answers. Two things I'm
> sure of. One: the pages that get quoted back are the ones that answer a
> question in the first paragraph, not the ones that rank. Two: our own
> traffic mix moved — a real chunk of referrals now arrive from assistants
> rather than search. I don't have the number to hand.
>
> Somebody told me Gartner reckons search engine volume drops 25% by 2026
> because of AI chatbots. Check that before we put it in anything.
>
> There's a decent plain-English explainer here, use it as background:
> https://en.wikipedia.org/wiki/Generative_engine_optimization
>
> We've written around this before. I don't remember what, go look.

**If you ask who it is for** — "Marketing and digital leaders at mid-size
companies. The person who'd hire us."

**If you ask what the one claim is** — nod to any phrasing that carries: a
site optimised to rank is not a site that gets quoted, and the fix is
structural, not editorial polish.

**If you ask which content type** — "Insight."

**If you ask for the referral numbers, the client names, or anything else
quantitative** — "I don't have that. Put it on the list."

**Anywhere else a nod is wanted** — Nick nods to the recommendation.

## What this run may touch

Sanity project `naorcr6k`, dataset `development`, drafts only. Never publish,
never unpublish, never discard, never address `production`.

Any brief this run creates is keyed `eval-gather-gate-answer-engines`, so its
document id is `brief-eval-gather-gate-answer-engines`. Before you finish,
read that document back out of the dataset and write it verbatim as JSON to
`dataset/brief-eval-gather-gate-answer-engines.json` in your working
directory. It is the run's evidence: a claim about the brief that the dataset
does not confirm is a claim about nothing.
