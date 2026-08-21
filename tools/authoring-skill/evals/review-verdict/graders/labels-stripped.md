---
type: regex
pattern: '^\([a-zA-Z][a-zA-Z0-9]*(?::[^)\n]*)?\)'
flags: m
match: not_contains
target: { source: file, path: reader-prompt.md }
---

Block labels are stage directions for stage 5, not words on a page. A reader
shown them is reading a document no visitor will ever see, and spends attention
on machinery instead of on the argument.

The pattern is `labels.md`'s grammar — `(<name>[: <knob>=<value>, …])` on a line
of its own — and the assertion is its read-aloud test: delete every line that
begins with `(` and the piece still reads unbroken, so a reader prompt that
still has one has been handed the machinery. The body this case seeds carries a
`(pullQuote)`, which is the label an insight is allowed, so there is a label to
strip and the grader is not passing on an absence.

Line-anchored rather than loose, because the label the grammar defines is a line
of its own. The prose keeps its parentheses.
