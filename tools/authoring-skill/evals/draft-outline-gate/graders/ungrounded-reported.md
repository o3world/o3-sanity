---
type: regex
pattern: '^UNGROUNDED: \S'
flags: m
target: last_message
---

The slot, filled — whatever the check found. `draft` reports the grounding
check on its own line every time, so `UNGROUNDED: none` and a named concept are
both legal output and silence is not. This grader is the format half and it
holds on every run of the case; `ungrounded-flagged` is the half that says the
answer on this brief is not `none`.

Splitting them is the point. A run that skips the check now fails a check on
the shape of its output rather than on a judgement about its content, and there
is nothing to talk itself past ([#203](https://github.com/o3world/o3-sanity/issues/203)).
