---
type: regex
pattern: '(?=[\s\S]*"_type"\s*:\s*"heroSection")(?=[\s\S]*"_type"\s*:\s*"layoutSection")(?=[\s\S]*"_type"\s*:\s*"railPanelsSection")(?=[\s\S]*"_type"\s*:\s*"ctaSection")'
target: { source: file, path: piece.json }
---

Every label's name is the schema's own type name, so conversion is a lookup
rather than a judgement. The failure this catches is the whole page arriving as
one `layoutSection` of rich text — which renders, and is not the page anyone
approved.
