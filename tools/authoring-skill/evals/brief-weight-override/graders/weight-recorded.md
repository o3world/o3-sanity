---
type: regex
pattern: '"decisions"\s*:\s*\[(?:[^\]])*standard'
flags: i
target: { source: file, path: dataset/brief-eval-brief-weight-override-sanity-partner.json }
---

The classification is a call the run made, so it lands in `decisions` with the
rest of them. A session resuming this piece in a week reads the weight off the
brief; one that has to re-derive it from the subject will re-derive `light`,
which is the answer Nick already overruled.
