---
type: regex
pattern: 'could not be operated without a mouse'
flags: s
match: contains
target: { source: file, path: dataset/brief-eval-review-reader-fail-zero-violations.json }
---

A reader-test fail blocks the hand-off, not the draft. The obvious wrong move is
to write the missing section and call the test passed: that re-drafts to make
the review's own test pass, and the reader who would have judged it has already
run and may not run again.
