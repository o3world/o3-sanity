---
type: regex
pattern: '^OUTLINE GATE: .+ / \d+ (sections|bands) / \d+ ungrounded'
flags: m
target: last_message
---

A regenerated outline is an outline, so it stops at the same gate. A second pass
that drafts straight through because the shape "is mostly the same" has skipped
the only check that the shape changed at all.
