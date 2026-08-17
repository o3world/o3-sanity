---
type: regex
pattern: '("|\\n)\([a-zA-Z]+Section.*("|\\n)\([a-zA-Z]+Section.*("|\\n)\([a-zA-Z]+Section.*("|\\n)\([a-zA-Z]+Section'
flags: s
target: { source: file, path: dataset/brief-eval-draft-page-bands-design-systems-practice.json }
---

Four bands is the floor `composition.md` sets, and every one of them is labelled
at the start of a line. A page body with prose between two labelled bands is
copy typeset has no block to put in.

The first label starts the body, so it opens the JSON string rather than
following a newline — both count as a line start.
