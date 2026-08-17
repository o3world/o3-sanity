---
type: regex
pattern: '\d+\s*(%|percent)|\b(19|20)\d{2}\b'
match: not_contains
target: { source: file, path: rendered.md }
---

No percentage and no year, because the draft carries neither. Fact conservation
runs both ways, and the shape an invented fact arrives in is a specific one — an
org, a year, a figure — because specificity is what makes it read as evidence.
