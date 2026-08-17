---
type: regex
pattern: '"stage"\s*:\s*"review"'
flags: s
match: contains
target: { source: file, path: dataset/brief-eval-review-verdict-zero-violations.json }
---

The stage this run finished. A brief left at `draft` sends the next session back
through drafting; a brief moved to `typeset` claims a stage nobody ran.
