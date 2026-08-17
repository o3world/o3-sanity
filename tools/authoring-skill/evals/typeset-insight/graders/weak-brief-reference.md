---
type: regex
pattern: '"_ref"\s*:\s*"brief-eval-typeset-insight"'
flags: s
target: { source: file, path: piece.json }
---

The piece points back at the brief it was written from, at the published id
rather than the draft one — that is how a reference addresses a document, and
weak is why it costs nothing while both are still drafts.
