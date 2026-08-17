---
type: regex
pattern: '\|\s*F1\s*\|'
flags: m
match: contains
target: last_message
---

The findings arrive as a table with stable ids, so approval is "apply F1, F3,
F7" rather than a paragraph the human has to parse back into edits. A review
that reports what it found as prose has made row-level approval impossible.
