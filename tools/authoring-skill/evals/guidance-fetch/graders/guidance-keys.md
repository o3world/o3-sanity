---
type: regex
pattern: 'o3-(argument|brand|composition|slop|visual|voice)'
flags: g
match: count:6
target: { source: file, path: guidance.json }
---

Six guidance documents, each named once in the artifact. The count is exact
because the prompt asks for the result verbatim with only `key` and `title`
projected: a seventh match means the run reshaped what it wrote, and a fifth
means the corpus lost a document.
