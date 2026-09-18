# Figma re-architecture: exploratory findings

Found by `pnpm figma:sync` on 2026-09-18T19:23:36.349Z, file version
`2400651570114415896` (previous baseline: `2383642339965845360`).

The design file was not edited. It was re-architected. It has been renamed
(`O3DX: Visual exploration` → **🅾️ 2026 O3DX Website**), the section the
pipeline watches was deleted, and several pages were rebuilt as new nodes.

**Nothing is committed.** `tools/figma-sync/data/{baseline,report,report.md}.json`
are dirty and staying that way until the manifest is repaired. Committing the
baseline now records all nine missing nodes as resolved, and the next run goes
quiet about them.

## 1. The pipeline cannot see the file any more

Fix this before triaging any design change. The run that produced this document
was partially blind.

### The untracked-frame probe was skipped

`manifest.sectionNodeIds` is `['1632:1510']` — the Design Concept section. That
section no longer exists. `sync.ts` pushed an error and continued, so
`untrackedFrames: []` in the report means "we did not look", not "nothing new".

Page frames now sit directly on a canvas, **Designs `1126:1100`** (22 children).
A page id answers the probe call correctly — verified against
`/v1/files/:key/nodes?ids=1126:1100&depth=1`, which returns `type=CANVAS`. So
the fix is re-pointing `sectionNodeIds`, not new code.

### Nine tracked ids no longer resolve

| Manifest entry                 | Node        | Status                                            |
| ------------------------------ | ----------- | ------------------------------------------------- |
| Home, desktop                  | `1680:2134` | → **Homepage** `3720:60473`, rebuilt              |
| About, desktop                 | `1924:5344` | → **About** `3754:78274`                          |
| About, mobile                  | `2975:8865` | → **About (Mobile)** `3883:16493`                 |
| Insight index, desktop         | `2336:4310` | → **Insights** `3739:71101`                       |
| Case Study detail, mobile      | `1906:928`  | deleted, no replacement on any page               |
| Sanity partnership, mobile     | `2975:9343` | deleted, no replacement on any page               |
| Utility Nav, componentSet      | `2250:1445` | likely → **Brand Navigation** `3726:68984`        |
| CTA, componentSet              | `2177:1354` | likely → **Combined CTA + Footer** `3720:62476`   |
| Case study cards, componentSet | `1393:3025` | superseded by tracked `2089:4169`; drop the entry |

The last two rows are inference from name and role, not confirmed by reading
both subtrees. Confirm before writing them into the manifest.

### Twelve asset exports fail on dead source nodes

Every one is a manifest entry pointing at a layer the file no longer has — the
machinery is wrong, not the design. No design ticket belongs on top of these.

```
about-beyond-1682.png        ← 1928:6501
about-beyond-community.png   ← 2960:7144
about-beyond-o3xo.png        ← 2960:7142
about-portrait-gadsby.png    ← 2032:577
partner-caron.png            ← 1883:3430
partner-hireheroes.png       ← 1875:3332
partner-ironman.png          ← 1875:3335
partner-lacolombe.png        ← 2250:1484
partner-vertex.png           ← 1864:2396
solutions-overview-1682.png  ← 2360:2871
utility-1682.png             ← 3183:2961
utility-o3xo.png             ← 3269:13421
```

Two locked-asset conflicts also carry over, both `node-changed`:
`live-fintech.png` (`1751:2003`) and `live-saas.png` (`1899:4421`). Check for
existing tickets before filing — these have been reported by previous runs.

One asset re-exported, `live-healthcare.png` (`1751:2010`), and the rewrite was
byte-identical; `git status` shows no change to it.

## 2. Tokens: the palette is stable

Variable **names** remain unreadable on this seat — `/variables/local` returns
403 (`requires file_variables:read`) and the file publishes zero styles. Values
below come from walking `boundVariables` across the rebuilt frames and the
component sections, the same route the 2026-08 conversion used.

Every heavily-bound value still resolves to a colour already committed in
`packages/tailwind-config/tokens/color.css`:

```
#eb1000  #c90e00  #0a0a0b  #f1f0ec  #f7f7f6  #ffffff
#76746f  #55524e  #aaa69e  #d6d3cc  #e5e3de  #000000
```

**A token value update would be close to a no-op.** This change is structural,
not chromatic.

### Six values are new

Not a repalette — a ramp being filled in. A red scale and two neutrals, none of
them present anywhere in `packages/tailwind-config/tokens/` or `packages/*/src`:

| Value     | Bindings | Reading                                                   |
| --------- | -------- | --------------------------------------------------------- |
| `#a80b00` | 2        | red, one step below `--color-brand-deep`                  |
| `#ff958c` | 3 + 8    | red tint; also carried by `2050:1203` on Partner (Sanity) |
| `#ffe0dd` | 2        | red tint                                                  |
| `#fff1f0` | 2        | red tint, palest                                          |
| `#171615` | 2 + 44   | neutral between `--color-ink` and `--color-fg`            |
| `#393633` | 2 + 4    | neutral                                                   |

Most are bound twice each, inside the Atoms swatch row — definition chips rather
than usage. The two neutrals also carry real usage through older ids
(`2050:1231`, `2050:1229`).

### A fourth variable generation is mid-migration

Alongside the `1065:*` (old), `2050:*`/`2083:*` and `2457–2461:*` collections
there is now a fourth:

- `3837:68xx` and `3858:79xx` — colour. `3837:6880` already carries 65 real
  bindings, `3837:6891` 34, `3837:6885` 29.
- `3700:484xx` — font size and line height.
- `3720:61894` / `3720:61895` — `fontFamily`, newly bound as variables.
- `4030:48114` — a `paddingTop` variable, the only `4xxx` id in use.

Old and new ids currently resolve to the same hexes, which is why nothing looks
broken. Per the established reading, the newest collection is the direction of
travel and the older ones are stragglers.

## 3. What actually changed in the design

Twenty frames and twelve component sets moved. The structural story:

### The component library became a design system

`🧩 Local Components` is now organised into four named sections, and holds sets
nobody tracks:

- **Atoms** `3720:62477` — Button `2134:1785`, Icon `2177:1556`, plus untracked
  **Icon Button** `2134:1724` and **Link** `2225:2894`
- **Molecules** `3720:62479` — **Standard Content Lockup** `3720:62493`,
  **Case Study Content Lockup** `3858:8308`, both untracked
- **Components** `3726:68554` — Case Study Card `2089:4169`, Main Navigation
  (Desktop) `3271:17013`, plus untracked **Main Navigation (Mobile)**
  `3737:69217`, **Brand Navigation** `3726:68984`, **Blog Post Card**
  `3269:12839`, **Employee Card** `3767:80011`, **Business Card** `3813:93877`
- **Sections** `3726:68560` — Interior Hero `2107:1051`, Blog `2205:1146`,
  Quote `2748:4672`, plus untracked **Combined CTA + Footer** `3720:62476` and
  **Blog Hero** `3394:11412`

A new page, **🛝 Prototype Components** `3589:4428`, holds a second NavBar set
`3589:4743` and four `Dot Circle` sets. Unclear whether it is canonical.

### The homepage was rebuilt

`Homepage` `3720:60473`, 1440×10394, composed of Hero, Section - Partners,
Section - Case Studies, Section, Quote, **Brand Family**, Blog, Combined CTA +
Footer, Brand Navigation and Main Navigation (Desktop). It now carries two
navigation instances and a CTA/footer that are single components rather than
separate sets. "Brand Family" has no obvious counterpart in code.

### Fourteen frames modified in place

Home (mobile), Work index (both), Case Study detail (desktop), Insight detail
(both), Solutions, Software Engineering, Sanity partnership (desktop), Live
(both), Contact (both), Insight index (mobile). None of these has been opened
and attributed yet — that is phase 3.

## 4. Open questions

None of these is decided, and none should be decided without Nick.

1. **Mobile coverage.** Case Study detail mobile and Partner mobile were deleted
   with no replacement, but About (Mobile) was rebuilt. Deliberate narrowing, or
   dropped? Decides whether the entries are removed or filed as gaps.
2. **Solutions vs Services.** `Solutions` `1925:6138` is a real page (1440×5468:
   Hero, two Sections, Combined CTA + Footer, Main Navigation). The new
   `Services` `2960:7022` is 1440×903 with one child named `div` — it reads as a
   paste, not a page. Recommend ruling it noise and adding it to
   `ignoredNodeIds` with that reason.
3. **404.** New `404` `3754:73927` and `404 (Mobile)` `3754:73809`. Recommend
   tracking both; there is no `/404` design today.
4. **Phase order.** Recommend: repair the manifest first (re-point nine ids,
   swap `sectionNodeIds` to `1126:1100`, fix twelve asset sources), re-run, then
   triage the rebuilt Homepage and the new component sets. Filing design tickets
   from this run would mean filing them from a run that could not see the file.

## Provenance

- File key `RvraLJaZ0zWm8UaD5AJf43`
- Report: `tools/figma-sync/data/report.json` (uncommitted)
- Manifest: `tools/figma-sync/data/tracked-nodes.json`
- Asset provenance: `tools/figma-sync/data/asset-manifest.json`
