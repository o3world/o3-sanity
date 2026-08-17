---
type: regex
pattern: '"current"\s*:\s*"services/design-system-handover"'
flags: s
target: { source: file, path: piece.json }
---

A multi-segment slug carries its URL prefix, and Priya named the route. A page
slugged from its title alone lands at the wrong address and the card that points
at it goes nowhere.
