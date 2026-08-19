# O3XO components → code

The o3xo half of the component→code map. [`docs/figma-components.md`](./figma-components.md) is
O3's; this is the same document for **`G6M2gu5qKFvhGxwj3W365b`** — _O3XO: UI kit_, which ADR 0028's
second addendum makes o3xo.ai's design source of record.

Read [`docs/agents/figma.md`](./agents/figma.md) before opening the file.

Every node id below is also carried, verified, in
[`tools/figma-sync/data/tracked-nodes-o3xo.json`](../tools/figma-sync/data/tracked-nodes-o3xo.json) —
the machine-readable half of this document (#242). `pnpm figma:sync --brand o3xo` hashes each node
and tells you which one changed and what code it routes to. **Edit both halves together**: a row
added here without a manifest entry is a node nothing is watching.

## What this document is for

**Cite it.** A component ticket for o3xo names the frame and the node id it builds against, and this
is where both come from. The ids were read from the file on 2026-08-19 and every one was verified
against the API as the node and name written here.

## The rule, and where it stops

**One Figma variant axis → one `cva` variants key** (ADR 0008), the same as O3's. Two things make it
bite less here.

- **Much of the kit is an HTML import of the live Framer site.** Frame names are `div.framer-1j6puxo`
  and `1e4Lt5px3pRGJLXB5fC4gqt68M.png`; variant axes are unnamed (`Property 1`); and no set draws a
  hover, focus or disabled state. It records what o3xo.ai **is**, which is what the migration has to
  match — but it is a weak source of design intent. Where the kit is silent, the live rendering wins
  and interaction states are invented from O3XO's tokens (#237).
- **Several axes are content, not shape.** `Case Study Cards` varies by client name and `People
Cards` by person; the set records six or four instances of one anatomy. Those never become `cva`
  keys.

`State=Hover` is still never a variant, and icons are still inline SVG rather than a font (ADR 0009).

## The kit is a kit — it designs no pages

O3's file has canonical **page frames** with routes. This one has none: sixteen watched canvases of
library nodes, plus a Layouts canvas carrying the thirteen **page bands** the site composes from. So
every entry in the manifest is `kind: "componentSet"` — the lane that means "a library node, not a
page" — and an o3xo sync report's `changedFrames` is always empty.

Three canvases are **not** watched and are not in this document: `Templates (Old)`, `Archive` and
`Asset Dump`. `Cover` and the divider canvases hold nothing.

## Where the classification comes from

#224's 2026-08-19 inventory ran all 32 sets against the code and reported the headline:
**8 already align, 9 need variant or field work, 4 diverge structurally** (Key Metric Card, Case
Study Cards, Navigation, Footer), **6 are missing** (the Phosphor glyphs and Card Icon, Yellow Text
Card, Header Pill, FAQ Accordion, the pattern rasters), **10 are out of scope**.

The four structural divergences, the six missing and the out-of-scope group are named on that ticket
and are named in the Status column below. **The per-set split between "aligns" and "needs variant or
field work" is not on the ticket** — the comment preserved the counts, not the assignments. Rather
than invent it, the Status column says what is true of the code today, and #224's narrowed
page-by-page parity audit is what settles the rest.

Six additive schema changes fall out of the inventory and are #237's, not this document's:
background media on section blocks (landed, #239), `feature.icon`, `person.bio`, a pill eyebrow on
`quoteSection`, a new `faqSection`, and background video on `heroSection`.

## Styles — the four token canvases

| Figma frame         | Node        | Canvas                   | Code target                                           | Status                                                                       |
| ------------------- | ----------- | ------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| `Typography`        | `727:1108`  | `↳ Typography` `462:833` | `packages/tailwind-config-o3xo/tokens/typography.css` | ✅ #238 — the ramp and the breakpoints came off this frame                   |
| `Typography` (sic)  | `4214:2933` | `↳ Color` `4214:2932`    | `packages/tailwind-config-o3xo/tokens/color.css`      | ✅ All 13 swatches mapped. The frame is mislabelled — the canvas is Color    |
| `Spacing variables` | `4214:3419` | `↳ Layouts` `4214:3418`  | `packages/tailwind-config-o3xo/tokens/layout.css`     | Unaudited                                                                    |
| `Layout`            | `4214:3605` | `↳ Layouts` `4214:3418`  | `packages/tailwind-config-o3xo/tokens/layout.css`     | ✅ #238 — breakpoints                                                        |
| `Grids`             | `4214:3643` | `↳ Layouts` `4214:3418`  | `packages/tailwind-config-o3xo/tokens/layout.css`     | Unaudited                                                                    |
| `Effects`           | `4214:3911` | `↳ Effects` `4214:3910`  | **None**                                              | ✅ Closed as done — a Tailwind shadow cheat sheet with no brand value (#224) |

## Website Components — the library

### Buttons (`287:1505`)

| Figma node           | Node        | Variant axes                                     | Code target                                           | Status                                                             |
| -------------------- | ----------- | ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------ |
| `Button`             | `4405:6386` | unnamed: `Property 1` = Solid \| Red CTA \| Link | `Button` (`ui/src/components/ui/button.tsx`)          | Geometry and colour behaviour are their own ticket (#237 story 10) |
| `Button / White CTA` | `4405:6387` | — (a bare `COMPONENT`)                           | `Button` (same)                                       | The fill the set does not draw                                     |
| `Button / Icons`     | `4405:6391` | unnamed: Arrow ×2 (Black \| White), Link         | `BUTTON_ICONS` (`ui/src/components/button-icons.tsx`) | Inline SVG, never a font (ADR 0009)                                |

### Icons (`345:2833`)

| Figma node                  | Node        | Variant axes             | Code target                                     | Status                                                 |
| --------------------------- | ----------- | ------------------------ | ----------------------------------------------- | ------------------------------------------------------ |
| `Phosphor Icons`            | `4404:5589` | 18 named Phosphor glyphs | **None**                                        | ❌ Missing — one of #224's six. #237 story 6           |
| `Card Icon`                 | `4404:5590` | —                        | **None**                                        | ❌ Missing — the plated 48px icon the icon cards carry |
| `X Icons`                   | `4404:5593` | Logo Black \| Logo White | `O3xoMark` (`apps/o3xo/src/brand/O3xoMark.tsx`) | ✅ #228 — the same component draws the wordmark        |
| `.building block Icon_text` | `957:1166`  | prop: Material Symbols   | **None**                                        | The same placeholder O3's file carries. ADR 0009       |

Two swatch boards sit beside these — `Light` (`4404:5646`) and `Dark` (`4432:10748`) — plus Figma's
own `Get started` onboarding frame (`2222:1539`). All three are on the manifest's ignore list.

### Cards (`340:1577`)

The densest canvas in the kit, and where three of #237's card stories live.

| Figma node               | Node         | Variant axes             | Code target                               | Status                                                                                                                              |
| ------------------------ | ------------ | ------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `Insight Card`           | `4404:3708`  | —                        | `InsightCard` (`content-ui/src/cards/`)   | Built                                                                                                                               |
| `Insight Card Group`     | `4404:3773`  | —                        | `ListingSection`                          | Built                                                                                                                               |
| `Icon Card`              | `4404:3810`  | —                        | `FeatureGridSection`                      | Needs `feature.icon` (#237)                                                                                                         |
| `Icon Card Group`        | `4404:3907`  | —                        | `FeatureGridSection`                      | With its card                                                                                                                       |
| `Action Icon Card`       | `4404:3811`  | —                        | `FeatureGridSection`                      | The icon card with a link affordance. The split is the component ticket's                                                           |
| `Action Icon Card Group` | `4404:3873`  | —                        | `FeatureGridSection`                      | With its card                                                                                                                       |
| `Key Metric Card`        | `4404:3916`  | —                        | `Stat` (`ui/src/components/stat.tsx`)     | ⚠️ **Diverges structurally** (#224). Yellow plate vs rule-and-number; `accent` is a brand-only role the shared package may not name |
| `Key Metric Card Group`  | `4404:3960`  | —                        | `StatGroup`                               | With its card                                                                                                                       |
| `Yellow Text Card`       | `4404:3934`  | —                        | **None**                                  | ❌ Missing — one of #224's six                                                                                                      |
| `Yellow Text Card Group` | `4404:4611`  | —                        | **None**                                  | Missing with its card                                                                                                               |
| `Case Study Cards`       | `4404:3072`  | 6 client names (content) | `CaseStudyCard` (`content-ui/src/cards/`) | ⚠️ **Diverges structurally** (#224)                                                                                                 |
| `Case Study Group`       | `4404:3398`  | —                        | `CaseShowcaseSection`                     | Built                                                                                                                               |
| `Strategy Card`          | `4404:4555`  | —                        | **None**                                  | A full-width copy row. #224's parity audit says whether it earns a block                                                            |
| `Strategy Card Group`    | `4404:4593`  | —                        | **None**                                  | With its card                                                                                                                       |
| `Insight Images`         | `4404:3706`  | 6 named rasters          | **None**                                  | Imagery, not component. Out of scope (#224)                                                                                         |
| `Insight Image Layouts`  | `4426:10608` | 5 crops                  | **None**                                  | Out of scope with them                                                                                                              |

Not tracked, on the ignore list with their reasons: `Galaxy Background 2` (`4485:972`), `image 1`
(`4487:1088`) and the `Slide Card Components` section (`4438:12632`) — the last is deck-slide work,
4041×3309, that no site renders.

### Logos (`4212:229`)

| Figma set | Node       | Variant axes                                                                              | Code target                                     | Status                                |
| --------- | ---------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| `O3XO`    | `4212:374` | Color = 2 color \| White \| Black; Layout = Horizontal \| Stacked; Background = Yes \| No | `O3xoMark` (`apps/o3xo/src/brand/O3xoMark.tsx`) | ✅ #228 — the mark comes from the app |

**The kit contradicts itself on the 2-colour mark**: unplated variants fill the XO near-black, the
plated one fills it `accent`. #228 built the plated reading. The contradiction is Nick's to settle,
not an agent's to resolve (#237).

### Navigation (`4404:3961`)

| Figma node     | Node        | Code target                             | Status                                                                                 |
| -------------- | ----------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| `Navigation`   | `4404:4146` | `SiteNav` (`content-ui/src/chrome/`)    | ⚠️ **Diverges structurally** (#224) — the kit's nav has dropdowns, the pill does not   |
| `Footer`       | `4404:4148` | `SiteFooter` (`content-ui/src/chrome/`) | ⚠️ **Diverges structurally** (#224)                                                    |
| `Footer CTA`   | `4404:4147` | `CtaSection`                            | The kit draws the closing CTA into the footer; the content model composes it as a band |
| `Footer Block` | `4404:4188` | `SiteFooter`                            | CTA and footer stacked — the whole end of the page                                     |

Chrome forks per app when this work is picked up, not preemptively. The `brandMark` slot (#228) is
the shared chrome's contract for as long as a brand uses it.

### People (`4404:5648`), Quotes (`4404:4189`), Accordion (`310:1977`)

| Figma node                        | Node         | Variant axes       | Code target         | Status                                                                  |
| --------------------------------- | ------------ | ------------------ | ------------------- | ----------------------------------------------------------------------- |
| `People Cards`                    | `4404:5726`  | 4 people (content) | `PersonGridSection` | Needs `person.bio` (#237)                                               |
| `Quote Block`                     | `4404:4920`  | —                  | `QuoteSection`      | Built                                                                   |
| `Header Pill`                     | `4414:8100`  | —                  | **None**            | ❌ Missing — one of #224's six. #237 story 7                            |
| `Slide Quote`                     | `4438:12259` | —                  | **None**            | A deck slide component. Out of scope (#224)                             |
| `AI Implementation FAQ Accordion` | `4404:4919`  | —                  | `FaqSection` (o3xo) | Built (#248). Drawn closed only; the open state is invented from tokens |

`Quote Section` (`4404:5107`) is the quote band drawn twice; the Layouts copy (`4406:6954`) is the
one tracked.

### Events (`4404:4612`), Pagination (`347:35854`), Images (`4404:5727`)

| Figma node      | Node        | Code target                          | Status                                                           |
| --------------- | ----------- | ------------------------------------ | ---------------------------------------------------------------- |
| `Event Section` | `4404:4613` | **None**                             | A band with no counterpart. #224's parity audit says if it stays |
| `Numbers`       | `4404:1821` | `Pager` (`content-ui/src/Pager.tsx`) | ✅ #241 — numbered pages with prev/next                          |
| `Imagery`       | `4405:6311` | **None**                             | ❌ The pattern rasters — one of #224's six. Cited, not hashed    |

`Light Mode` (`464:3862`) is the pagination study that predates `Numbers`; it is on the ignore list.
`Imagery` is a 6612×1977 section, so the manifest names it and deliberately does not hash it.

## Layouts (`4406:6446`) — the thirteen page bands

The kit's composition, one frame per band. **Seven sit on a full-bleed photograph** (#224), which
was the single missing affordance blocking six of them; `backgroundMedia` landed with #239.

| Figma frame              | Node         | Code target           | Status                                                                                |
| ------------------------ | ------------ | --------------------- | ------------------------------------------------------------------------------------- |
| `Hero`                   | `4406:6595`  | `HeroSection`         | Photograph under a tint. Background media landed (#239); video is #237's              |
| `AI Strategy + Partner`  | `4406:6642`  | **None**              | Two-column text. The parity audit assigns it                                          |
| `AI Expertise`           | `4406:6755`  | **None**              | Icon cards on a photograph. Candidate: `FeatureGridSection` + `backgroundMedia`       |
| `Quote`                  | `4406:6954`  | `QuoteSection`        | Wants the header pill as its eyebrow (#237)                                           |
| `Text Cards`             | `4406:7179`  | **None**              | Blocked on the Yellow Text Card                                                       |
| `People`                 | `4406:7226`  | `PersonGridSection`   | Wants `person.bio`                                                                    |
| `FAQ`                    | `4406:7288`  | `FaqSection` (o3xo)   | Built (#248) — the accordion on its photograph, through `backgroundMedia`             |
| `Action Cards`           | `4406:7491`  | **None**              | Action icon cards on a cityscape. Candidate: `FeatureGridSection` + `backgroundMedia` |
| `3 Cards`                | `4406:7560`  | **None**              | Three icon cards, flat. Candidate: `FeatureGridSection`                               |
| `Insight Gallery`        | `4406:7594`  | `ListingSection`      | Built                                                                                 |
| `Case Studies`           | `4407:7758`  | `CaseShowcaseSection` | Built                                                                                 |
| `Section` (824h, 1920w)  | `4432:11535` | **None**              | Untriaged. Two frames here are drawn at 1920 rather than 1440                         |
| `Section` (1090h, 1920w) | `4432:11487` | **None**              | Untriaged, with the other                                                             |

A "candidate" is an inference from the band's contents, not a recorded decision — the component
ticket confirms or replaces it.
