# Claude Code notes

@AGENTS.md

## Code comments are not component history

A doc comment states what is true now and the constraint the code cannot show.
Provenance is welcome, and one line of it — the frame/node a value comes from —
is exactly the kind of thing a comment is for. But superseded is superseded:
when a value changes, the new source replaces the old trail. No narration of
what the old value was, which ticket changed it, which ticket left it alone,
or why the previous number existed. That history lives in git blame and the
issues; in a comment it buries the one line the next reader needs.
