# engine-seam

`data/roster.json` is the engine/product boundary, decided in #285: one row per
workspace, each labelled with what it is.

Two things read it. The #284 spec takes its prose answer to "what is the
engine" from here. The purity seam test (#287) imports it and enforces it: for
every row labelled `engine`, no app imports, no product-model imports, and
brand facts arrive as parameters.

The roster decides the boundary only. Moving code across it is separate work,
and ADR 0028's trigger still governs it: extract when a second consumer
imports, not because a row says `engine`.

## Verdicts

- `engine`: extractable and brand-free. A future unrelated Sanity project
  could take it.
- `product-shared`: these two brands' content model and components, rendered
  by both sites.
- `product-brand`: one brand's alone.

## Rules

**Every workspace has a row**, and the two non-workspace `tools/` directories
do too. A new workspace must add its row. #287 fails on a
workspace the roster does not name. When this directory becomes a workspace, it
adds its own row.

**`engine` states intent, not the current state.** A row keeps the label while
it still leaks, and lists each leak under `impurities`: where, what, and the
shape of the fix. The test permits the listed leaks and fails on new ones, so
the ledger burns down instead of blocking the label.

**Rows are modules, not symbols.** An import checker cannot separate two
symbols in one file, so the finest row is a file. A file that holds machinery
and product in one module gets a `fused` entry that names the split line: for
example `packages/sanity/src/schemas/blocks/registry.ts`, where the roster
functions are machinery and the block lists they close over are product. Each
`fused` entry is the map for a later parameterization ticket.

**`overrides` re-label a path inside a workspace.** The workspace row carries
the default. An override carries the exception, such as
`tools/migration/src/core/state.ts` as `engine` inside a `product-shared`
tool.
