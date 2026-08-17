---
type: regex
pattern: 'forty-eight'
flags: si
match: not_contains
target: { source: file, path: dataset/insight-eval-review-existing-piece.json }
---

The document says 42 templates in one block and forty-eight in another. That is
an `error`-tier finding, the human said 42 is right, and the approved fix is in
the document afterwards. A findings table nobody acted on is a review that
reported and never wrote.
