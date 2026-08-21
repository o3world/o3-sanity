---
type: regex
pattern: '^UNGROUNDED: (?=[^\n]*token[- ]governance)[^\n]+'
flags: mi
target: last_message
---

An engaged gap reaches an `UNGROUNDED:` line, and this asserts that the
token-governance gap is the one that got there. Without it a run could
disposition the gap correctly in the `GAP:` block and then report only the
other gap — the money cost of the standing half-day — which satisfies
`ungrounded-flagged` while leaving Q4's collision exactly as unreported as
before.

The wording is safe to match on: the gap list, Q4 and all three runs on
[#203](https://github.com/o3world/o3-sanity/issues/203) name it as token
governance, and the `GAP:` slot asks for the gap in the brief's own words.
