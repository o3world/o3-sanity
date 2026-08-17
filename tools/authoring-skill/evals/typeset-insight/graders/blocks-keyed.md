---
type: regex
pattern: '(?<!"_key"\s*:\s*"[^"]*",\s*)"_type"\s*:\s*"(block|figure|pullQuote)"(?![^{}]{0,240}"_key")'
flags: s
match: not_contains
target: { source: file, path: piece.json }
---

The same rule one level up: every member of the `body` array is keyed, blocks
and inline objects alike. This is the grader that fails when a run keys the
spans it was thinking about and leaves the containers to the Lake.
