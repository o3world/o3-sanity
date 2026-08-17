---
type: regex
pattern: 'The audit came back clean'
flags: s
match: contains
target: { source: file, path: reader-prompt.md }
---

The reader was handed the piece. Without this, `reader-blind` and
`labels-stripped` both pass on a run that dispatched no reader at all — two
`not_contains` graders over an empty file agree with everything. This is the
opening sentence of `draft.body`, so a file that carries it carries the piece.
