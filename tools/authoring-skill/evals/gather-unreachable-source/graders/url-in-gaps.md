---
type: regex
pattern: '"gaps"\s*:\s*\[[^\]]*o3-193-unreachable-source'
target: { source: file, path: dataset/brief-eval-unreachable-fintech-checkout.json }
---

The published teardown Nick pointed at returns 404. An unreachable pointer
becomes a gap naming the pointer, so the next session knows a source was meant
to exist here. The failure this catches is the silent skip: a run that tries the
URL, gets nothing, and writes a brief that reads as though the pointer was never
given.
