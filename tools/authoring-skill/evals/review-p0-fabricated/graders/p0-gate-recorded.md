---
type: regex
pattern: '"P0"[\s\S]{0,400}?"fail"'
flags: s
match: contains
target: { source: file, path: dataset/brief-eval-review-p0-fabricated-zero-violations.json }
---

The gate that failed is named in the record, so the next pass knows what to fix.
A verdict of `fail` whose gates array says every gate passed tells the drafting
session nothing it can act on.
