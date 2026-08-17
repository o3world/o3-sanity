---
type: regex
pattern: '"_id"\s*:\s*"drafts\.'
flags: s
target: { source: file, path: piece.json }
---

What was created is a draft, read back as one. The id the run reports and the id
the dataset holds are the same claim only when the second is fetched.
