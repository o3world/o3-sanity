# @sanity/visual-editing: the resolved-type lookup key does not match the key it asked for

**Target:** `sanity-io/visual-editing` · **Affects:**
`@sanity/visual-editing@5.7.3` · **Status:** unfiled

---

## Summary

`SchemaProvider` requests union types under a GROQ path built by
`popUnkeyedPathSegments`, and Studio keys its answer by that exact string. When
it later reads the answer back, it rebuilds the key with `prevPath.join('.')` —
which inserts a `.` before a keyed segment that the GROQ path does not have. At
the first union the two agree by accident (there is one segment to join). At any
union below that, they never agree, the lookup returns `undefined`, and the
field silently fails to resolve.

The user-visible effect is that a custom overlay component is never rendered for
anything inside a polymorphic array nested in another array. `getField` returns
`{field: undefined}` rather than throwing, so there is no console warning either.

## Where

`packages/visual-editing/src/ui/schema/SchemaProvider.tsx`

The **request** key, which is correct:

```ts
// line 41
function popUnkeyedPathSegments(path: string): string {
  return path
    .split('.')
    .toReversed()
    .reduce((acc, part) => {
      if (acc.length) return [part, ...acc]
      if (part.includes('[_key==')) return [part]
      return []
    }, [] as string[])
    .join('.')
}
```

The **lookup** key, which is not:

```ts
// line 226, inside fieldFromPath
} else if (schemaType.type === 'union') {
  const name = next.startsWith('[_key==')
    ? resolvedTypes
        ?.get((node as SanityNode).id)
        ?.get([prevPath.join('.'), next].filter(Boolean).join(''))
    : next
```

`prevPath` is built from `nodePath` (line 250), which splits a keyed segment away
from its field name:

```ts
const nodePath = node.path.split('.').flatMap((part) => {
  if (part.includes('[')) return part.split(/(\[.+\])/, 2)
  return [part]
})
```

## Reproduction

Element path: `sections[_key=="a"].items[_key=="b"]`, where `sections` is a
polymorphic array of blocks and `items` is a polymorphic array inside one of
them.

|                                                                                       | value                                                 |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `nodePath`                                                                            | `['sections', '[_key=="a"]', 'items', '[_key=="b"]']` |
| requested key                                                                         | `sections[_key=="a"].items[_key=="b"]`                |
| lookup key at the **outer** union — `prevPath = ['sections']`                         | `sections[_key=="a"]` ✅                              |
| lookup key at the **inner** union — `prevPath = ['sections', '[_key=="a"]', 'items']` | `sections.[_key=="a"].items[_key=="b"]` ❌            |

The inner key carries a `.` before `[_key=="a"]`. Nothing was ever stored under
it, so `name` is `undefined`, `schemaType.of.find(…)` matches nothing, and
`fieldFromPath(undefined, …)` returns `{field: undefined}` without throwing.

Because the outer union agrees by coincidence, the bug is invisible for the
common page-builder case (one array of blocks at the document root) and total
for anything one level deeper.

## Suggested fix

Rebuild the key the way the path was spelled: a keyed segment attaches to the
name before it, everything else is joined with a dot.

```ts
const groqPath = [...prevPath, next].reduce(
  (acc, part) => (part.startsWith('[') ? `${acc}${part}` : acc ? `${acc}.${part}` : part),
  '',
)

const name = next.startsWith('[_key==')
  ? resolvedTypes?.get((node as SanityNode).id)?.get(groqPath)
  : next
```

That reproduces `popUnkeyedPathSegments`' spelling for every depth, and is
identical to today's behaviour for the depth-1 case.

## Note for whoever picks this up

This is one of a pair. Fixing it alone changes nothing observable, because
`sanity@6.8.0` drops every nested answer before it is sent — the projection in
`PostMessageSchema.tsx` returns a one-element array below the first array filter
and the result is kept only when it is a string. See the sibling report,
`sanity-nested-union-projection.md`.
