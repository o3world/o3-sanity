---
type: tool_order
before: mcp__sanity__query_documents
after: mcp__sanity__patch_documents
---

The revision passed to a patch is one that was read, not one carried over from
an earlier turn. A guard set from a stale `_rev` fails every call and looks like
a broken tool.
