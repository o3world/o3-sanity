---
type: regex
pattern: '(?=[\s\S]*"_type"\s*:\s*"richText")(?=[\s\S]*"_type"\s*:\s*"figure")'
target: { source: file, path: piece.json }
---

`(layoutSection: …) richText, figure` names two parts, so the band holds two
members. The figure has no asset behind it and is still a part of the band the
human approved — a required field nobody can fill is a gap, and a gap is
recorded, never resolved by deleting the passage that asked for it.
