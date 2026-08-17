---
type: regex
pattern: '(?=[\s\S]*"surface"\s*:\s*"bone")(?=[\s\S]*"surface"\s*:\s*"white")(?=[\s\S]*"layout"\s*:\s*"cards")(?=[\s\S]*"columns")'
target: { source: file, path: piece.json }
---

A knob in the label is a knob on the block. Surface rhythm was decided at the
outline rather than applied afterwards as styling, so a conversion that drops it
ships a page whose emphasis nobody chose.
