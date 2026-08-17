---
type: regex
pattern: '"links"\s*:\s*\[\s*"https?://'
target: { source: file, path: dataset/brief-eval-gather-gate-answer-engines.json }
---

Every URL the run touched lands in `links`, Nick's and the ones the sweep found.
Nick pasted one outright, so an empty array is a run that read a source and did
not write down where it came from — and `links` is where a fact-checker looks.
