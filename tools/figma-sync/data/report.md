# Figma sync

- Ran: 2026-08-24T14:38:46.091Z
- File version: 2391303393400685627
- Short-circuited: no

## Changed frames

- **Home** (mobile) → `/` — modified `1814:1618`
- **Work index** (mobile) → `/work` — modified `1906:851`

## Untracked frames

In the Design Concept section, not in the manifest. Each one is a decision:
canonical → add it to `tracked-nodes.json`; noise → add it to `ignoredNodeIds`.

- **Insights - Mobile** (402w) — `2975:8499`
- **Insights - Mobile** (402w) — `2975:10037`
- **Insights - Mobile** (402w) — `2975:9343`
- **About  - Mobile** (402w) — `2975:8865`
- **Contact** (1440w) — `2960:7557`

## Assets

### Locked conflicts

Source changed, asset locked — **reconcile by hand**. Nothing was written.
A conflict is re-reported every run until the manifest entry changes.

- `tools/migration/data/seed/assets/solutions-overview-1682.png` — `2360:2871` is new to the baseline (nothing had hashed it before). **still open** since 2026-08-24T14:37:08.523Z. Locked: Software-engineering service page `2360:2879` → Intro section `2360:2861` → the photo rectangle `2360:2871` (imageRef `594350a88ec7874bdc8ad4c2a8f36e3c35f2b60b`). Not exact, and LOCKED so a re-export cannot clobber the hand work: the API render comes back 4:3, so the committed file is the 1.5× render trimmed to the rectangle's own 3:2 and resampled to 1600×1066 — the width `Figure` actually requests. A fresh export would need the same trim and resample.
- `tools/migration/data/seed/assets/partner-caron.png` — `1883:3430` is new to the baseline (nothing had hashed it before). **still open** since 2026-08-13T21:59:04.740Z. Locked: Replaces the prototype-derived wordmark with the fill original from the partners strip (`1883:3429`) - a different lockup, carrying the "Transformational Care" line the old file did not. Alpha-trimmed. Locked because of that.
- `tools/migration/data/seed/assets/partner-hireheroes.png` — `1875:3332` is new to the baseline (nothing had hashed it before). **still open** since 2026-08-13T21:59:04.740Z. Locked: New partner with the 2026-08 restructure (#89). Fill original from the partners strip (`1875:3331`), alpha-trimmed. Locked because of the trim.
- `tools/migration/data/seed/assets/partner-ironman.png` — `1875:3335` is new to the baseline (nothing had hashed it before). **still open** since 2026-08-13T21:59:04.740Z. Locked: Replaces the prototype-derived 600x240 raster with the fill original from the partners strip (`1875:3334`). The uploaded file is a 3840x2160 canvas that is mostly transparent margin, which Figma cover-crops into the tile; the committed copy is alpha-trimmed and downscaled to 1200px instead, so `object-fit` never has to. Locked because of that edit.
- `tools/migration/data/seed/assets/partner-lacolombe.png` — `2250:1484` is new to the baseline (nothing had hashed it before). **still open** since 2026-08-13T21:59:04.740Z. Locked: Replaces the prototype-derived navy raster with the fill original from the partners strip (`2082:3954`), which the frame draws in black. Alpha-trimmed; already small (512x99), so not downscaled. Locked because of the trim.
- `tools/migration/data/seed/assets/partner-vertex.png` — `1864:2396` is new to the baseline (nothing had hashed it before). **still open** since 2026-08-13T21:59:04.740Z. Locked: Downloaded fill original from the partners strip (`1864:2390` -> `1864:2395`), then ALPHA-TRIMMED to its bounding box and downscaled to 1200px wide, hence locked. The frame gives every mark a 152px box and lets its natural height fall out at 28-42px, which only works if the file carries no margin of its own.

### Failures

Nothing was written and no baseline hash was recorded — the next run retries.

- `tools/migration/data/seed/assets/about-beyond-community.png` (`1928:6505`) — source node 1928:6505 (image 21) not found in the file
- `tools/migration/data/seed/assets/about-beyond-o3xo.png` (`1928:6511`) — source node 1928:6511 (image 21) not found in the file
- `tools/migration/data/seed/assets/about-culture-team.png` (`1927:6432`) — source node 1927:6432 (Frame 2611349) not found in the file
