# Figma sync

- Ran: 2026-09-18T19:23:36.349Z
- File version: 2400651570114415896
- Short-circuited: no

## Changed frames

- **Home** (mobile) → `/` — modified `1814:1618`
- **Work index** (desktop) → `/work` — modified `1634:1167`
- **Work index** (mobile) → `/work` — modified `1906:851`
- **Case Study detail** (desktop) → `/work/{slug}` — modified `1710:2300`
- **Insight detail** (desktop) → `/insights/{slug}` — modified `1710:2823`
- **Insight detail** (mobile) → `/insights/{slug}` — modified `1906:1046`
- **Solutions** (desktop) → `/solutions` — modified `1925:6138`
- **Software Engineering service page** (desktop) → `/solutions/software-engineering` — modified `2360:2879`
- **Sanity partnership** (desktop) → `/partners/sanity` — modified `2354:2446`
- **Live** (desktop) → `/live` — modified `1644:1889`
- **Live** (mobile) → `/live` — modified `1906:334`
- **Contact** (desktop) → `/contact` — modified `2960:7557`
- **Contact** (mobile) → `/contact` — modified `2975:10037`
- **Insight index** (mobile) → `/insights` — modified `2975:8499`
- **Home** (desktop) → `/` — removed `1680:2134`
- **Case Study detail** (mobile) → `/work/{slug}` — removed `1906:928`
- **About** (desktop) → `/about` — removed `1924:5344`
- **Insight index** (desktop) → `/insights` — removed `2336:4310`
- **Sanity partnership** (mobile) → `/partners/sanity` — removed `2975:9343`
- **About** (mobile) → `/about` — removed `2975:8865`

## Changed component sets

- **Button (2026-08 rebuild)** → `packages/ui/src/components/ui/button.tsx#Button` — modified `2134:1785`
- **Icon (2026-08 set)** → `packages/ui/src/components/button-icons.tsx#BUTTON_ICONS` — modified `2177:1556`
- **NavBar** → `packages/content-ui/src/chrome/SiteNav.tsx#SiteNav` — modified `3271:17013`
- **Footer** → `packages/content-ui/src/chrome/SiteFooter.tsx#SiteFooter` — modified `1280:1885`
- **Interior Hero** → `packages/ui/src/components/collection-hero.tsx#CollectionHero` — modified `2107:1051`
- **Blog** → `packages/content-ui/src/blocks/section/insightsCarouselSection/InsightsCarouselSection.tsx#InsightsCarouselSection` — modified `2205:1146`
- **Services** → `packages/content-ui/src/blocks/section/railPanelsSection/PanelTrack.tsx#PanelTrack` — modified `2846:5637`
- **Case Study Card** → `apps/web/src/components/cards/CaseStudyCard.tsx#CaseStudyCard` — modified `2089:4169`
- **Quote** → `packages/content-ui/src/blocks/section/quoteSection/QuoteSection.tsx#QuoteSection` — modified `2748:4672`
- **Utility Nav** → `packages/content-ui/src/chrome/UtilityNav.tsx#UtilityNav` — removed `2250:1445`
- **Case study cards** → no code target — removed `1393:3025`
- **CTA** → `packages/content-ui/src/blocks/section/ctaSection/CtaSection.tsx#CtaSection` — removed `2177:1354`

## Assets

### Regenerated

Overwritten in place — the git diff is the review surface.

- `tools/migration/data/seed/assets/live-healthcare.png` — re-exported from `1751:2010` (imageFill, node-changed)

### Locked conflicts

Source changed, asset locked — **reconcile by hand**. Nothing was written.
A conflict is re-reported every run until the manifest entry changes.

- `tools/migration/data/seed/assets/live-fintech.png` — `1751:2003` changed. First seen 2026-09-18T19:23:36.349Z. Locked: Live `1644:1889` → Case studies → Frame 2611303. Exact **and hand-cropped**: the committed 527×544 is a pixel-identical (0.0) sub-rectangle of the node's 791×544 fill original `8470357ff8cd…` at x=132, y=0 — the exact horizontal centre. Locked: a re-export from this node yields the full 791×544 and would silently undo the crop.
- `tools/migration/data/seed/assets/live-saas.png` — `1899:4421` changed. First seen 2026-09-18T19:23:36.349Z. Locked: Live `1644:1889` → Case studies → Frame 2611306. Exact **and hand-cropped**: pixel-identical (0.0) sub-rectangle of the node's 791×544 fill original `4e6c2f5434a4…` at x=1, y=0. Locked for the same reason as `live-fintech.png`.

### Failures

Nothing was written and no baseline hash was recorded — the next run retries.

- `tools/migration/data/seed/assets/about-beyond-1682.png` (`1928:6501`) — source node 1928:6501 (image 21) not found in the file
- `tools/migration/data/seed/assets/about-beyond-community.png` (`2960:7144`) — source node 2960:7144 (image 22) not found in the file
- `tools/migration/data/seed/assets/about-beyond-o3xo.png` (`2960:7142`) — source node 2960:7142 (image 21) not found in the file
- `tools/migration/data/seed/assets/about-portrait-gadsby.png` (`2032:577`) — source node 2032:577 (image 22) not found in the file
- `tools/migration/data/seed/assets/partner-caron.png` (`1883:3430`) — source node 1883:3430 (image 19) not found in the file
- `tools/migration/data/seed/assets/partner-hireheroes.png` (`1875:3332`) — source node 1875:3332 (image 16) not found in the file
- `tools/migration/data/seed/assets/partner-ironman.png` (`1875:3335`) — source node 1875:3335 (image 15) not found in the file
- `tools/migration/data/seed/assets/partner-lacolombe.png` (`2250:1484`) — source node 2250:1484 (image 23) not found in the file
- `tools/migration/data/seed/assets/partner-vertex.png` (`1864:2396`) — source node 1864:2396 (image 13) not found in the file
- `tools/migration/data/seed/assets/solutions-overview-1682.png` (`2360:2871`) — source node 2360:2871 (O3_1682Conference_PelProductions-1582 (1) 1) not found in the file
- `tools/migration/data/seed/assets/utility-1682.png` (`3183:2961`) — source node 3183:2961 (1682) not found in the file
- `tools/migration/data/seed/assets/utility-o3xo.png` (`3269:13421`) — source node 3269:13421 (image 21) not found in the file

## Errors

- section 1632:1510 not found — its untracked-node probe was skipped
- 1680:2134 (Home, desktop) not found in the file
- 1906:928 (Case Study detail, mobile) not found in the file
- 1924:5344 (About, desktop) not found in the file
- 2336:4310 (Insight index, desktop) not found in the file
- 2250:1445 (Utility Nav, componentSet) not found in the file
- 1393:3025 (Case study cards, componentSet) not found in the file
- 2177:1354 (CTA, componentSet) not found in the file
- 2975:9343 (Sanity partnership, mobile) not found in the file
- 2975:8865 (About, mobile) not found in the file
