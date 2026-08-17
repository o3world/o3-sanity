---
type: regex
pattern: '^BLOCKING: (true|false) \(.+\)$'
flags: m
match: contains
target: last_message
---

The verdict contract, and the whole reason review is a gate rather than an
opinion. One line, last, either value, a reason in parentheses. A run that
reports what it found in prose and never emits this line has produced something
no stage downstream can read — and stage 5 refuses to run without it.
