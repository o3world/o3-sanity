---
name: Guidance fetch
tags: [smoke]
plugins: ['../..']
runs: 1
max_turns: 8
timeout_seconds: 300
allowed_tools: [Write, mcp__sanity__query_documents]
model: sonnet
---

O3's authoring guidance lives in the Sanity dataset as `guidance` documents.
Every skill in this plugin reads it before writing a word, so a run that cannot
reach it produces guesswork in the house voice.

Check that the guidance is reachable and complete:

1. Query project `naorcr6k`, dataset `development`, for
   `*[_type == "guidance"]{key, title}`. Ask for 100 documents, the query
   tool's maximum — it returns 10 by default, and a corpus that outgrows that
   truncates into a missing key rather than an error.
2. Write what came back to `guidance.json` in your working directory: a JSON
   array of one `{"key": …, "title": …}` object per document, in the order the
   query returned them. Only those two fields, and no wrapper — the tool's own
   count and totals are not part of the result.
3. Report the keys you found, one per line.
4. End your reply with a machine-readable last line, and nothing after it:

   ```
   BLOCKING: false (<reason>)
   ```

   `false` if all six of `o3-argument`, `o3-brand`, `o3-composition`, `o3-slop`,
   `o3-visual` and `o3-voice` came back. `BLOCKING: true (<reason>)` if any is
   missing, naming which.

This run reads and never writes. Create no document, patch no document, publish
nothing, and never address the `production` dataset.
