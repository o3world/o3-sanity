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

| Token             | 402   | 1440  |
| ----------------- | ----- | ----- |
| `text-hero`       | 30px  | 64px  |
| `text-cta`        | 40px  | 60px  |
| `text-display-xl` | 40px  | 48px  |
| `text-display-lg` | 18px  | 36px  |
| `text-lead`       | 18px  | 24px  |
| `text-button`     | 18px  | 18px  |
| gutter            | 20px  | 96px  |
| `band-lg`         | 128px | 192px |

`text-button` is **identical at both widths** — read, not assumed
(`1814:1656` vs `1868:3262`) — and so are the eyebrow, meta, nav and legal
steps. Small UI text does not scale; only display type and rhythm do.

**Composition** — anything that changes what element is on screen rather than
how big it is — switches at `lg`, in the renderer.

### The three structurally-divergent sections

| Section          | base (402)                                                                        | `lg` (1440)                                                                                           |
| ---------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **NavBar**       | Full-width bar, square, logo + a 42×42 **"Open menu"** hamburger (`1814:1636`)    | 822px **pill**, `border-radius: 900px`, five items + "Let's talk" (`1710:2271`)                       |
| **Perspectives** | Cards **stacked vertically**, gap 24, prev/next controls **absent** (`1814:1738`) | Horizontal **carousel** — overflowing track plus two circular `Icon / Surface` controls (`1683:2470`) |
| **Case studies** | Cards stacked, gap 24 (`1889:3620`)                                               | Cards stacked, gap 48 (`1683:2661`)                                                                   |

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
