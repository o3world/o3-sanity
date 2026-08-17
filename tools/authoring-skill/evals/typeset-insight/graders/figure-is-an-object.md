---
type: regex
pattern: '"_type"\s*:\s*"figure"'
match: 'count:1'
target: { source: file, path: piece.json }
---

The `(figure)` label lands as a figure with its caption, even though no asset
exists to hang on it. A label with nothing behind it is a gap the human closes,
not a passage the conversion drops.
