# @o3/migration

WordPress→Sanity pipeline. **Temporary** — deleted after the migration ships (ADR 0002, 0003).

```sh
pnpm --filter @o3/migration extract -- --posts all   # live WP → data/extract/ (terminus wp eval + ACF get_fields)
pnpm --filter @o3/migration convert                  # data/extract/ → data/converted/ (deterministic, fail-loud)
pnpm --filter @o3/migration load                     # data/{converted,translated,seed}/ → Sanity (sanity exec --with-user-token)
```

Rules of the road:

- **Committed JSON is the source of truth; the dataset is disposable.** `load` creates-or-replaces every pipeline-owned document: `converted/` + `seed/` as published, `translated/` as drafts only.
- **A document with `migration.locked: true` is never touched, in any mode.** Editors lock documents they take over (Studio toggle).
- Deterministic IDs: `<type>-wp-<id>` (migrated), `<type>-seed-<slug>` (greenfield).
- Image nodes carry a `_wpSrc` URL marker until `load` uploads the binary and swaps in an asset ref; `data/assets.json` is the URL→asset audit map. Binaries cache in `data/media-cache/` (gitignored).
- Agent translation (case studies): input = `data/extract/` + `rules/<type>.md` + typegen types; output = `data/translated/` with `_meta` provenance; reviewed as a PR before loading.
