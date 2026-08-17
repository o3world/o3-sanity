---
type: regex
pattern: '"result"\s*:\s*"(pass|fail)"'
flags: s
match: contains
target: { source: file, path: dataset/brief-eval-review-verdict-zero-violations.json }
---

`verdict.result` is what stage 5 reads, and it is one of two words. A verdict
recorded as prose in some other field is a verdict no machine can act on.
