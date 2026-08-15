# Figma components → code

The component half of map #33's committed mapping. Frames are
[`docs/figma-frames.md`](https://github.com/o3world/o3-sanity/blob/research/figma-frame-inventory/docs/figma-frames.md); this is every component set in
`RvraLJaZ0zWm8UaD5AJf43`, what it maps to, and what deliberately maps to nothing.

Read [`docs/agents/figma.md`](./agents/figma.md) before opening the file.

Every node id below is also carried, verified, in
[`tools/figma-sync/data/tracked-nodes.json`](../tools/figma-sync/data/tracked-nodes.json) — the
machine-readable half of this document (#79). `pnpm figma:sync` hashes each set and tells you which
one changed and what code it routes to. **Edit both halves together**: a row added here without a
manifest entry is a set nothing is watching.

## The rule

**One Figma variant axis → one `cva` variants key** (ADR 0008). Figma's value
name becomes the cva value, lowercased; `defaultVariants` equals Figma's
Default. A variant that exists only in code carries a comment saying why.

Two things that are _not_ variants:

- **`State=Hover`** is a CSS pseudo-class, never a cva variant. Figma has to
  draw hover as a separate component because it has no `:hover`; code does not.
  Every `State` axis below collapses to a `hover:` utility.
- **`Show right icon` / `Show left icon`** — the boolean props on `Button /
Solid` — become **props, not variants**. They toggle the presence of a child,
  not the appearance of the button, and cva variants exist to select classes.
  The existing `Button` already models this as `arrow?: boolean`.

## The Local Components canvas is not the library

⚠️ Worth knowing before you go looking. **`🧩 Local Components` (`1275:1586`)
holds exactly two things** — the `Go birds.` easter egg and the `Footer`
(canonical since 2026-08, see below).
The real component sets live on other canvases and are referenced across
generations, so **a low node id does not mean archived**: `Button / Ghost` is
`264:260` and still draws the ghost fill.

## Canonical — used by the Design Concept frames

Verified by direct reads of the canonical frames, or recorded in
`packages/ui/src/foundations/figma-home-spec.ts`.

| Figma set                       | Node        | Variant axes                                   | Code target                                                  | Status                                                                                            |
| ------------------------------- | ----------- | ---------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `Button` (the 2026-08 rebuild)  | `2134:1785` | Theme = Black \| White \| Red; State ×5        | `Button` (`ui/button.tsx`), `FilterChip` (`filter-chip.tsx`) | ✅ #150 — geometry below                                                                          |
| `Button / Ghost`                | `264:260`   | Size = Base; State = Default                   | `Button variant="ghost"`                                     | The one fill the 2026-08 set does not draw                                                        |
| `Button / Solid`                | `136:754`   | Size = Base \| Large; State = Default \| Hover | **Superseded** by `2134:1785`                                | Nothing follows it                                                                                |
| `Brand / Logo`                  | `264:50`    | Color = Black \| Red \| White                  | `BrandLogo` (`brand-logo.tsx`)                               | ✅ #41 — `White` unbuilt, below                                                                   |
| `Icon / Surface`                | `778:1862`  | Size = Base; State = Hover                     | `CarouselControl` — **to build**                             | The insights prev/next (#42)                                                                      |
| `Icon / Soft`                   | `1203:1227` | Size = Base; State = Default                   | Inner chip of `Icon / Surface`                               | Not standalone — a part                                                                           |
| `.building block Icon_text`     | `136:14`    | prop: `Icon name` (Material Symbols)           | **No component** — ADR 0009                                  | `<ArrowIcon />`, `<CloseIcon />`                                                                  |
| `NavBar` (component, not a set) | `2225:2920` | —                                              | `SiteNav` (`web/src/ui`)                                     | ✅ #41 — rebuilt 2026-08; the old `1710:2271` was emptied to a bare pill. Labels unchanged        |
| `Utility Nav` (component)       | `2250:1445` | —                                              | `UtilityNav` (`web/src/ui`)                                  | ✅ #88 — new 2026-08: O3 World · 1682 Conference · O3XO, in flow above the pill, desktop only     |
| `Footer` (component, not a set) | `1280:1885` | —                                              | `SiteFooter` (`web/src/ui`)                                  | ⚠️ **Became canonical 2026-08** — Home's footer is now an override-free instance of it; see below |

`BrandLogo` ships `Color=Black` and `Color=Red` only. No canonical Design
Concept frame instances `Color=White`, so its knockout colour would be a guess;
it is added when a frame calls for it rather than invented now.

The 2026-08 `Footer` looked like that caller and is not one (#87). Its logo is
white, but it is a tight-bounded vector of the two mark paths with no plate at
all (`1280:1856`) — `BrandMark`, not a white tile. `White` stays unbuilt.

`Color=White` briefly shipped, on 2026-08-02, and was removed the same day. The
direction it was built from — the nav's mark should change colour so it stays
visible on either surface — turned out to mean the mark **without its square
plate**, not an inverted plate. An inverted plate had no caller left, and an
orphaned variant is exactly what the rule above is for. Worth keeping as a
worked example: a variant needs a frame or an equally explicit direction, and a
direction that has been _interpreted_ is neither until the interpretation is
confirmed.

### `BrandMark` has no component set

`BrandMark` (same file) draws the ring and the superscript on their own, in
`currentColor`, with no plate. **No component set contains it** — `Brand / Logo`
is a square in all three variants. It is anchored on Nick's direction of
2026-08-02 ("the color of o3 changes so it's visible, without the square box",
plus a reference of the nav in both states) and on the prototype's nav, which
draws precisely this and flips it between `#fff` and `#232323`.

A canonical node draws it since 2026-08: the `Footer`'s logo (`1280:1856`) is
these two paths, white, with no tile — which is the direction landing on a
Figma node rather than on an interpretation of one (#87).

Same two path `d` strings as the tile, shared in the file rather than copied,
and the same 64 viewBox by default — so `BrandLogo` → `BrandMark` at a given
`size` removes the plate and moves nothing else. `trim` crops that box to the
mark's own bounds, for callers whose Figma node is bounded the same way the
footer's vector is. It has no `color` axis on purpose: the surface decides the
ink, which is what lets `SiteNav` flip it by inheritance alone.

### `Button` carries the 2026-08 geometry

`2134:1785` draws one button at both frame widths — **12×16 padding, a 12px
gap, radius 2, an 18/24 Figtree Medium label** — and every redesigned frame
instances it, including the CTA band (`2336:4351`) and the nav pill
(`2225:2877`). `Button` and `FilterChip` are both built to it.

The set has **no size axis**. `Button`'s `base | large` is this repo's own
decision — `base` is the set's geometry, `large` adds 4px of vertical padding
for a section-level CTA — and it is declared as authored rather than read.

The set's `Theme=Red` is not built, and neither is the red hover the Black and
White themes draw. The fill vocabulary is a **knob** (`button.contrast`, stored
in committed seed JSON and regenerated into types), so it moves with the content
model rather than with the component. Its default, `auto`, is not a fill at all:
it reads the surface the instance stands on and picks between `Theme=Black` and
`Theme=White` — ADR 0024.

### The `Footer` component became canonical (2026-08)

History: `1280:1885` on Local Components was stale — `#141414` with
`64px 96px 16px` padding against the canonical frame footer's (`1680:2096`)
`#030303` gradient — so #41 built `SiteFooter` from the frame, not the
component.

The 2026-08 design pass inverted that: the component was reworked
(`#000000`, `64px 96px`, three link columns, legal row, "Go birds." badge) and
the Home frame's footer is now an **override-free instance** of it
(`2435:1840`); `1680:2096` no longer exists. The component is the source of
record now, and `SiteFooter` is built to it as of #87: `bg-black`, `py-16`, and
the plate-less white mark at 148px (128 at 402, `2225:2613`). The "Go birds."
badge (`1275:1631`) already reached the page as Site Settings' `copyrightNote`
and gained the set's only state, the green hover.

Two deltas #87 did not close, neither of them ticketed: the component draws the
orbital ring as a filled `#0A0A0B` donut (`1320:117`) where the code strokes the
dead frame's two rings in `rgba(255,255,255,0.2)`, and the legal row is `#AAA69E`
against `--color-fg-subtle`'s `#A3A3A3`.

### The 402 nav's two extra parts

Neither is in a component set; both are drawn directly on the mobile frame, and
both became inline SVG under ADR 0009 in #41:

| Frame node  | What it is                                                                                     | Code        |
| ----------- | ---------------------------------------------------------------------------------------------- | ----------- |
| `1814:1636` | "Open menu" — **two** 24×1.5 bars, 5px apart, right-aligned in 42×42, `rgba(255,255,255,0.85)` | `MenuIcon`  |
| `400:2219`  | `close` — the second confirmed Material Symbols glyph                                          | `CloseIcon` |

⚠️ ADR 0009 describes the hamburger as three bars in passing. The frame draws
**two** (`1814:1637`, `1814:1638`), and the component follows the frame.

**The panel the hamburger opens has no frame at all** — ADR 0006 records that as
a genuine coverage gap. #41 built it on shadcn's `sheet` (the component ADR 0008
§6 earmarked for exactly this) and invented no new visual language: the panel
reuses the bar's `ink-deep` surface and the pill's `text-button` link
treatment. A frame can overrule it at any time.

## Non-canonical — no code target

Present in the file, not used by any Design Concept frame. Listed so the next
person does not have to re-derive that.

| Figma set                   | Node                              | Why not                                                                                                                                                                                                                                                                                                    |
| --------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Case study cards`          | `264:573`, `466:570`, `1393:3025` | **Three** competing sets. Canonical Home draws its cards as frames (`1683:2661`), not instances — these are generation-1. ⚠️ `1393:3025` is the exception: the **Solutions** frame instances it three times for the engagement cards (`1925:6112`, #47). Nothing case-study about the content — see below. |
| `Buttons`                   | `172:140`                         | Unnamed axes (`Property 1/2/3`) — an imported set, superseded by `Button / *`                                                                                                                                                                                                                              |
| `Button / Outline`          | `778:1447`                        | No canonical frame uses an outline button                                                                                                                                                                                                                                                                  |
| `Button / Surface`          | `356:639`                         | ”                                                                                                                                                                                                                                                                                                          |
| `Icon / Solid`              | `242:310`                         | Superseded by `Icon / Surface`                                                                                                                                                                                                                                                                             |
| `Icon`                      | `270:819`                         | Duplicate of the `Icon / *` family                                                                                                                                                                                                                                                                         |
| `Badge`                     | `270:748`                         | No canonical use                                                                                                                                                                                                                                                                                           |
| `Social links`              | `172:54`                          | **Revisited in #41 and still no.** The frame's footer draws Socials as a plain `Link Group` (`1680:2110`) — no instance                                                                                                                                                                                    |
| `Shapes`                    | `734:1073`                        | Decorative quarter-circles — a background treatment, not a component                                                                                                                                                                                                                                       |
| `close`                     | `400:2219`                        | Glyph, not a component (ADR 0009)                                                                                                                                                                                                                                                                          |
| `Pro-series`                | `1261:4877`                       | AB WIP canvas                                                                                                                                                                                                                                                                                              |
| `Go birds.`                 | `1275:1631`                       | Easter egg. Not a site component.                                                                                                                                                                                                                                                                          |
| `.building block Icon_text` | `270:814`                         | Duplicate of `136:14`                                                                                                                                                                                                                                                                                      |

## Existing `packages/ui` components, classified

Every component in the package, against the Figma library.

| Component        | Classification                                       | Notes                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`         | **Has counterpart** — `Button` (`2134:1785`)         | Realigned to the 2026-08 set in #150. `ghost` is `Button / Ghost` (`264:260`), which that set does not draw                                                                  |
| `FilterChip`     | **Has counterpart** — `Button` (`2134:1785`)         | Added #61 for the Insights filter bar. Same set as `Button`; a chip is a link with `aria-current`, which is why it is not a `Button` prop                                    |
| `BrandLogo`      | **Has counterpart** — `Brand / Logo`                 | Added #41. `Color` is the one axis; `White` unbuilt                                                                                                                          |
| `BrandMark`      | **Code-only** — no set draws a box-less mark         | Added 2026-08-02 by direction; the `Footer`'s logo (`1280:1856`) draws it too, #87                                                                                           |
| `MenuIcon`       | **Has counterpart** — `1814:1636` (drawn, not a set) | Added #41. Two bars, per the frame                                                                                                                                           |
| `CloseIcon`      | **Has counterpart** — `close` glyph                  | Added #41 (ADR 0009)                                                                                                                                                         |
| `Sheet`          | **Code-only** — shadcn                               | Added #41 for the 402 nav; the panel has no frame (ADR 0006)                                                                                                                 |
| `Card`           | **Code-only**                                        | Canonical case-study cards are frames, not a component set                                                                                                                   |
| `SectionShell`   | **Code-only**                                        | The three-surface organism; ADR 0008 — shadcn cannot model it                                                                                                                |
| `ArrowIcon`      | **Has counterpart** — `.building block Icon_text`    | Glyph becomes a component, not a string prop (ADR 0009)                                                                                                                      |
| `ArrowLink`      | **Retired** in #55                                   | No Figma equivalent; the frames use `Button / Ghost` for this job, and #42 built every text CTA that way — so it ended with no call site and was deleted                     |
| `Eyebrow`        | **Code-only**                                        | A type style, not a component. ⚠️ still defaults to `tone="brand"`; canonical eyebrows are neutral `#636363`                                                                 |
| `DisplayHeading` | **Code-only**                                        | A type style                                                                                                                                                                 |
| `HalftoneDisc`   | **Drawn, not a component set**                       | Added #56 from `1925:5922` / `1925:6068`. Both export as the SAME dot pattern — a halftone, not four icons                                                                   |
| `OrbitalDiagram` | **Drawn, not a component set**                       | Added #56 from `1928:6526`. **Not `OrbitalSphere`** — six straight dashed paths, no arc anywhere in it                                                                       |
| `PortraitTile`   | **Code-only**                                        | Added #56. The frame's team card (`1925:5864`) bakes portrait + arc + black into one raster; rebuilt in layers                                                               |
| `MaskedLines`    | **Code-only**                                        | Motion, which the static frames cannot express (#33)                                                                                                                         |
| `Reveal`         | **Code-only**                                        | ”                                                                                                                                                                            |
| `LogoTile`       | **Code-only** — superseded                           | ⚠️ Unused since #89: the partners plate is a 280 × 280 hairlined frame (`1864:2395`) that `LogoWallSection` draws inline. This 110px row is prototype-era — retire it in #38 |
| `Stat`           | **Code-only**                                        | Case-study stats are drawn inline (`1883:3564`)                                                                                                                              |

**Nothing is to-be-replaced.** `ArrowLink` was the one open question, and #55
answered it: #42 reached for `Button variant="ghost"` at every text CTA the
frames draw one at, which left `ArrowLink` with no call site outside its own
stories. It is deleted rather than deprecated — nothing imported it.

## Not audited

Honest limits on the above:

- **Component _usage_ was verified for Home (desktop + mobile) and the Work
  hero.** Case Study and Insights were not opened for this inventory. A set
  marked non-canonical could in principle appear there — the registry is
  complete, the usage column is not.
  - **Live is now opened** (#50, `1644:1889` / `1906:334`) and adds nothing to
    the registry. It instances `NavBar`, `Brand / Logo`, `Button / Solid` and
    `Icon / Surface`, and draws the same `HalftoneDisc` halftone the About
    careers band uses at a 113px diameter. One usage note: its `Icon / Surface`
    instances are **links**, not carousel controls, so `InFlightSection` inlines
    the circle rather than reaching for `CarouselControl` (a `<button>` with
    prev/next semantics). If a third use appears, lift the circle out of both.
    The same wait governs the wider **ledger row** (`InFlightSection.EntryRow`
    and `RoleListSection`'s row share the hairline shell and disc/eyebrow/
    heading arrangement, but diverge in lead, control, and responsive
    composition — a shared module's interface would be as wide as the two
    implementations) and the **snap track** (`InFlightSection`'s cards row
    repeats `CarouselTrack`'s class recipe; `responsive.ts` already guards the
    402 failure mode generically). Both are two-site duplications left standing
    on the rule of three.
  - **Solutions is now opened** (#47, `1925:6138` — there is no mobile frame).
    It instances `NavBar`, `Brand / Logo` ×2 and `Button / Solid`, and it is
    the **one canonical frame that instances a set this document calls
    non-canonical**: the three engagement cards are `Case study cards`
    `1393:3025` (`1925:6113`–`6115`). That does not promote the set. Its name
    is the only case-study thing about it — the instances hold an engagement
    model, a one-line gloss, a 132px halftone disc and a "Best when…" foot, and
    reference no `caseStudy`. So `PanelCards` composes it locally rather than
    becoming a shared card component, and the three competing sets stay
    non-canonical. **The three instances are also identical** — one authored
    card duplicated, the same fill-the-row habit `1710:1800` shows on Live.
- **The glyph list is incomplete** — `arrow_forward` and `close` are confirmed.
  ADR 0009 makes that safe: glyphs are added per ticket, so nothing is blocked
  on a full list.
- **Code Connect is not published** — it needs a paid Figma seat (#33). This
  document is the mapping until then.
