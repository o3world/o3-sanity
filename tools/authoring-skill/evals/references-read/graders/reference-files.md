---
type: regex
pattern: '"(argument|composition|style)\.md"'
flags: g
match: count:3
target: { source: file, path: references.json }
---

Three reference files, each named once in the artifact. The count is exact
because the prompt asks for one object per file with only `file` and `words` on
it: a fourth match means the run reshaped what it wrote, and a second means the
plugin lost a reference.
