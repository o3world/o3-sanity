# Figma components → code

The component half of map #33's committed mapping. Frames are
[`docs/figma-frames.md`](https://github.com/o3world/o3-sanity/blob/research/figma-frame-inventory/docs/figma-frames.md); this is every component set in
`RvraLJaZ0zWm8UaD5AJf43`, what it maps to, and what deliberately maps to nothing.

Read [`docs/agents/figma.md`](./agents/figma.md) before opening the file.

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
holds exactly two things** — the `Go birds.` easter egg and a stale `Footer`.
The real component sets live on other canvases and are referenced across
generations, so **a low node id does not mean archived**: `Button / Solid` is
`136:754` and is the button the canonical frames use.

## Canonical — used by the Design Concept frames

Verified by direct reads of the canonical frames, or recorded in
`packages/ui/src/foundations/figma-home-spec.ts`.

| Figma set                       | Node        | Variant axes                                   | Code target                      | Status                           |
| ------------------------------- | ----------- | ---------------------------------------------- | -------------------------------- | -------------------------------- |
| `Button / Solid`                | `136:754`   | Size = Base \| Large; State = Default \| Hover | `Button` (`ui/button.tsx`)       | ⚠️ **Divergent** — see below     |
| `Button / Ghost`                | `264:260`   | Size = Base; State = Default                   | `Button variant="ghost"`         | Exists; needs Figma's fill/label |
| `Brand / Logo`                  | `264:50`    | Color = Black \| Red \| White                  | `BrandLogo` — **to build**       | No current component             |
| `Icon / Surface`                | `778:1862`  | Size = Base; State = Hover                     | `CarouselControl` — **to build** | The perspectives prev/next (#42) |
| `Icon / Soft`                   | `1203:1227` | Size = Base; State = Default                   | Inner chip of `Icon / Surface`   | Not standalone — a part          |
| `.building block Icon_text`     | `136:14`    | prop: `Icon name` (Material Symbols)           | **No component** — ADR 0009      | Glyph prop → `<ArrowIcon />`     |
| `NavBar` (component, not a set) | `1710:2271` | —                                              | `SiteHeader` — **to build**      | #41                              |
| `Footer` (component, not a set) | `1280:1885` | —                                              | `SiteFooter` — **to build**      | ⚠️ **stale**, see below          |

### `Button` is divergent

The shipped `Button` predates the frames and does not match its component set:

|           | Shipped                     | Figma (`136:754`)                                    |
| --------- | --------------------------- | ---------------------------------------------------- |
| Size axis | `sm \| default \| lg`       | `Base \| Large`                                      |
| Fill axis | `brand \| inverse \| ghost` | Solid `#0A0A0A` on light, `#FFFFFF` on dark          |
| Brand red | the **default** variant     | **no red button exists on the canonical Home frame** |
| Label     | 15px / 600                  | 18px / 500 (`--text-button`)                         |
| Radius    | was 6px                     | 0 (already fixed in #37)                             |

Under the rule this becomes `variants: { size: { base, large }, fill: { dark, light } }`
with `defaultVariants: { size: 'base', fill: 'dark' }`. The red variant does not
disappear silently — if it survives, it needs a comment saying which frame
justifies it.

⚠️ **This is not a component edit.** ADR 0008 called the realignment "#38's
first job"; auditing it here shows it reaches further than that assumed. The
variant vocabulary is a **schema enum** — `cta.variant`, `brand | inverse |
ghost` — stored in committed seed JSON and regenerated into types. Changing it
touches the content model, the seed corpus, the renderer and typegen together,
so it belongs to the page layer that rebuilds the CTAs against the frame
(**#42**, with the chrome buttons in #41), not to an inventory ticket. Recorded
here rather than done.

### The `Footer` component is stale

`1280:1885` on Local Components is `#141414` with `64px 96px 16px` padding. The
footer the **canonical Home frame actually renders** (`1680:2096`) is a `#030303`
gradient with `96px 96px 16px`. Build `SiteFooter` from the frame, not the
component. Flagged for #41.

## Non-canonical — no code target

Present in the file, not used by any Design Concept frame. Listed so the next
person does not have to re-derive that.

| Figma set                   | Node                              | Why not                                                                                                                   |
| --------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Case study cards`          | `264:573`, `466:570`, `1393:3025` | **Three** competing sets. Canonical Home draws its cards as frames (`1683:2661`), not instances — these are generation-1. |
| `Buttons`                   | `172:140`                         | Unnamed axes (`Property 1/2/3`) — an imported set, superseded by `Button / *`                                             |
| `Button / Outline`          | `778:1447`                        | No canonical frame uses an outline button                                                                                 |
| `Button / Surface`          | `356:639`                         | ”                                                                                                                         |
| `Icon / Solid`              | `242:310`                         | Superseded by `Icon / Surface`                                                                                            |
| `Icon`                      | `270:819`                         | Duplicate of the `Icon / *` family                                                                                        |
| `Badge`                     | `270:748`                         | No canonical use                                                                                                          |
| `Social links`              | `172:54`                          | Footer social links are drawn directly; revisit in #41                                                                    |
| `Shapes`                    | `734:1073`                        | Decorative quarter-circles — a background treatment, not a component                                                      |
| `close`                     | `400:2219`                        | Glyph, not a component (ADR 0009)                                                                                         |
| `Cover status`              | `134:343`                         | Figma file furniture                                                                                                      |
| `Pro-series`                | `1261:4877`                       | AB WIP canvas                                                                                                             |
| `Go birds.`                 | `1275:1631`                       | Easter egg. Not a site component.                                                                                         |
| `.building block Icon_text` | `270:814`                         | Duplicate of `136:14`                                                                                                     |

## Existing `packages/ui` components, classified

Every component in the package, against the Figma library.

| Component        | Classification                                    | Notes                                                                                                        |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Button`         | **Has counterpart** — `Button / Solid`            | Divergent; realign (above)                                                                                   |
| `Card`           | **Code-only**                                     | Canonical case-study cards are frames, not a component set                                                   |
| `SectionShell`   | **Code-only**                                     | The three-surface organism; ADR 0008 — shadcn cannot model it                                                |
| `ArrowIcon`      | **Has counterpart** — `.building block Icon_text` | Glyph becomes a component, not a string prop (ADR 0009)                                                      |
| `ArrowLink`      | **Code-only**                                     | No Figma equivalent; the frames use `Button / Ghost` for this job — **candidate for retirement in #42**      |
| `Eyebrow`        | **Code-only**                                     | A type style, not a component. ⚠️ still defaults to `tone="brand"`; canonical eyebrows are neutral `#636363` |
| `DisplayHeading` | **Code-only**                                     | A type style                                                                                                 |
| `MaskedLines`    | **Code-only**                                     | Motion, which the static frames cannot express (#33)                                                         |
| `Reveal`         | **Code-only**                                     | ”                                                                                                            |
| `LogoTile`       | **Code-only**                                     | The partner logo wall is drawn as frames                                                                     |
| `Stat`           | **Code-only**                                     | Case-study stats are drawn inline (`1883:3564`)                                                              |

**Nothing is to-be-replaced.** `ArrowLink` is the one open question, and it
belongs to the Home page layer (#42) rather than here.

## Not audited

Honest limits on the above:

- **Component _usage_ was verified for Home (desktop + mobile) and the Work
  hero.** Case Study, Insights, Solutions and Live were not opened for this
  inventory. A set marked non-canonical could in principle appear there — the
  registry is complete, the usage column is not.
- **The glyph list is incomplete** — `arrow_forward` and `close` are confirmed.
  ADR 0009 makes that safe: glyphs are added per ticket, so nothing is blocked
  on a full list.
- **Code Connect is not published** — it needs a paid Figma seat (#33). This
  document is the mapping until then.
