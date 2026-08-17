---
type: regex
pattern: '\[\[[a-zA-Z]'
flags: s
match: not_contains
target: { source: file, path: reader-prompt.md }
---

Block labels are stage directions for stage 5, not words on a page. A reader
shown them is reading a document no visitor will ever see, and spends attention
on machinery instead of on the argument.
