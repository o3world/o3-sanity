---
type: llm
criteria: Every item on the gate's Found list names where it came from, inline — a URL for anything off the web, a Sanity document id for anything out of the corpus, a path for a file, or the human named as the source for what they said in the conversation. No found item is asserted with no origin at all.
focus: the Found list only. Judge the Missing and Unverifiable lists on nothing; they are lists of what has no source.
target: last_message
---

Attribution is what separates gathering from recall. A found item with no origin
is the model's memory wearing a finding's clothes, and the stage that reads this
list next has no way to tell them apart.

Pass where every found item names where it came from. Fail on any item asserted
bare, including one the run is confident about.

**A fact the human supplied is sourced**, and attributing it to them satisfies
this grader — CORE.md counts human-supplied and retrieved as the two legitimate
origins. Do not fail an item for carrying a person instead of a URL.
