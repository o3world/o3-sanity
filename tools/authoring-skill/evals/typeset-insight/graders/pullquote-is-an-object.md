---
type: regex
pattern: '"_type"\s*:\s*"pullQuote"'
match: 'count:1'
target: { source: file, path: piece.json }
---

`(pullQuote)` names a member of `bodyText`'s closed inline set, so the label
lands as that object and not as a blockquote block that looks like one in
Studio. One, because the draft carries one.
