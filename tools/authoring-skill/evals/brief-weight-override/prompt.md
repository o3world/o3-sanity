---
name: Brief weight override
tags: [brief, gather]
plugins: ['../..']
runs: 1
max_turns: 60
timeout_seconds: 2400
allowed_tools:
  [
    Skill,
    Read,
    Glob,
    Grep,
    Write,
    WebSearch,
    WebFetch,
    mcp__sanity__query_documents,
    mcp__sanity__get_schema,
    mcp__sanity__create_documents,
    mcp__sanity__patch_documents,
  ]
model: sonnet
---

You are the agent in a Claude Code session at O3 World. Nick, a principal at
the agency, has just typed this to you:

> Quick one. We're a Sanity partner as of this week — can you put up a short
> post saying so?

Work the request from the top. Nick is in the chat and answers when you ask him
something; his answers are scripted below. Stop when the workflow you are
running says to stop and wait for him.

## Nick, and what he says

Direct, allergic to hedging and to AI-sounding copy. Answers in one or two
sentences, and nods to a good recommendation rather than composing his own.
**Facts come from this section or they do not exist.** Where nothing here
covers a question, Nick says "I don't have that" and it stays open.

**The moment you tell him how you have sized this run** — whatever you say,
Nick answers: "No — run this one properly. I don't want an announcement, I
want it to argue why we picked Sanity over the CMS everyone else defaults to."

**If you invite him to dump everything he has**, he pastes this:

> We've shipped four builds on Sanity now. The reason we keep picking it isn't
> the editing experience, it's that the content model is code we review like
> any other code — a schema change arrives as a pull request. On the last two
> projects the migration was the whole risk and Sanity is the only one where
> we could dry-run it.
>
> Partner status came through this week. Nothing to link to yet, the directory
> listing isn't live.

**If you ask who it is for** — "Technical directors and heads of engineering
picking a CMS for a rebuild."

**If you ask which content type** — "Insight."

**If you ask what the one claim is** — Nick nods to any phrasing that carries:
a CMS is picked on how its content model is changed, not on how it is authored.

**If you ask for the warrant** — "Because the thing that hurts three years in
is changing the model, and that's the part a code review can catch."

**If you ask what evidence he holds that a sweep could not reach** — "Four
builds, and the last two had dry-runnable migrations. I can't give you client
names for two of them."

**Once the questions are done and you are close to a draft**, Nick adds,
unprompted: "Keep it short though, 500 words. I don't want an essay."

**If you ask for numbers, dates, client names, or anything else quantitative**
— "I don't have that. Put it on the list."

**At any gate you put to him** — "Nothing to add, nothing to correct, go
ahead." The run carries on into the next stage rather than stopping there.

**Anywhere else a nod is wanted** — Nick nods to the recommendation.

## What this run may touch

Sanity project `naorcr6k`, dataset `development`, drafts only. Never publish,
never unpublish, never discard, never address `production`.

Any brief this run creates is keyed `eval-brief-weight-override-sanity-partner`,
so its document id is `brief-eval-brief-weight-override-sanity-partner`. Before
you finish, read that document back out of the dataset and write it verbatim as
JSON to `dataset/brief-eval-brief-weight-override-sanity-partner.json` in your
working directory. It is the run's evidence: a claim about the brief that the
dataset does not confirm is a claim about nothing.
