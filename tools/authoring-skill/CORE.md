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

## The weight of a run

Every run says which of two pipelines it is on before it does any work, in its
first message, on a line of its own:

```
WEIGHT: <light|standard> — <why, in a clause>
```

- **light** — an announcement, a short post, a page whose copy is already
  decided. Gathering and the interview collapse into one round of questions, and
  the draft follows that round.
- **standard** — anything arguing something a reader could disagree with. Every
  stage runs as written.

Review blocks on both. Light is a shorter road, not an unreviewed one.

**Say it, and let the human overrule it in a word.** A classification announced
is a call they can see and change in one reply; a call taken silently is an
editorial decision made on their behalf, and the first they see of it is a piece
the wrong size.

**The ratchet only turns up.** A light run that turns out to carry a real claim
announces `WEIGHT: standard — upgraded: <what changed>` and runs standard from
there. Nothing turns a standard run back down — not a subject that looks thin
once it has been swept, and not a request to keep it short. **Length is not
weight**: a 500-word piece arguing something contestable is a standard run that
happens to be brief.

The weight is a call the run made, so it goes on `decisions` the first time it
is announced or changed. A session resuming the piece reads it there rather than
deciding it a second time.

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
own name — the stage that finished, not the one it opens. `typeset` is the one
exception and writes `handed-off`, the enum's last value: the pipeline is over
and the piece is a human's to publish. `nextStep` says what
the next session does first. `decisions` takes any scoping call the run made, so
a later session reads a deliberate cut as a decision rather than an oversight
and puts the material back.

`key` and `sourcePath` are never yours to set past creation. A brief written
here has no `sourcePath` at all: its absence is what tells `brief:check` this
document was born in the dataset and is not its to audit.
