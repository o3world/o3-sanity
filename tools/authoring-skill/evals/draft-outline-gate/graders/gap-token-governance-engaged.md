---
type: regex
pattern: '^GAP: (?=[^\n]*token[- ]governance)(?=[^\n]*engaged)[^\n]+'
flags: mi
target: last_message
---

`untouched` is not available for this gap on this brief, and the reason is
mechanical rather than a matter of taste: Q4 is locked, and Q4 asks how the
piece differs from the token-governance advice already published. A locked
question is a promise the brief made to the reader, so the gap is engaged
whatever the section list does — and a section that answers Q4 by saying nobody
has looked has engaged it twice over.

Both failing runs on [#203](https://github.com/o3world/o3-sanity/issues/203)
went exactly there: one wrote a "What this isn't" section declining the
comparison with `Requires: —`, the other dropped Q4 in the question map with the
three options laid out and the recommendation already made. Both then reported
`UNGROUNDED: none`, which was true of their own Requires lists and false of the
brief. Two lookaheads rather than one pattern so the assertion is order-free:
the line names the gap, and its disposition is `engaged`.
