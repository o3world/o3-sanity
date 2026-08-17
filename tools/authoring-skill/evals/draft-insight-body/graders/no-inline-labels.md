---
type: regex
pattern: '[a-zA-Z,;:] \((pullQuote|figure|embed|pull quote)\)'
match: not_contains
target: { source: file, path: dataset/brief-eval-draft-insight-body-design-system-v2.json }
---

A label is a stage direction on a line of its own. Mid-sentence it stops being a
direction and becomes something a reader has to step over — and the read-aloud
test, which is the whole guarantee the grammar offers, no longer holds.
