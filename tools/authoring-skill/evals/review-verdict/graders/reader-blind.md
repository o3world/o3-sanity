---
type: regex
pattern: 'measures the reach of the tool'
flags: s
match: not_contains
target: { source: file, path: reader-prompt.md }
---

The reader is context-free or it is not a reader. The agreed thesis is the
answer to question one, so a reader handed the thesis is being asked to repeat
it back. This pattern is a clause of the brief's `thesis` and it must not appear
in what the reader was given.
