---
type: tool_used
tool: mcp__sanity__query_documents
input_match: 'slug'
min: 1
---

The slug is checked against the dataset before the document is created. Two
documents on one slug is a routing defect a human finds by browsing, and
`create_documents` is the point of no return for it.
