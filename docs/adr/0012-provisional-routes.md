# 0012. A route with no document carries the provisional marker itself

- **Status:** Accepted
- **Date:** 2026-08-02
- **Deciders:** NickO3 + Claude
- **Related:** [issue #49](https://github.com/o3world/o3-sanity/issues/49), [issue #40](https://github.com/o3world/o3-sanity/issues/40), [issue #33](https://github.com/o3world/o3-sanity/issues/33), [issue #48](https://github.com/o3world/o3-sanity/issues/48), [ADR 0007](./0007-content-sourcing-and-provenance.md), [ADR 0006](./0006-responsive-contract.md)

## Context

ADR 0007 put the coverage-gap marker on documents: `migration.provisional` plus
a required `provisionalNote`, listed by `verify` on every run, gated by #48 —
**no document may still be provisional at launch**.

`/perspectives` is the largest coverage gap on map #33 and the marker does not
reach it. Two facts collide:

1. **No canonical frame draws the index.** #34 checked the whole file; the only
   artefact is `1065:4601`, a Wireframes-canvas capture of the retired HTML
   prototype, which is generation-1 reference. Meanwhile the route is a
   top-level nav destination with **272 migrated articles** behind it.
2. **A collection index has no backing document.** CONTEXT.md names this as the
   one route kind that breaks the document-per-URL assumption — the entry is a
   query plus static SEO, so there is nothing in Studio to edit and nothing for
   the pipeline to own.

So the page that most needs the marker is the one page the marker cannot be
attached to. And the gap is invisible: `verify` is green, the route resolves,
and the only record that its composition was guessed is a comment.

The ticket also asked whether to **build provisional now** or **commission a
frame first**, and block on it.

## Decision

### Build provisional now

The map's coverage rule — seed from Figma-derived blocks and mark provisional —
applies, and #48's gate ("every top-level link resolves") needs the link to
work. Commissioning a frame is not foreclosed by building: this route's entire
composition is two files, and a frame changes those two files and nothing else.
Blocking would leave a nav item pointing at nothing for however long a frame
takes.

That this is a primary nav destination is an argument for **commissioning the
frame anyway**, not for withholding the page while nobody can read the archive.

### The marker moves to the route entry

`IndexEntry` gains an optional `migration: RouteProvenance` — `provisional`,
`provisionalNote`, `figmaNode` — under the **same field names and the same
rules** as the document object. The note is required whenever the flag is set,
for ADR 0007's reason: "no frame was ever drawn" and "waiting on #22" call for
opposite actions.

The route entry is the right home because it is the thing that exists. A
collection index's identity is its entry: the query, the page size, the SEO, the
renderer. Provenance is one more fact about that route, and it sits beside the
composition it describes rather than in a document invented to hold it.

**`/work` carries `figmaNode: '1634:1167'` in the same field.** The difference
between the two collection indexes is then a value rather than an absence, and
"no frame" reads as a finding instead of an oversight.

### Enforcement is a test, not `verify`

`verify` runs inside `@o3/migration`, which does not depend on `@o3/web`, and it
checks the dataset against the committed JSON. A route composition appears in
neither, so `verify` structurally cannot see this. The rules therefore live in
`apps/web/src/content/documents/provisionalRoutes.render.test.tsx`, applying
`seed.test.ts`'s rules to route entries, plus one that documents cannot break:
**`figmaNode` and `provisional` are mutually exclusive.**

`docs/content-sourcing.md` carries both inventories, and #48's gate reads it.

## Alternatives considered

### Give `/perspectives` a backing document just to hold the marker

- **Pros:** one mechanism, one place to look, `verify` lists it for free, and the hero copy becomes editable in Studio — the cost #43 named when it made `/work` a route.
- **Cons:** CONTEXT.md defines the collection index as the route kind with no document, and #43 decided both indexes work this way so the next person is not guessing which. Adding a document to carry a flag reverses a decision on grounds that have nothing to do with why it was made — and the document would be a shell whose only real field is a note about a missing frame.
- **Why not:** the marker should follow the thing being marked. Inventing content to hold metadata is the wrong direction.

### Teach `verify` about routes

- **Pros:** one report, one command, one launch checklist. `verify` is already where a human looks for provisional content.
- **Cons:** it would make the migration pipeline — explicitly temporary, deleted post-migration (ADR 0002/0003) — depend on the web app, so that removing the pipeline would take the route check with it. It would also mean parsing or importing route entries from a package that has no reason to know they exist.
- **Why not:** the dependency runs the wrong way, and it expires.

### Record it in `docs/content-sourcing.md` only

- **Pros:** zero code, and the doc is already the human-facing inventory #48 reads.
- **Cons:** ADR 0007 chose mechanical enforcement over convention for exactly this class — the audit that found `chop` unflagged is what motivated it. A prose row is the state that audit was cleaning up.
- **Why not:** a marker nothing checks is a comment.

### Commission a frame and block the ticket

- **Pros:** the most-trafficked template after the homepage would be designed rather than assembled, and nothing provisional would ship.
- **Cons:** the nav link stays broken meanwhile, #48 cannot pass, and the 272 migrated articles stay unreachable except by direct URL. The provisional build costs two files to replace.
- **Why not:** the two are not exclusive. Build now, commission anyway.

## Consequences

- `IndexEntry` gains one optional field. Additive — `/work` and `/perspectives`
  are the only two entries, and neither route file changes.
- **`docs/content-sourcing.md` now has two provisional inventories**, documents
  and routes, and #48's gate covers both.
- `/perspectives` ships with three elements that trace to nothing, named in
  `PerspectiveIndexView`'s doc comment rather than left implicit: the hero
  standfirst, the stacked-row gap above 402, and the pager. Everything else is
  read off `1634:1181`, `1683:2467`, `1924:5388` and `1814:1738`.
- **No category filter.** 11 categories migrated and no frame draws a filter UI
  of any kind. Building one would invent a control, which working agreement 3
  declines; a commissioned frame is the natural place to settle it.
- The mechanism generalises to any future route whose composition is code —
  which is every collection index, and any dedicated route that follows `/work`.
