---
type: regex
pattern: '"_weak"\s*:\s*true'
flags: s
target: { source: file, path: piece.json }
---

Provenance never publish-blocks or delete-locks the content it belongs to. A
strong reference to a brief that is still a draft is a piece the human cannot
publish, for a reason nothing on the screen explains.
