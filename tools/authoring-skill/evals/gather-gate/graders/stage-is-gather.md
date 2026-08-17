---
type: regex
pattern: '"stage"\s*:\s*"gather"'
target: { source: file, path: dataset/brief-eval-gather-gate-answer-engines.json }
---

`stage` is the only field that says how far the piece has got, and a resuming
session reads it before anything else. Gathering finished, so the document says
`gather` — not the schema's initial value by luck, but the value this stage set.
