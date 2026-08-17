---
type: regex
pattern: '"stage"\s*:\s*"brief"'
target: { source: file, path: dataset/brief-eval-draft-outline-gate-design-system-v2.json }
---

`stage` names the stage that **finished**. Stage 3 stopped at its gate, so it
did not finish, and the field still says `brief`.
