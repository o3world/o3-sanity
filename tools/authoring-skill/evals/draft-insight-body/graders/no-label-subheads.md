---
type: regex
pattern: '\\n#{2,3} (Introduction|Intro|Background|Overview|Conclusion|Summary|Key [Tt]akeaways|Takeaways|Final [Tt]houghts|Next [Ss]teps|The [Cc]hallenge|The [Ss]olution|The [Rr]esults?)\\n'
match: not_contains
target: { source: file, path: dataset/brief-eval-draft-insight-body-design-system-v2.json }
---

A subhead states; it does not label. Read in a row the subheads should be the
argument's spine, and a reader who skims only those should know what the piece
claims. "Introduction / Background / Conclusion" tells them the filing structure
instead — the table of contents the front-door rule already refuses, one level
down.

Counted rather than assumed: twenty-six headings in the migrated archive are one
of these words and nothing else, and none of the three insights written for this
site has one.
