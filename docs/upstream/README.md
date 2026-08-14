# Upstream bug reports

Defects we traced in a dependency, written up here **before** they are filed.
Two reasons the drafts live in the repo: filing on someone else's tracker is a
human's call, not an agent's, and the trace is worth keeping whether or not the
report is ever sent — it is the evidence behind a decision we made here.

| Draft                                                                              | Package                        | Status      |
| ---------------------------------------------------------------------------------- | ------------------------------ | ----------- |
| [`sanity-nested-union-projection.md`](./sanity-nested-union-projection.md)         | `sanity@6.8.0`                 | **Unfiled** |
| [`visual-editing-nested-union-lookup.md`](./visual-editing-nested-union-lookup.md) | `@sanity/visual-editing@5.7.3` | **Unfiled** |

Both are halves of one symptom, and **either fix alone changes nothing** — the
answer Studio drops is the answer the overlay would look up under the wrong key.
File them together, or file one and say so in the other. [ADR
0022](../adr/0022-the-layout-column-stays-polymorphic.md) is the decision they
sit behind; the trace they come from is [spike
#104](https://github.com/o3world/o3-sanity/issues/104).

When one is filed, replace **Unfiled** with the issue link rather than deleting
the draft.
