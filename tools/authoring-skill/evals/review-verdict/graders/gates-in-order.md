---
type: regex
pattern: '"structure"[\s\S]*"front door"[\s\S]*"revision"[\s\S]*"slop"[\s\S]*"reader test"'
flags: s
match: contains
target: { source: file, path: dataset/brief-eval-review-verdict-zero-violations.json }
---

Five gates, recorded in the order they run. The order is the design: structure
before sentences, because a piece with the wrong shape is not fixed by editing
sentences, and the reader test last because it runs on settled text. A gates
array in another order is a chain that ran in another order.
