# Figma components → code

The component half of map #33's committed mapping. Frames are
[`docs/figma-frames.md`](https://github.com/o3world/o3-sanity/blob/research/figma-frame-inventory/docs/figma-frames.md); this is every component set in
`RvraLJaZ0zWm8UaD5AJf43`, what it maps to, and what deliberately maps to nothing.

Read [`docs/agents/figma.md`](./agents/figma.md) before opening the file.

Every node id below that the file still holds is also carried, verified, in
[`tools/figma-sync/data/tracked-nodes.json`](../tools/figma-sync/data/tracked-nodes.json) — the
machine-readable half of this document (#79). `pnpm figma:sync` hashes each set and tells you which
one changed and what code it routes to. **Edit both halves together**: a row added here without a
manifest entry is a set nothing is watching.

o3xo answers to a different file. Its half of the map is
[`docs/figma-components-o3xo.md`](./figma-components-o3xo.md), watched by
`pnpm figma:sync --brand o3xo` (#242).

## The rule

**One Figma variant axis → one `cva` variants key** (ADR 0008). Figma's value
name becomes the cva value, lowercased; `defaultVariants` equals Figma's
Default. A variant that exists only in code carries a comment saying why.

Two things that are _not_ variants:

- **`State=Hover`** is a CSS pseudo-class, never a cva variant. Figma has to
  draw hover as a separate component because it has no `:hover`; code does not.
  Every `State` axis below collapses to a `hover:` utility.
- **`Show right icon` / `Show left icon`** — the boolean props on `Button /
Solid`, spelled `Show Leading Icon` / `Show Trailing Icon?` on the 2026-08
  set — become **a slot, not a variant**. They toggle the presence of a child,
  not the appearance of the button, and cva variants exist to select classes.
  `Button` exposes the trailing one as `icon?: ReactNode`, which the content
  layer fills from the `icon` knob (#151); no canonical instance turns the
  leading one on, so there is no area for it.

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

| Figma set                         | Node        | Variant axes                                       | Code target                                                          | Status                                                                                            |
| --------------------------------- | ----------- | -------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Button` (the 2026-08 rebuild)    | `2134:1785` | Theme = Black \| White \| Red; State ×5            | `Button` (`ui/button.tsx`), `FilterChip` (`filter-chip.tsx`)         | ✅ #150, #299 — geometry and states below                                                         |
| `Button / Ghost`                  | `264:260`   | Size = Base; State = Default                       | `Button variant="ghost"`                                             | The one fill the 2026-08 set does not draw                                                        |
| `Button / Solid`                  | `136:754`   | Size = Base \| Large; State = Default \| Hover     | **Superseded** by `2134:1785`                                        | Nothing follows it                                                                                |
| `Brand / Logo`                    | `264:50`    | Color = Black \| Red \| White                      | `BrandLogo` (`brand-logo.tsx`)                                       | ✅ #41 — `White` unbuilt, below                                                                   |
| `Icon` (the 2026-08 set)          | `2177:1556` | Icon = 29 named glyphs                             | `BUTTON_ICONS` (`button-icons.tsx`)                                  | ✅ #151 — three curated for the button's icon knob; the rest route nowhere                        |
| `Icon / Surface`                  | `778:1862`  | Size = Base; State = Hover                         | `CarouselControl` — **to build**                                     | The insights prev/next (#42)                                                                      |
| `Icon / Soft`                     | `1203:1227` | Size = Base; State = Default                       | Inner chip of `Icon / Surface`                                       | Not standalone — a part                                                                           |
| `.building block Icon_text`       | `136:14`    | prop: `Icon name` (Material Symbols)               | **No component** — ADR 0009                                          | `<ArrowIcon />`, `<CloseIcon />`                                                                  |
| `NavBar` (component, not a set)   | `2225:2920` | —                                                  | `SiteNav` (`content-ui/chrome`)                                      | ✅ #41 — rebuilt 2026-08; the old `1710:2271` was emptied to a bare pill. Labels unchanged        |
| `Utility Nav` (component)         | `2250:1445` | —                                                  | `UtilityNav` (`content-ui/chrome`)                                   | ✅ #88 — new 2026-08: O3 World · 1682 Conference · O3XO, in flow above the pill, desktop only     |
| `Footer` (component, not a set)   | `1280:1885` | —                                                  | `SiteFooter` (`content-ui/chrome`)                                   | ⚠️ **Became canonical 2026-08** — Home's footer is now an override-free instance of it; see below |
| `CTA`                             | `2177:1354` | Device = Desktop \| Mobile                         | `CtaSection` (`blocks/section/ctaSection`)                           | ✅ #163 — the band-level sets, below                                                              |
| `Interior Hero`                   | `2107:1051` | Device = Desktop \| Mobile; Surface = Ink \| White | `CollectionHero variant="interior"` (`ui/collection-hero.tsx`)       | ✅ #311 — surface axis, optional rail, picture slot; below                                        |
| `Blog`                            | `2205:1146` | Property 1 = Default \| Mobile                     | `InsightsCarouselSection` (`blocks/section/insightsCarouselSection`) | ✅ #163                                                                                           |
| `Case Study Card`                 | `2089:4169` | Variant = Caron \| Ironman \| Vertex               | `CaseStudyCard` (`apps/web/src/components/cards`)                    | ✅ #302, tree confirmed #314 — the axis is **content, not design**: no `cva` key, below           |
| `Services` (component, not a set) | `2846:5637` | —                                                  | `PanelTrack` (`blocks/section/railPanelsSection`)                    | ✅ #305 — one column of the sideways track; two bands instance it, below                          |

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

### The three band-level sets were unwatched until #163

`CTA`, `Interior Hero` and `Blog` are not components inside a band — they **are**
bands, instanced whole by every redesigned page frame. That is exactly why they
went unlisted: nothing in a page frame's diff points at them, so a set could be
redrawn and the frames that instance it would report nothing.

It cost a generation. The `CTA` set hangs the molecule; `ctaSection` drew the
sphere of the pre-redesign band `1680:2132` on every page for as long as the set
existed, and no run reported it. Adding the three closes the hole for the class,
not just for the one that was found.

`Blog`'s axis is the unnamed `Property 1` where the other two use `Device`. Its
values still read Desktop/Mobile, so it is one axis with a sloppy name rather
than a second vocabulary — one `cva` key under the rule above, not two.

**Home does not instance `CTA`.** Its frame `1680:2134` still holds the bespoke
closer, which is why `ctaSection`'s `decoration` knob keeps `orbs` alongside the
molecule it now defaults to.

### `Services` is one column of the track, and two bands instance it

The name says band and the node is a column. `2846:5637` is a single component
with no variant axis — index, heading, body, the quieter "Best when…" line and
a text link — and a band is a row of three of them under a heading, a
standfirst and the 1px rule that reports the scroll position.

Two bands do that: Home's "How we work" (`2846:5480`, #309) and About's "What we
optimize for." (`2960:7022`, #305). Both are `railPanelsSection layout="track"`,
so the component routes to `PanelTrack` and a change to it moves both pages.

Two things the six instances say and the drawing does not. The index reads `.03`
on every one of them — the component's default, overridden nowhere — so the
numeral derives from array order rather than from a field. And the link is the
default too, on all six, which is why neither band builds one: a label nobody
has written is not a destination.

### `Case Study Card` is a set whose axis is not a variant

The case-study card is a component set as of the 2026-08 pass. The /work index
instances it three times (`2107:1094`–`1096`, and once more per breakpoint) and
the case-study detail's next-project band once (`2250:1564`), so the card is now
one node to watch rather than geometry re-drawn per frame.

The set declares one property, `Variant`, whose values are `Caron | Ironman |
Vertex` — **which client the demo shows**, not how the card is drawn. The three
components are byte-for-byte the same box down to the placeholder copy; only the
logo differs. So it maps to no `cva` key: the client's logo, eyebrow, narrative,
stat and CTA are props the content layer fills from a `caseStudy`. The rule at
the top of this document is one Figma axis → one `cva` key; this is the case that
rule does not reach, because a content axis is a fixture, not an appearance.

```
1246 × 550     radius 32, padding 64 uniform, vertical, space-between,
               gap floor 66. The card FILLS its column, and the /work
               column (`2107:1093`) is 1248 wide.
  top          the client logo in a 180 × 80 holder (Caron's is 185)
  content row  1118 wide: 559 of text beside 559 of deadspace, no gap
  text area    gap 24 — copy, stat row, button
    copy       gap 12: eyebrow 18/24 bold, 0.1em, RED #C90E00, over a
               narrative at 24/34 regular, tracking 0, white
    stat       gap 24: 48/57.6 tracking -1 white, beside a 16/19.2 label
               at 65% white
    button     an instance of `Button / Solid` (`2205:1298`) —
               Theme=White, State=Default, trailing icon on, leading off,
               label "View the work"
  ground       the hero photograph, plus a near-horizontal linear gradient
               (tilted ~10°) black 0.95 → 0.70 at 50% → 0
```

At 402 the /work stack (`2975:8428`) is 362 wide and sits its three instances 48
apart. The instances (`2975:8429`–`8431`) override the padding to **24 side / 64
top and bottom** and the gap to 24; the Content row collapses to one 314-wide
text column. The first card is 592 tall, which is content, not a second size.
They are otherwise plain instances — the set's own gradient comes with them, and
**the file draws no separate mobile scrim**.

Read from the node tree at file version `2391349966960467923` (2026-08-24, #314),
which corrected the #302 entry written from renders: 1246 not 1248, 559 not 560,
and the mobile padding is not uniform. The renderer draws all of it since #319 —
the eyebrow at `eyebrow-lg` in `--color-brand-deep` (`#C90E00`, variable
`2050:1205`, a different red from `--color-brand`), the narrative at
`display-sm`, and the padding as `px-6 py-16 lg:px-16`.

### `Interior Hero` carries three axes, and two of them are slots

`Device` is the only axis the set's own variant properties name. The other two
are drawn as instances rather than declared, so they read off the frames:

- **Surface.** Every route instances the set on ink (#0A0A0B). About draws
  `Interior Hero – White` (`2960:6876`): the ground **#F5F4F1**, the copy black,
  the standfirst #AAA69E, and the kicker **brand red** #EB1000. One `cva` key,
  `surface`, and `heroSectionKnobs` offers the same two values. ⚠️ #F5F4F1 is
  neither `white` nor `bone` (#F1F0EC) nor `bone-soft` (#F7F7F6); the band
  paints `white` because that is the axis the set's name and #311 both give it,
  and the wash is unruled — see #311.

  The kicker's colour does **not** follow the surface on its own: the partner
  page draws it red on ink (`2401:3185`) where the base set draws it white.
  Two instances out of three are red, which is not enough of a rule to derive,
  so the component takes white on ink and red on light and a per-page override
  would need a knob.

- **The right rail.** The base set (`2107:1051`) draws none and stacks the
  standfirst under the headline in a 395px measure. The Sanity partnership page
  (`2401:3185`) fills it with the "o3 EXPERTISE" block, and three things move
  with it: the headline steps **64/76 → 48/58** (Light either way, tracking -1
  → 0), the standfirst widens to the 608 column, and the two columns align to
  their feet instead of their centres. Rail-present and rail-absent are one
  slot, not two compositions, and the rail is what tells the two type steps
  apart.

Read values common to every instance: a 1248 container at 192/64, a 608 copy
column, 32 between the columns, 16 between the copy's own parts (24 where a
lockup is one of them), an 18/24 kicker at 0.1em, and a 24/34 standfirst. The
Mobile variant sets the kicker to 16/20 and zeroes the headline's tracking —
the one place on the ramp where small UI text does scale, which `Eyebrow` does
not follow because the token is shared with every other kicker on the site.

The globe behind the band (`2846:4465`, `2846:4466`) is **not** an asset. Both
nodes are a rotated screen capture of the orbital sphere with a mouse cursor in
the pixels, so `OrbitalSphere` draws it — the same call `orbital-sphere.tsx`
already records for the Home hero and the CTA band. `CollectionHero`'s
`background` slot is for a picture an editor uploads, not for the globe.

The set draws no centred composition. Both instances set the copy against the
left gutter with the globe on the right.

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
gap, radius 5, an 18/24 Figtree Medium label** — and every redesigned frame
instances it, including the CTA band (`2336:4351`) and the nav pill
(`2225:2877`). `Button` and `FilterChip` are both built to it.

The set has **no size axis**. `Button`'s `base | large` is this repo's own
decision — `base` is the set's geometry, `large` adds 4px of vertical padding
for a section-level CTA — and it is declared as authored rather than read.

The set's `Theme=Red` is not built. Its four **states** are, as of #299: both
themes hover to brand red, and they share one focus, press and disabled fill.
That is why the states are one string in `button.tsx` rather than a line in each
theme's variant.

The fill vocabulary is a **knob** (`button.contrast`, stored in committed seed
JSON and regenerated into types), so it moves with the content model rather than
with the component. Its default, `auto`, is not a fill at all: it reads the
surface the instance stands on and picks between `Theme=Black` and `Theme=White`
— ADR 0026.

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

Not used by any Design Concept frame. Listed so the next person does not have to
re-derive that.

⚠️ **Nine of these no longer exist**, deleted from the file in the 2026-08 pass:
`466:570`, `172:140`, `778:1447`, `356:639`, `270:819`, `172:54`, `734:1073`,
`400:2219` and `270:814`. The rows stay as the record of a call already made;
the manifest carries none of them, which is why it holds fewer sets than this
table has rows.

| Figma set                   | Node                              | Why not                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Case study cards`          | `264:573`, `466:570`, `1393:3025` | **Three** competing generation-1 sets, superseded by `Case Study Card` (`2089:4169`) above. Home still draws its cards as frames (`1683:2661`). ⚠️ `1393:3025` is the exception: the **Solutions** frame instances it three times for the engagement cards (`1925:6112`, #47). Nothing case-study about the content — see below. |
| `Buttons`                   | `172:140`                         | Unnamed axes (`Property 1/2/3`) — an imported set, superseded by `Button / *`                                                                                                                                                                                                                                                    |
| `Button / Outline`          | `778:1447`                        | No canonical frame uses an outline button                                                                                                                                                                                                                                                                                        |
| `Button / Surface`          | `356:639`                         | ”                                                                                                                                                                                                                                                                                                                                |
| `Icon / Solid`              | `242:310`                         | Superseded by `Icon / Surface`                                                                                                                                                                                                                                                                                                   |
| `Icon`                      | `270:819`                         | Duplicate of the `Icon / *` family                                                                                                                                                                                                                                                                                               |
| `Badge`                     | `270:748`                         | No canonical use                                                                                                                                                                                                                                                                                                                 |
| `Social links`              | `172:54`                          | **Revisited in #41 and still no.** The frame's footer draws Socials as a plain `Link Group` (`1680:2110`) — no instance                                                                                                                                                                                                          |
| `Shapes`                    | `734:1073`                        | Decorative quarter-circles — a background treatment, not a component                                                                                                                                                                                                                                                             |
| `close`                     | `400:2219`                        | Glyph, not a component (ADR 0009)                                                                                                                                                                                                                                                                                                |
| `Pro-series`                | `1261:4877`                       | AB WIP canvas                                                                                                                                                                                                                                                                                                                    |
| `Go birds.`                 | `1275:1631`                       | Easter egg. Not a site component.                                                                                                                                                                                                                                                                                                |
| `.building block Icon_text` | `270:814`                         | Duplicate of `136:14`                                                                                                                                                                                                                                                                                                            |

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
| `Card`           | **Code-only**                                        | shadcn's box. The case-study card is its own set (`2089:4169`) and each brand draws its own renderer for it                                                                  |
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
| `Stat`           | **Code-only**                                        | The card's stat row is drawn inside the card, not instanced — the `Data` row of `2089:4169`                                                                                  |

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
