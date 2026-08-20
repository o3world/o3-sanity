---
type: llm
criteria: The run put questions to Nick in at most two batched rounds, plus at most one list of schema fields to nod at. Every question in those rounds carried the agent's own recommended answer, so Nick could reply by nodding rather than composing. A third batch of interview questions, or questions dribbled out one at a time across many turns, fails. One bounded clarifying question — naming an answer Nick already gave, answerable in a word — is round two finishing rather than a round of its own, and does not fail this.
target: trace
---

The mechanical graders see the round labels; they cannot see whether the
questions were actually batched behind them, or whether each one arrived with a
recommendation. That is the judgement this grader carries.

The required-fields list is not a round. It is a list read off the schema with a
recommendation against each line, and it exists so the human nods once instead
of answering five more questions.
