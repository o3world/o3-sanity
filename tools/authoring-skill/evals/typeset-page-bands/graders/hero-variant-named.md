---
type: regex
pattern: '"variant"\s*:\s*"band"'
flags: s
target: { source: file, path: piece.json }
---

The one knob whose schema default is wrong here. `heroSection` defaults to the
home page's variant, so an interior page that stays silent gets the home page's
hero — the label names it, and a conversion that reads the label sets it.
