---
type: regex
pattern: '(?<!"_key"\s*:\s*"[^"]*",\s*)"_type"\s*:\s*"span"(?![^{}]{0,240}"_key")'
flags: s
match: not_contains
target: { source: file, path: piece.json }
---

Every span carries a `_key` the run authored. The Content Lake mints none on
create and then mints one on the next write, derived from that revision — so an
unkeyed span is unaddressable until something names it a value nobody could have
predicted, and the copy in the run's context is stale for exactly those items.
