---
type: regex
pattern: '"_type"\s*:\s*"panel"'
match: 'count:3'
target: { source: file, path: piece.json }
---

A label's parts name the repeated elements, so three parts are three array
members. This is the count a converter left to infer from paragraph breaks gets
wrong, and it is why the parts are written down at all.
