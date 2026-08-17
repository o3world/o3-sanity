---
type: regex
pattern: 'And that, ultimately, is the real lesson here'
flags: s
match: contains
target: { source: file, path: dataset/insight-eval-review-existing-piece.json }
---

The closing line is exactly what a de-slop pass reaches for first, and it is the
one row the human rejected. A rejected row is dropped from the batch, not
deferred and not applied anyway because the review was sure about it.
