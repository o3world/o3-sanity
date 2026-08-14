# sanity: Presentation drops every union type it resolves below the first array

**Target:** `sanity-io/sanity` · **Affects:** `sanity@6.8.0` (checked against the
installed package; the code is unchanged from earlier 6.x) · **Status:** unfiled

---

## Summary

Presentation answers `visual-editing/schema-union-types` with a GROQ projection
whose result it keeps only when it is a string. For any path that passes through
more than one array, the projection returns a **one-element array** instead, so
every nested answer is silently discarded and `@sanity/visual-editing` gets an
empty map for those paths.

The visible effect in a consumer is that the overlay cannot resolve a field
inside a polymorphic array nested in another array — `ElementOverlay` ends up
with an undefined resolver context, custom overlay components are never called,
and nothing is logged.

## Where

`packages/sanity/src/presentation/overlays/schema/PostMessageSchema.tsx`

```ts
// line 80 — the projection
const projection = arr.map((path, i) => `"${i}": ${path}[0]._type`).join(',')

// line 97 — the guard that drops the nested answers
const mapped = arr
  .map((path, i) => (typeof result?.[i] === 'string' ? { path: path, type: result[i] } : null))
  .filter((item) => item !== null)
```

The trailing `[0]` unwraps exactly one level. When `path` itself starts with an
array filter, the expression is already an array of arrays, so `[0]` removes the
outer level and `._type` maps over what is left.

## Reproduction

A `page` document with a `sections` array whose members include a `layoutSection`
that has its own array of mixed block types. Run the projection Presentation
builds, for a depth-1 path and a depth-2 path side by side:

```groq
*[_id == "page-seed-about"][0]{
  "0": sections[_key=="culture"][0]._type,
  "1": sections[_key=="culture"].items[_key=="culture-photo"][0]._type
}
```

Actual result:

```json
{
  "0": "layoutSection",
  "1": ["figure"]
}
```

`"0"` passes the `typeof === 'string'` guard and is sent. `"1"` is an array, so
it is dropped — even though the type resolved perfectly well.

## Expected

Both entries reach the consumer as `"layoutSection"` and `"figure"`.

## Suggested fix

The comment above the guard explains what it is for — dropping `null` entries
for paths that do not resolve — and that intent is right. The array case is not
one of those; it is a resolved answer in a shape the projection did not
anticipate. Unwrapping before the check is depth-agnostic and keeps the `null`
behaviour:

```ts
const unwrap = (value: unknown): unknown => (Array.isArray(value) ? unwrap(value[0]) : value)

const mapped = arr
  .map((path, i) => {
    const type = unwrap(result?.[i])
    return typeof type === 'string' ? { path, type } : null
  })
  .filter((item) => item !== null)
```

Fixing the projection instead would mean knowing how many array filters the path
contains and appending that many `[0]`s, which is more work for the same answer.

## Note for whoever picks this up

This is one of a pair. Fixing it alone changes nothing observable, because
`@sanity/visual-editing@5.7.3` looks the answer up under a key that does not
match the one it requested — see the sibling report,
`visual-editing-nested-union-lookup.md`.
