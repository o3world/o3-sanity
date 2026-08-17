---
type: regex
pattern: '"background"\s*:\s*"(?:[^"\\]|\\.){400,}"'
target: { source: file, path: dataset/brief-eval-gather-gate-answer-engines.json }
---

`background` carries the sweep and the info dump, so it is long. Four hundred
characters is well under what Nick alone pasted: a document below it holds a
summary of the gathering rather than the gathering.
