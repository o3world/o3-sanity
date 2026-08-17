---
type: regex
pattern: '"(draft|body|excerpt)"\s*:'
match: not_contains
target: { source: file, path: dataset/brief-eval-draft-outline-gate-design-system-v2.json }
---

The gate is a real gate. Nick never answered it in this script, so the brief
holds no prose: a `draft` object here is 1,200 words written against a shape
nobody agreed to, and stage 4 will review it against that shape as though it
had been.
