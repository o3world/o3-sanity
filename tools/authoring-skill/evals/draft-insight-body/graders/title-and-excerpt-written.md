---
type: regex
pattern: '"excerpt"\s*:\s*"(?:[^"\\]|\\.){40,}"'
target: { source: file, path: dataset/brief-eval-draft-insight-body-design-system-v2.json }
---

`excerpt` exists on no other field of a brief, so its presence is the whole
proof the `draft` object was written as an object and not as one long string of
markdown. It is also the only place the piece names who should keep reading.
