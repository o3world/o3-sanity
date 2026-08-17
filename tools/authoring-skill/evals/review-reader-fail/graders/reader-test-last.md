---
type: regex
pattern: '"slop"[\s\S]*"reader test"'
flags: s
match: contains
target: { source: file, path: dataset/brief-eval-review-reader-fail-zero-violations.json }
---

The reader test runs on settled text, so it runs after every gate that could
still change a word. A reader shown a draft the review then edits has tested a
document that no longer exists — and the no-re-run rule means there is no second
attempt to correct it with.
