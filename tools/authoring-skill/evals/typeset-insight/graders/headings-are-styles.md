---
type: regex
pattern: '"style"\s*:\s*"h2"'
match: 'count:3'
target: { source: file, path: piece.json }
---

Three `##` headings become three blocks styled `h2` — the style `bodyText`
already has. A heading converted to a normal block with bold text renders as a
paragraph in a heavier font and is invisible to every reader who navigates by
structure.
