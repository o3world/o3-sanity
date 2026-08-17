---
type: regex
pattern: '(?=[\s\S]*"stage"\s*:\s*"handed-off")(?=[\s\S]*"pieceId"\s*:\s*"[a-z0-9.-]+")'
target: { source: file, path: dataset/brief-eval-typeset-page-bands.json }
---

The pipeline ends here, and the brief carries the id of what it produced. A
brief left at `review` sends the next session back through the gates on a
document that already exists; one with no `pieceId` sends it to build a second.
