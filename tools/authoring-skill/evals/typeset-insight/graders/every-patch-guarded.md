---
type: tool_used
tool: mcp__sanity__patch_documents
input_match: '^(?![\s\S]*ifRevisionId)'
min: 0
max: 0
---

Zero patches sent without the revision guard. The guard is what turns a
concurrent edit from a silent clobber into a failed call, and a run that sets it
on one patch and not the next has the check on the write it happened to think
about.
