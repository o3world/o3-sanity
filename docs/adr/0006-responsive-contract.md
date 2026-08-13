# 0006. Responsive is a renderer concern — the frames are endpoints, not breakpoints

- **Status:** Accepted
- **Date:** 2026-08-01
- **Deciders:** NickO3 + Claude
- **Related:** [issue #39](https://github.com/o3world/o3-sanity/issues/39), [issue #33](https://github.com/o3world/o3-sanity/issues/33), [issue #37](https://github.com/o3world/o3-sanity/issues/37), [issue #34](https://github.com/o3world/o3-sanity/issues/34)

## Context

Every canonical page layer exists as a **desktop and a mobile frame** — Home
`1680:2134` / `1814:1618`, Work `1634:1167` / `1906:851`, Case Study
`1710:2300` / `1906:928`, Insights `1710:2823` / `1906:1046`, Live `1644:1889`
/ `1906:334`. Desktop is **1440**, mobile **402** (#34).

Two frames is not a responsive spec. It is two samples of one, and the
questions it leaves open reach further than CSS: if a section is composed
differently on mobile, that could be a renderer detail, or it could mean the
content model owes the renderer a per-breakpoint field. #37 also left the type
scale's clamp floors explicitly **interim**, pending this.

The decision rests on one comparison. Reading the Home mobile frame band by
band against Home desktop:

| Band                  | Desktop `1680:2134`      | Mobile `1814:1618`       |
| --------------------- | ------------------------ | ------------------------ |
| Hero                  | `1810:1616` photographic | `1814:1619` photographic |
| Partners / intro      | `1864:2390`              | `1814:1639`              |
| Case studies          | `1683:2656`              | `1814:1653`              |
| Pull quote            | `1683:2137`              | `1814:1679`              |
| Platforms             | `1762:2149`              | `1814:1686`              |
| Ways to work          | `1762:2168`              | `1814:1709`              |
| Perspectives ("Blog") | `1683:2467`              | `1814:1738`              |
| CTA band              | `1680:2132`              | `1814:1775`              |
| Footer                | `1680:2096`              | `1814:1784`              |

**Same bands, same order, nothing present on one and absent from the other.**
The divergence is entirely in how each band lays out internally.

## Decision

**Responsive is a renderer concern.** A section block renders from one set of
fields at every width, using Tailwind breakpoints. No schema field is
per-breakpoint, and no block is conditional on viewport.

### Breakpoints: keep Tailwind's defaults

402 and 1440 are **design widths, not thresholds** — the same reasoning #34
applied to 1920/390. They say what the endpoints look like, not where layout
should flip. Inventing `--breakpoint-*` tokens at those numbers would ship a
1440px breakpoint that fires on almost no real display and leave 1024–1439
rendering the phone layout.

So: Tailwind's scale stands, and the frames map onto it.

| Width            | What it is                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| base (no prefix) | The **402 frame**. Mobile-first; these styles apply from 320 up.                                                                           |
| `md` (768)       | Intermediate reflow only — 2-up grids and the like. **Figma designs no 768 frame**, so anything here is a code decision, not a read value. |
| `lg` (1024)      | The **1440 frame's composition** takes over.                                                                                               |

`lg` rather than `xl` because the desktop compositions need roughly 1024 to
work at all — the nav pill carries five items across 822px, and the
perspectives carousel shows three cards — and because between 1024 and 1440 the
fluid gutter and the 1248px container absorb the difference, so a 1440 viewport
reproduces the frame exactly.

### Scale fluidly between the endpoints; switch composition at `lg`

Type and spacing **interpolate** rather than step, because both frames give a
value for the same token and a linear ramp between them is the honest reading
of two endpoints. Each clamp is solved so it hits the mobile value at 402 and
the desktop value at 1440 — which is what finally closes #37's interim floors:

| Token             | 402     | 1440  |
| ----------------- | ------- | ----- |
| `text-hero`       | 30px ⚠️ | 64px  |
| `text-cta`        | 40px    | 60px  |
| `text-display-xl` | 40px    | 48px  |
| `text-display-lg` | 18px    | 36px  |
| `text-lead`       | 18px    | 24px  |
| `text-button`     | 18px    | 18px  |
| gutter            | 20px    | 96px  |
| `band-lg`         | 128px   | 192px |

⚠️ `text-hero`'s 30px floor is **superseded** — it was read off the wrong node.
The floor is 36 and the pull quote moved to `text-quote`; see the
[amendment](#amendment-2026-08-02) below. The rest of this table stands.

`text-button` is **identical at both widths** — read, not assumed
(`1814:1656` vs `1868:3262`) — and so are the eyebrow, meta, nav and legal
steps. Small UI text does not scale; only display type and rhythm do.

**Composition** — anything that changes what element is on screen rather than
how big it is — switches at `lg`, in the renderer.

### The three structurally-divergent sections

| Section             | base (402)                                                                        | `lg` (1440)                                                                                           |
| ------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **NavBar**          | Full-width bar, square, logo + a 42×42 **"Open menu"** hamburger (`1814:1636`)    | 822px **pill**, `border-radius: 900px`, five items + "Let's talk" (`1710:2271`)                       |
| **Perspectives** ⚠️ | Cards **stacked vertically**, gap 24, prev/next controls **absent** (`1814:1738`) | Horizontal **carousel** — overflowing track plus two circular `Icon / Surface` controls (`1683:2470`) |
| **Case studies**    | Cards stacked, gap 24 (`1889:3620`)                                               | Cards stacked, gap 48 (`1683:2661`)                                                                   |

⚠️ The Perspectives row is **superseded**. The band became the `Blog` component
set, whose 402 variant now draws the same prev/next controls as desktop, so it
is no longer a structural divergence — see the
[2026-08-13 amendment](#amendment-2026-08-13). The other two rows stand.

Case studies is listed to record that it **is not a divergence**. The ticket
described it as "a sticky-stacking card set on desktop", but both frames show a
plain vertical stack differing only in gap. The sticky-stack is **motion**, and
Figma frames are static — it belongs to #33's open motion question, not here.

## Alternatives considered

### Custom breakpoints at 402 and 1440

- **Pros:** code names the frames directly; `lg:` would mean "the desktop frame" with no interpretation.
- **Cons:** a 1440 breakpoint fires on a minority of displays, so every laptop between 1024 and 1439 gets the phone layout. It also mistakes a design width for a threshold — exactly the error #34 corrected for 1920/390.
- **Why not:** the frames are samples, not thresholds. Tailwind's defaults already sit where real viewports cluster.

### Step type at breakpoints instead of clamping

- **Pros:** every rendered size is a value someone drew; no interpolation.
- **Cons:** two frames means two samples — at 900px a stepped scale is showing one of them, not something designed. Type visibly jumps mid-resize, and the repo's existing tokens are already clamps.
- **Why not:** with a value at each endpoint, interpolation is strictly more information than a step, and it is what a designer means by giving you both ends.

### Per-breakpoint schema fields

- **Pros:** an editor could tune mobile independently.
- **Cons:** doubles the field surface of every block, and asks editors to art-direct a viewport they cannot see in the Studio. Nothing in the frames asks for it.
- **Why not:** the band comparison is decisive — same blocks, same order, at both widths. This would be solving a problem the design does not have.

## Consequences

- **No schema change.** Confirmed against the full band comparison above: no
  block appears at one width only, and no order differs. `SECTION_BLOCKS` and
  every document type are untouched by this ADR.
- `--spacing-gutter`, `--spacing-band-lg` and `--spacing-section-y` become
  clamps; `band-sm` (96) and `band-md` (128) are **unchanged between the
  frames** and stay flat.
- The type clamps in `typography.css` lose their "interim" warning — the floors
  are now read values, not guesses.
- **The opened mobile menu has no frame.** `1814:1636` is the closed hamburger;
  nothing in the file shows the panel it opens. That is a genuine coverage gap,
  not something to infer — it needs a `sheet` decision in #36 and a frame or an
  explicit licence to design one.
- **Two treatments the mobile frames drop, flagged rather than adopted.** The
  64px statement is gradient-filled on desktop (`1683:2143`) but a solid
  `#030303` at 30px on mobile (`1814:1684`), and the quote attribution is
  `rgba(10,10,10,0.5)` on desktop against a solid `#0A0A0A` on mobile. Both
  read as authoring drift in the later mobile frames rather than intent — the
  gradient statement is the design's signature move and a named token. **The
  renderers keep both treatments at all widths**; if that is wrong, it is a
  one-line revert per treatment.
- `md` is licensed but undesigned. Anything placed there is a code decision and
  should say so at the call site, because no frame backs it.

## Notes for the reader

Two things in the mobile Home frame are Figma artefacts, not design intent, and
will waste your time if you read them as signal:

- The CTA band is named **"ClaudeTest"** (`1814:1775`).
- The footer's inner container is **1248px wide inside a 402px frame**
  (`1814:1806`) — a desktop value left behind, which is why the footer's mobile
  layout has to come from its own padding rather than that container.

---

## Amendment 2026-08-02

**`--text-hero`'s 402 floor was read off the pull quote.** Everything above
stands; this corrects one row of the type table.

### What was wrong

The floor was cited to `1814:1684`. That node is the **pull quote** — the same
node this ADR's own consequences section names when it flags the mobile
gradient drift. `--text-hero` has three call sites, and the quote is the only
one that reads 30. Re-measured (all three via `figma_rest`, this file):

| Call site          | Node        | 402                       | Node        | 1440        |
| ------------------ | ----------- | ------------------------- | ----------- | ----------- |
| Home hero headline | `1814:1624` | **36** / 40px / −0.0389em | `1810:1616` | 64 (raster) |
| Partners statement | `1814:1894` | **36** / 1.25em           | `1864:2393` | 64 / 1.2em  |
| Pull quote         | `1814:1684` | **30** / 1.2em            | `1683:2143` | 64 / 1.2em  |

So two of three bands rendered 30px where the frame draws 36 — a 17% error on
the largest text on a phone, and on the hero it is load-bearing: the 402 hero
is a 362px column (`1814:1622`) and "You see the problem" only clears it with
the frame's negative tracking.

The 1440 end was never wrong. All three are 64 there, which is why one token
covered them for as long as it did.

### The new arrangement

The clamp is not adjusted — it is **re-pointed**. The old
`clamp(30px, calc(3.28vw + 16.8px), 64px)` was solved correctly for the node
it was measured from, so it keeps serving that node under a new name, and
`--text-hero` is re-solved for the two that read 36:

| Token          | 402  | 1440 | Clamp                                      | Call sites                        |
| -------------- | ---- | ---- | ------------------------------------------ | --------------------------------- |
| `--text-hero`  | 36px | 64px | `clamp(36px, calc(2.7vw + 25.15px), 64px)` | Hero headline, partners statement |
| `--text-quote` | 30px | 64px | `clamp(30px, calc(3.28vw + 16.8px), 64px)` | Pull quote                        |

Both are solved the same way this ADR already requires: hit the 402 frame at
402 and the 1440 frame at 1440. Nothing at 1440 moves — both ceilings are 64,
and both clamps reach it at or before 1440.

**Why a second token rather than a `lg:` step or a call-site literal.** A step
would contradict this ADR's own "size interpolates, composition switches at
`lg`". A call-site literal — the file's habit for one-off values, as with the
attribution's 1.5em line-height — would mean inlining a solved two-endpoint
clamp into a `className`, where no one would ever check it against the frame
again. Two of the three bands genuinely share a step; the third genuinely does
not. Two tokens is the honest count.

### Measured but not adopted

The 402 frame also disagrees with the tokens on two sub-values, and this
amendment deliberately leaves both alone rather than widening its own scope:

- **Line-height.** The two `--text-hero` consumers diverge at 402 in opposite
  directions — the headline 40/36 (1.111), the statement 1.25 — against a
  shared 1.2 read at 1440. One token cannot hold both, and the gap is ≤5px of
  leading per line at 36px. The token stays 1.2.
- **Tracking.** The hero headline reads **−0.0389em** at 402. The partners
  statement reads 0 at _both_ widths, so this cannot live on the shared token;
  and the 1440 headline is baked into a raster, so there is no second endpoint
  to solve against. Applying it unprefixed would move 1440 — which this
  amendment is explicitly not doing. It wants either a licence to read the
  raster or a live 1440 text node.

### Knock-on

`OrbitalDiagram`'s lead label (`packages/ui/src/components/orbital-diagram.tsx`)
is a fourth `text-hero` consumer with no 402 frame of its own, so it inherits
the new floor: 30 → 36 at 402. Its sibling non-lead labels are
`clamp(30px, 2.78vw, 40px)`, so the lead now reads larger than them at 402
where it used to tie. No frame contradicts that, and it is the better of the
two readings, so it is left to inherit rather than pinned.

---

## Amendment 2026-08-13

**Perspectives is no longer a structurally-divergent section.** Everything
above stands; this corrects one row of the divergence table, and the frame it
was read from is superseded rather than re-read.

### What changed in the file

`pnpm figma:sync` (file version `2386937043801380426`,
[issue #90](https://github.com/o3world/o3-sanity/issues/90)) found the
Perspectives band promoted to a shared component set — **`Blog` `2205:1146`**
— with two variants, where the original decision compared two hand-drawn
frames:

| Variant                     | Heading                                    | Buttons                       | Row                         |
| --------------------------- | ------------------------------------------ | ----------------------------- | --------------------------- |
| `Property 1=Default` (1440) | `2134:1179`, horizontal, subhead + buttons | `2134:1181`, two 48px, gap 20 | `2134:1185`, horizontal, 32 |
| `Property 1=Mobile` (402)   | `2177:1428`, **vertical**, gap 32          | `2209:2566`, two 48px, gap 20 | `2177:1433`, vertical, 32   |

The ADR's row said mobile has "prev/next controls **absent**", cited to
`1814:1738`. **The mobile variant now carries the same two controls as
desktop**, and its heading was re-laid vertically to make room for them —
which is authoring, not residue: a horizontal heading row at 402 has nowhere
to put a 116px button pair. The Insights detail instance (`2262:3905`) and the
Home instance both inherit it.

### The decision this amends

Perspectives comes **out** of the "three structurally-divergent sections"
table. The controls render at every width, and the track is a horizontal
snap-scroller at every width, so the composition no longer switches at `lg` —
only the card measure does (full-column below `lg`, 394.67px at `lg`).

Case studies and the NavBar are untouched, so the table is now two rows, not
three.

### What this deliberately does not follow

The mobile variant's `Row` (`2177:1433`) is still a **vertical stack**. Taken
with the controls it is self-contradictory: prev/next mean nothing over a
track that cannot move, and honouring both would ship a permanently dead
button pair on every phone — which the ADR's own reasoning ("a hidden overflow
affordance on a 402 phone") rejects in the other direction.

The controls are the newer and more specific signal, so they decide it, and
the stack is the part not followed. If that reading is wrong the fix is the
`lg:` prefixes on `CarouselTrack`'s `<ul>` and `<li>`, and this section is
where to start.

Two smaller reads recorded but not acted on:

- **Row gap at 402 is now 32**, not the 48 the renderer uses from the older
  frame. Adopting the scroller made it moot — the horizontal gap is 32 at both
  widths, which is what ships.
- **The controls are 48px in both variants**, against `CarouselControl`'s
  58px, read from `Icon / Surface` `778:1862`. That gap is the same at 1440,
  so it is not a mobile divergence and not this amendment's to close.
