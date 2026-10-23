# Filing: the project board

Read by `figma-sync` step 4, once the issue exists and is linked to #33.

## Add the item, set two fields

Org **o3world**, project **5** (`PVT_kwDOAE6UPc4BfG9l`). Add the item, then set two fields:

```sh
ITEM=$(gh project item-add 5 --owner o3world --url <issue-url> --format json --jq .id)

# Track
gh project item-edit --id "$ITEM" --project-id PVT_kwDOAE6UPc4BfG9l \
  --field-id PVTSSF_lADOAE6UPc4BfG9lzhZcO3Q --single-select-option-id <track-option>

# Kind = task
gh project item-edit --id "$ITEM" --project-id PVT_kwDOAE6UPc4BfG9l \
  --field-id PVTSSF_lADOAE6UPc4BfG9lzhZcO3U --single-select-option-id c4e021dd
```

`item-add` on an issue already on the board returns the existing item, so it is safe to run
either way.

**Track** — pick by what the change touches, not by where it was spotted:

| Option        | Id         | For                                                                                   |
| ------------- | ---------- | ------------------------------------------------------------------------------------- |
| Page layer    | `debb6e8c` | a page frame changed: content, section layout, a route's composition                  |
| Design system | `efec90f4` | a component set or token changed: the shared UI, wherever it shows                    |
| Migration     | `ff81609b` | seed data or a seed asset needs regenerating/reconciling                              |
| Infra         | `a4b16e47` | the pipeline itself — a manifest pointing at a dead node, a persistent export failure |

**Kind** is always `task` (`c4e021dd`) for anything this skill files.

## ⚠️ Set values on items. Never touch the fields themselves.

`gh project item-edit --single-select-option-id` sets **one item's** value. That is the only
board write this skill makes.

**Never** edit a field's options — `gh project field-*`, or the `updateProjectV2Field`
GraphQL mutation. Saving a single-select field's options **wipes that field's value on every
item on the board**, silently, and there is no undo. If an option you want does not exist,
stop and ask the user; do not create it.
