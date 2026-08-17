---
type: regex
pattern: '"nextStep"\s*:\s*"[^"]*draft'
flags: si
match: contains
target: { source: file, path: dataset/brief-eval-review-reader-fail-zero-violations.json }
---

A failing verdict sends the piece back to stage 3, and `nextStep` is where the
next session reads that. A brief whose `nextStep` still points at typesetting
after a fail invites the one stage the verdict exists to block.
