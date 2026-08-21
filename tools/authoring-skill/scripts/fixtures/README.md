# Calibration fixtures

`approved-short.md` and `approved-body.md` are every string of approved site
copy in `tools/migration/data/seed/`, one per record, split by the surface
`slop-lint.mjs` scores against. They are generated — `node
extract-approved-copy.mjs` rebuilds both — and nothing in them is hand-written.

They exist to answer one question about the linter: **how much approved O3 copy
does it mark?** A rule that fires here is not catching slop; it is a rule the
table should not carry, because a reviser who is told twice that good copy is
bad stops reading the third finding. `slop-lint.test.ts` pins the answer at
zero tells, and that assertion is the acceptance test for the whole tool.

## What the first run found

Six rules fired on approved copy the first time the fixtures were built, and
each one is a different way to get this wrong:

| Rule                 | Hits | What the hits actually were                                                      |
| -------------------- | ---- | -------------------------------------------------------------------------------- |
| `colon-reveal`       | 18   | ordinary colons after a complete clause — the tell is a colon after a _fragment_ |
| `binary-contrast`    | 2    | a negation that corrects a real reader expectation, so it survives the test      |
| `em-dash-short-copy` | 4    | three subheadings, which are sentences, and one authored heading                 |
| `em-dash-density`    | 2    | a per-document budget slop.md does not set                                       |
| `importance-puffery` | 1    | `revolutionizing` — a cliché the voice skill owns, not a slop.md pattern         |
| `weak-verb-phrase`   | 1    | `are able to` — the same family as a listed phrase, but not a listed phrase      |

Two were dropped, two were narrowed to the shapes slop.md writes out, one was
demoted, and one was a fixture bug. The [linter's header
comment](../slop-lint.mjs) carries the reasoning next to the rule it changed.

## Regenerating

Run the extractor after any change to seed copy, then run the tests. A rule
that starts firing means one of two things, and the difference matters:

- the new copy has a real tell in it — fix the copy, and
- the rule is wrong for O3 — fix or drop the rule, and say so on the ticket.

Neither is settled by editing the fixture, which is why it is generated.

## Two hits the fixtures still carry

Both are `candidate`, not `tell`, so they do not fail anything. Both are real
matches rather than misfires, and both are recorded here rather than tuned
away:

- **`in the age of`**, in an insight title. slop.md lists the phrase and marks
  the list conditional. This is what conditional looks like in practice.
- **an em dash in one `heading`** in `page/live.json`. slop.md is categorical —
  none in headlines — and this heading has one. One of the two is wrong, and
  which one is a decision for the person who owns the voice, not for a linter.
  Until then the tool counts it.
