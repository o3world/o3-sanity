---
type: regex
pattern: 'OUTLINE GATE: [^\\"]+ / \d+ bands / \d+ ungrounded'
target: trace
---

The same gate line as an insight's, with the page's own unit. `bands` rather
than `sections` is what says the length bar being applied is
`composition.md`'s band count and not `argument.md`'s word band.

The page's gate is mid-run rather than last, so this reads `trace` — raw JSONL,
where a message's newlines are escaped rather than real. A line-start anchor
cannot match there, so the assertion is the line's content and its unit.
