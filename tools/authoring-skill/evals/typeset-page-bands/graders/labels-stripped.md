---
type: regex
pattern: '\([a-zA-Z]+Section[:)]'
flags: s
match: not_contains
target: { source: file, path: piece.json }
---

Labels are stage directions for this stage, not words on a page. One that
survives conversion is machinery a visitor meets in the middle of a band.
