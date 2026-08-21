---
type: regex
pattern: '^UNGROUNDED: \S'
flags: m
target: last_message
---

A rebuilt ledger is a ledger, so it reports its grounding check the same way:
one line per unmet concept, or `UNGROUNDED: none`. The slot is filled whatever
the check found, which is what keeps the gate line's ungrounded count attached
to something a human can read.
