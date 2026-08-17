---
type: regex
pattern: '"stage"\s*:\s*"gather"'
target: { source: file, path: dataset/brief-eval-unreachable-fintech-checkout.json }
---

A sweep that found almost nothing still finished. `stage` records the stage that
ran, not the stage that went well, and a resuming session reads it before
anything else.
