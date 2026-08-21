---
type: regex
pattern: '\(pullQuote\)(?:\\n)+>'
target: { source: file, path: dataset/brief-eval-draft-insight-body-design-system-v2.json }
---

A 1,200-word body reaches for at least one pull quote, and `labels.md` says what
one looks like: the label on a line of its own, then one `>` blockquote holding a
sentence lifted from the prose. Both halves are asserted here, because the label
without the blockquote is a direction typeset has nothing to carry out.

The v2 scenario run is why this grader exists. It found the turn and lifted from
it correctly, then reported that "on placement, count, and whether a pull quote
should duplicate prose verbatim or paraphrase it, nothing steered me at all". The
answers are now in `argument.md`; this checks that a body still arrives with one.
