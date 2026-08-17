---
type: regex
pattern: '"stage"\s*:\s*"draft"'
target: { source: file, path: dataset/brief-eval-draft-insight-body-design-system-v2.json }
---

Stage 3 finished, so `stage` says so. A resuming session reads this field before
anything else, and a brief holding a body under `stage: brief` sends the next
session back to write the interview it already has.
