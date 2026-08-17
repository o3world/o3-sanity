---
type: regex
pattern: '"nextStep"\s*:\s*"(?:[^"\\]|\\.)*[Rr]eview'
target: { source: file, path: dataset/brief-eval-draft-insight-body-design-system-v2.json }
---

`nextStep` is written for the stage that has not started. Stage 4 is review, and
naming it is what lets a session opening this brief cold do the right thing
without reading the pipeline.
