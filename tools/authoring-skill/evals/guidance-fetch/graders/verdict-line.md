---
type: regex
pattern: '^BLOCKING: false \(.+\)$'
flags: m
match: contains
target: last_message
---

The verdict is the last line or it is not a verdict. A run that describes the
guidance as present in prose, without the machine-readable line, has produced
something no gate downstream can read.
