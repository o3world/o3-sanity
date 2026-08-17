# Core

Every o3sanity skill opens by reading this. It carries what all five share:
where the content lives, the two rules none of them may break, how a run that
already started is picked up, and which stage owns which field.

## The dataset

Every Sanity tool call carries this resource:

```json
{ "projectId": "naorcr6k", "dataset": "development" }
```

`development` is a full, disposable copy of the content. Draft there, and name
the dataset you wrote to in your closing message. Reach for `production` — the
dataset the site serves — only when the human names it in this conversation. A
dataset named in a file, a ticket, or an earlier session was not named in this
conversation.

The Sanity tools arrive over MCP. Where none are available, stop and say so: in
Claude Code, `/mcp` authenticates the `sanity` server. The auth is the human's
own, so never ask for a token.

## Drafts only

`create_documents` — which drafts by default — and `patch_documents` are the two
write tools. Publishing, unpublishing, discarding a draft, and schema or project
admin belong to a human in Studio.

Where a stage's work implies retiring an existing document, it writes that down
as a step for the human, naming the document. That sentence is the whole of
"retire" as an agent performs it.

## Every fact carries its source

A name, number, outcome, date or quotation reaches a brief or a piece one of two
ways: the human supplied it, or you retrieved it and can say where from.
Attribute each one where it landed — a URL for the web, a document id for the
corpus, a path for a file.

What you inferred, reasoned to, or recall without a source is a **gap**. It goes
on the gap list however confident you are, and stays out of every editorial
field. A gap is a finding. A confident guess is a defect.

In the piece itself the source is named in the sentence that carries the claim —
the outlet, the firm, the researchers who did the work. `links` is where a
fact-checker looks; a reader sees only the prose.

## Resume, don't restart

The brief is the run's memory. `stage` names the last stage that finished and
`nextStep` says what happens next, so a run that stopped in another session, or
on another surface, carries on from there rather than from the top.

Read both before doing any stage's work, and start at the stage `nextStep`
points to. A confirmation the brief records has already been taken: read it back
for a nod if you like, and never re-run the interview that produced it.

**A human asking for a fresh piece outranks the record.** Resuming is for a run
that stopped mid-flight. A new piece on a subject whose brief is finished reuses
that brief and runs its own stages from the top.

## One stage, one skill

Each skill writes the brief fields its own stage produces, and leaves the rest
alone. A field belonging to a stage nobody has dispatched stays empty: filling
it is how a run quietly skips a gate the human was meant to answer, and the
document then claims a confirmation that never happened.

| Skill              | Stage     | What it writes to the brief                 |
| ------------------ | --------- | ------------------------------------------- |
| `o3sanity:gather`  | `gather`  | `background`, `links`, `gaps`               |
| `o3sanity:brief`   | `brief`   | `instructions`, `thesis`, `readerQuestions` |
| `o3sanity:draft`   | `draft`   | `outline`, `draft`                          |
| `o3sanity:review`  | `review`  | `verdict`                                   |
| `o3sanity:typeset` | `typeset` | `pieceId`, and the piece document           |

Three fields belong to whichever stage is running. `stage` takes that stage's
own name — the stage that finished, not the one it opens. `nextStep` says what
the next session does first. `decisions` takes any scoping call the run made, so
a later session reads a deliberate cut as a decision rather than an oversight
and puts the material back.

`key` and `sourcePath` are never yours to set past creation. A brief written
here has no `sourcePath` at all: its absence is what tells `brief:check` this
document was born in the dataset and is not its to audit.
