---
type: regex
pattern: '^Previous arc: [^\n]*[Cc]oncede, then reframe[^\n]*[—–:-][^\n]*\S'
flags: m
target: last_message
---

**The decision this grader records ([#203](https://github.com/o3world/o3-sanity/issues/203)):
a re-derived identical arc passes; a carried-over one fails.**

Reshape exists so that a second draft is a different shape rather than the same
paragraphs reordered, and that is a claim about the section list and the
grounding ledger — which `different-shape` reads. The arc is a named family of
moves and the corpus has three of them, so a derivation run fresh against the
moved thesis may honestly land on the one the previous pass used. The grader
this replaced hardcoded a negative lookahead against the previous arc's name,
which scored a rename as a pass and an honest re-derivation as a fail.

So what is asserted is the evidence that the derivation happened: the proposal
carries the previous arc on its own `Previous arc:` line and says which way it
went — dropped, and what the moved thesis broke in it, or kept, and what the
fresh derivation still takes from it. The name alone is not enough; the line
carries a reason after it. Silence about the previous arc is the failure, not
agreement with it.
