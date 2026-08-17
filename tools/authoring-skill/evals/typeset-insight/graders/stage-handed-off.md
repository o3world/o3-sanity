---
type: regex
pattern: '"stage"\s*:\s*"handed-off"'
flags: s
target: { source: file, path: dataset/brief-eval-typeset-insight.json }
---

The pipeline ends here and the piece is the human's. A brief left at `review`
sends the next session back through the gates on a document that already exists.
