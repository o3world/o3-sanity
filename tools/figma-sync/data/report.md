# Figma sync

- Ran: 2026-08-04T03:36:18.480Z
- File version: 2383642339965845360
- Short-circuited: no

No changes to any tracked node.

## Untracked frames

In the Design Concept section, not in the manifest. Each one is a decision:
canonical → add it to `tracked-nodes.json`; noise → add it to `ignoredNodeIds`.

- **Contact** (1440w) — `2050:891`
- **Blog Post** (1440w) — `2117:800`
- **Blog Post** (1440w) — `2118:858`
- **Blog Post** (1440w) — `2118:909`
- **Blog Post** (1440w) — `2118:1068`
- **Blog Post** (1440w) — `2118:1015`

## Assets

### Regenerated

Overwritten in place — the git diff is the review surface.

- `tools/migration/data/seed/assets/about-beyond-1682.png` — re-exported from `1928:6501` (imageFill, new-to-baseline)
- `tools/migration/data/seed/assets/about-beyond-community.png` — re-exported from `1928:6505` (render, new-to-baseline)
- `tools/migration/data/seed/assets/about-beyond-o3xo.png` — re-exported from `1928:6511` (imageFill, new-to-baseline)
- `tools/migration/data/seed/assets/about-culture-team.png` — re-exported from `1927:6432` (render, new-to-baseline)
- `tools/migration/data/seed/assets/live-healthcare.png` — re-exported from `1751:2010` (imageFill, new-to-baseline)

### Locked conflicts

Source changed, asset locked — **reconcile by hand**. Nothing was written.

- `tools/migration/data/seed/assets/about-portrait-gadsby.png` — `2032:577` is new to the baseline (nothing had hashed it before). Locked: About `1924:5344` → Frame 2611346 `1925:5914` → Team Card. High, not exact, and **locked because the source moved**: the committed bytes hash to `652581511bdf545d62b32795182f824bea2f5257`, which is still in the file's image library (`/v1/files/:key/images`) but is referenced by no node any more. The fill this node carries today is the same portrait re-uploaded at 790×796 (mean absolute difference 3.05/255 against the committed 2500×2500 downscaled to match). Re-exporting would replace a 2500px original with a 790px one. Committed unwired — see #46: it is a flattened comp, not the cut-out `PortraitTile` needs. The same two fills sit on all six team cards (`2032:577`, `582`, `590`, `600`, `607`, `614`); this entry names the first.
- `tools/migration/data/seed/assets/live-fintech.png` — `1751:2003` is new to the baseline (nothing had hashed it before). Locked: Live `1644:1889` → Case studies → Frame 2611303. Exact **and hand-cropped**: the committed 527×544 is a pixel-identical (0.0) sub-rectangle of the node's 791×544 fill original `8470357ff8cd…` at x=132, y=0 — the exact horizontal centre. Locked: a re-export from this node yields the full 791×544 and would silently undo the crop.
- `tools/migration/data/seed/assets/live-saas.png` — `1899:4421` is new to the baseline (nothing had hashed it before). Locked: Live `1644:1889` → Case studies → Frame 2611306. Exact **and hand-cropped**: pixel-identical (0.0) sub-rectangle of the node's 791×544 fill original `4e6c2f5434a4…` at x=1, y=0. Locked for the same reason as `live-fintech.png`.
