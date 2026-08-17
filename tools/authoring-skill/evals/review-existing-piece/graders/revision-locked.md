---
type: tool_used
tool: mcp__sanity__patch_documents
input_match: 'ifRevisionId'
min: 1
---

The approvals were given against the text the review read. `ifRevisionId` is
what makes the patch fail rather than clobber when somebody edited the document
in Studio while the table was being read.
