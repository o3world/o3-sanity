# engine-seam

`data/roster.json` is the engine/product boundary, decided in #285: one row per
workspace, each labelled with what it is.

Two things read it. The #284 spec takes its prose answer to "what is the
engine" from here. The purity seam test (#287, `src/purity.test.ts`, in the
`unit` project of `pnpm test`) imports it and enforces it: for every row
labelled `engine`, no app imports, no product-model imports, and brand facts
arrive as parameters.

## What the test checks

Four scans, each derived from the roster and the repo rather than listed:

- **Imports.** Every engine module's specifiers — static, re-export, dynamic,
  `require` — resolved through the workspaces' exports maps and the roster's
  overrides. A resolved target labelled `product-shared` or `product-brand`
  (apps are rows too, so app imports are the same failure) fails unless a
  ledger entry names the importing file. Type-only imports count: a type the
  content model generates is a brand fact.
- **Dependencies.** An engine workspace's `package.json` may not declare a
  product workspace under `dependencies` unless a ledger entry names
  `package.json` and the package. `devDependencies` stay out — they are the
  test harness, not what extraction would take.
- **Brand tokens.** The colour vocabulary both token packages declare —
  custom properties, their utility classes, their hex values — may not appear
  in engine code. `white`/`black` are excluded (they paint the same in any
  host), and only colour and gradient roles are derived, so a value-shaped
  leak outside that vocabulary (a derived tint, a type-scale class) is ledger
  material the scanner cannot find on its own.
- **The ledger burns down.** An entry whose files are gone, or that neither
  permits a detected violation nor still matches its parenthetical hint in
  the file, fails the suite until it is removed.

Tests and stories are out of scope on both sides: they are not what
extraction would take, and the suite's own fixtures import product code on
purpose. A ledger entry permits leaks per file — the module it names, nothing
finer — which is the same granularity the roster's rows use.

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
do too. A new workspace must add its row: the test fails on any directory
under `apps/`, `packages/` or `tools/` the roster does not name — this one
included.

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
