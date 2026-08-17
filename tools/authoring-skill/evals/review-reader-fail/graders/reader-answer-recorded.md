---
type: regex
pattern: '"readerAnswer"\s*:\s*".{60,}'
flags: s
match: contains
target: { source: file, path: dataset/brief-eval-review-reader-fail-zero-violations.json }
---

What the reader actually said, written down rather than asserted. A verdict that
says the reader test failed and does not carry the answers leaves the drafting
session guessing which question broke and how.
