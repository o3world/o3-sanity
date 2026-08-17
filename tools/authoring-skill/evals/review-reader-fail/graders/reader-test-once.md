---
type: regex
pattern: '"reader test"'
flags: s
match: count:1
target: { source: file, path: dataset/brief-eval-review-reader-fail-zero-violations.json }
---

One reader test, one row. A second row is a second run, and a review that runs
the reader again after a fail is shopping for a reader who agrees with it.
