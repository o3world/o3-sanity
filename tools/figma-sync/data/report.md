# Figma sync

- Ran: 2026-08-13T21:59:04.740Z
- File version: 2386937043801380426
- Short-circuited: no

## Changed component sets

- **Button (2026-08 rebuild)** → `packages/ui/src/components/filter-chip.tsx#FilterChip` — added `2134:1785`

## Assets

### Locked conflicts

Source changed, asset locked — **reconcile by hand**. Nothing was written.
A conflict is re-reported every run until the manifest entry changes.

- `tools/migration/data/seed/assets/partner-caron.png` — `1883:3430` is new to the baseline (nothing had hashed it before). First seen 2026-08-13T21:59:04.740Z. Locked: Replaces the prototype-derived wordmark with the fill original from the partners strip (`1883:3429`) - a different lockup, carrying the "Transformational Care" line the old file did not. Alpha-trimmed. Locked because of that.
- `tools/migration/data/seed/assets/partner-hireheroes.png` — `1875:3332` is new to the baseline (nothing had hashed it before). First seen 2026-08-13T21:59:04.740Z. Locked: New partner with the 2026-08 restructure (#89). Fill original from the partners strip (`1875:3331`), alpha-trimmed. Locked because of the trim.
- `tools/migration/data/seed/assets/partner-ironman.png` — `1875:3335` is new to the baseline (nothing had hashed it before). First seen 2026-08-13T21:59:04.740Z. Locked: Replaces the prototype-derived 600x240 raster with the fill original from the partners strip (`1875:3334`). The uploaded file is a 3840x2160 canvas that is mostly transparent margin, which Figma cover-crops into the tile; the committed copy is alpha-trimmed and downscaled to 1200px instead, so `object-fit` never has to. Locked because of that edit.
- `tools/migration/data/seed/assets/partner-lacolombe.png` — `2250:1484` is new to the baseline (nothing had hashed it before). First seen 2026-08-13T21:59:04.740Z. Locked: Replaces the prototype-derived navy raster with the fill original from the partners strip (`2082:3954`), which the frame draws in black. Alpha-trimmed; already small (512x99), so not downscaled. Locked because of the trim.
- `tools/migration/data/seed/assets/partner-vertex.png` — `1864:2396` is new to the baseline (nothing had hashed it before). First seen 2026-08-13T21:59:04.740Z. Locked: Downloaded fill original from the partners strip (`1864:2390` -> `1864:2395`), then ALPHA-TRIMMED to its bounding box and downscaled to 1200px wide, hence locked. The frame gives every mark a 152px box and lets its natural height fall out at 28-42px, which only works if the file carries no margin of its own.
