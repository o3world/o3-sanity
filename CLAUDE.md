# Claude Code notes

@AGENTS.md

## Code comments are not component history

A doc comment states what is true now and the constraint the code cannot show.
Provenance is welcome as one line — the frame/node a value was measured from —
but the story of the value is not: no ticket-by-ticket narration of what the
old value was, which ticket changed it, which ticket left it alone, or why the
previous number existed. That history lives in git blame and the issues;
in a comment it goes stale the day it merges and buries the one line the next
reader needs.
