---
type: regex
pattern: '"readerQuestions"\s*:\s*\[\s*"In one sentence, what is this arguing\?"(?:\s*,\s*"(?:[^"\\]|\\.)+"){4}\s*\]'
target: { source: file, path: dataset/brief-eval-brief-interview-theme-colour.json }
---

Five questions, question one fixed and first. The review stage tests the draft
against this array in order, so the fixed opener is the one question every piece
answers and the four after it are what this piece agreed to be tested on.

Four or six is not a rounding error: it is a set nobody locked.
