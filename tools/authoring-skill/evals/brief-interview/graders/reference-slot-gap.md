---
type: regex
pattern: '"gaps"\s*:\s*\[(?:[^\]])*(byline|author|categor)'
flags: i
target: { source: file, path: dataset/brief-eval-brief-interview-theme-colour.json }
---

Nick has no byline and no categories. Both are reference slots — they point at a
`person` and at `category` documents somebody else owns — so they stay empty and
become gaps a human closes. A gap recorded is a slot the next session knows is
open; a slot filled from a recommendation is a name nobody agreed to attach to a
published piece.
