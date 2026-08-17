---
type: regex
pattern: '"pieceId"\s*:\s*"[a-z0-9.-]+"'
flags: s
target: { source: file, path: dataset/brief-eval-typeset-insight.json }
---

The brief's half of the link. Without it a later session reading the brief cannot
find the document it produced, and writes a second one.
