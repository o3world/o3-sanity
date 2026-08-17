---
type: regex
pattern: '"seo"\s*:\s*\{'
flags: s
match: not_contains
target: { source: file, path: piece.json }
---

`seo` is the recurring example of a field nobody asked about and no gate reads.
It stays empty and goes on the hand-off list; filled from inference it is copy a
search engine shows and no human ever approved.
