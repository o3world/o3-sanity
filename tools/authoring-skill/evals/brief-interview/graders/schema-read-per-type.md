---
type: tool_used
tool: mcp__sanity__get_schema
input_match: '"type"\s*:\s*"insight"'
min: 1
---

The required-fields list is read off the type, not recalled. `get_schema` with a
type returns the field definitions and their descriptions — `author` carries the
note that 232 of 272 migrated articles have no byline, which is the difference
between recommending an empty slot and apologising for one. Without the type
argument the call returns type names and no fields at all.
