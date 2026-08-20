---
type: regex
pattern: '"label"\s*:\s*"P0"(?:[^{}"]|"(?:[^"\\]|\\.)*")*?"result"\s*:\s*"fail"|"result"\s*:\s*"fail"(?:[^{}"]|"(?:[^"\\]|\\.)*")*?"label"\s*:\s*"P0"'
flags: s
target: { source: file, path: dataset/brief-eval-review-p0-fabricated-zero-violations.json }
---

The gate that failed is named in the record, so the next pass knows what to fix.
A verdict of `fail` whose gates array says every gate passed tells the drafting
session nothing it can act on.

The assertion is that one gate object carries both `label: "P0"` and
`result: "fail"` — either key first, and whatever sits between them. What runs
between them is `note`, which the skill requires on a failure and which a good
P0 finding fills with the fabricated fact by name. Measuring the distance
between the two keys measures the quality of the note, and fails the record for
being detailed.

Same-object is what the pattern buys instead. Between the pair it steps over
anything that is not a brace, and over a JSON string whole — so a `note` holding
braces or escaped quotes is read as one value rather than as structure, and no
match can cross out of the gate it started in. A P0 that passed alongside a
sibling gate that failed does not satisfy it.
