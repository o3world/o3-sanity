---
type: regex
pattern: '(?<!"_key"\s*:\s*"[^"]*",\s*)"_type"\s*:\s*"(heroSection|layoutSection|railPanelsSection|ctaSection|panel|richText|figure)"(?![^{}]{0,240}"_key")'
flags: s
match: not_contains
target: { source: file, path: piece.json }
---

Every array member the run wrote carries a `_key` it authored — bands, panels
and the base blocks inside a band alike. The Content Lake mints none on create
and one on the next write, so an unkeyed band is a band the next patch cannot
address.
