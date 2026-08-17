---
type: regex
pattern: 'Verdict gate overridden by the human(\\"|[^"]){20,}'
flags: s
target: { source: file, path: dataset/brief-eval-typeset-verdict-gate.json }
---

The reason Dev gave, carried into the record with the override. An entry that
says only that a gate was skipped tells the next session nothing it can weigh —
the twenty characters this asks for are the difference between a note and a
record.
