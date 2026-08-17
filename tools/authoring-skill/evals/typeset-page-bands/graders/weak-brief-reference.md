---
type: regex
pattern: '(?=[\s\S]*"_ref"\s*:\s*"brief-eval-typeset-page-bands")(?=[\s\S]*"_weak"\s*:\s*true)'
target: { source: file, path: piece.json }
---

The page points back at the brief it was built from, weakly and at the published
id. Weak is why provenance never publish-blocks the content it belongs to.
