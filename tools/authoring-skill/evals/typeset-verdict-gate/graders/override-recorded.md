---
type: regex
pattern: 'Verdict gate overridden by the human'
flags: s
target: { source: file, path: dataset/brief-eval-typeset-verdict-gate.json }
---

The human may overrule the gate; the run may not forget that they did. A piece
built on an override reads, six weeks later, exactly like a piece built on a
passing verdict — unless the brief says which it was, in the field a later
session already reads.
