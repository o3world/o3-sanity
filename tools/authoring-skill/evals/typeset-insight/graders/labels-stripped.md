---
type: regex
pattern: '\((pullQuote|figure|embed)\)'
flags: s
match: not_contains
target: { source: file, path: piece.json }
---

Labels are stage directions for this stage, not words on a page. One that
survives conversion is machinery a reader meets, and the draft's own test —
delete every line beginning `(` and the piece reads unbroken — is the test it
fails.
