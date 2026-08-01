# Figma frame inventory — what in the file is the target design

Resolves [#34](https://github.com/o3world/o3-sanity/issues/34), under map [#33](https://github.com/o3world/o3-sanity/issues/33).

**File key:** `RvraLJaZ0zWm8UaD5AJf43` — "O3DX: Visual exploration"
**Read via:** the token-based REST MCP (`scripts/figma-mcp.sh` → `figma-developer-mcp`). The official `mcp.figma.com` MCP is rate-limited on a View seat and cannot be used.
**Vocabulary:** this doc uses CONTEXT.md's terms — **Perspective** (`/perspectives/{slug}`), **Case Study** / the **Work** collection (`/work/{slug}`), **Page**. Figma's "Insights" is display copy for Perspectives, and this file names two unrelated frames "Insights"; the node IDs below are the only reliable handle.

---

## The one thing that unlocks the file

The file contains **two generations of the same site**, and they are visually and structurally distinct:

1. **The HTML prototype** — the `.dc.html` pages in `prototype/`, deployed to Netlify and pulled back into Figma with html.to.design. Every frame from this generation is recognizable at a glance: its children are named after DOM tags (`div.sc-host`, `nav`, `section`, `h1`, `footer`), it is **1920w / 390w**, and its footer reads "© 2026 O3 Studio. All placeholder content." A text note on the Wireframes canvas names the source outright: `Prototype: https://lighthearted-squirrel-7210e5.netlify.app/o3%20article.dc?id=wrong-problem` (node `1065:5237`).
2. **The Design Concept** — native Figma frames drawn on top of that thinking, at **1440 / 402**, composed from real Figma components (`NavBar` `1710:2271`, `Brand / Logo` `264:50`, `Button / Solid` `136:754`, `Button / Ghost` `264:260`, `Case study cards` `1393:3025`) and the named variable `Gradient/Red/1`.

**Generation 2 is the target design. Generation 1 is reference.** Every question in #34 falls out of that split.

---

## Canvas map

| Canvas              | Node ID     | What it is                                                                |
| ------------------- | ----------- | ------------------------------------------------------------------------- |
| 🖼️ Cover            | `134:145`   | Cover art                                                                 |
| –––                 | `134:146`   | Divider                                                                   |
| Concepts            | `134:2`     | Early concepting                                                          |
| **Designs**         | `1126:1100` | **The page layers. Everything below.**                                    |
| Moodboards          | `0:1`       | Moodboards                                                                |
| Inspiration         | `224:78`    | Inspiration                                                               |
| Wireframes          | `1065:216`  | html.to.design captures of the HTML prototype, one section per page layer |
| AB WIP              | `1238:557`  | An earlier in-progress Case Study / Homepage exploration                  |
| –––                 | `191:184`   | Divider                                                                   |
| Archive             | `191:80`    | Archive                                                                   |
| 🧩 Local Components | `1275:1586` | Component library (covered by the separate component-map ticket)          |

---

## Canonical frames

All canonical frames are native Figma, live inside the **Design Concept** section (`1632:1510`) on the Designs canvas, and are drawn at **1440** desktop / **402** mobile.

| Page layer         | Desktop                  | W    | Mobile                           | W   | Route                           | Notes                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------ | ---- | -------------------------------- | --- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home               | `1680:2134` "Home"       | 1440 | `1814:1618` "Home - Mobile"      | 402 | `/`                             | Hero → Intro section → Case Studies (stacked cards) → two list sections → Blog → CTA → Footer.                                                                                                                                                                                                                        |
| Work index         | `1634:1167` "Work"       | 1440 | `1906:851` "Work - Mobile"       | 402 | `/work`                         | Hero ("We lead with the deeper problem we found — not the deliverable…") → **three 1248×556 case-study cards** (`1925:5642`, `1925:5654`, `1925:5675`) → CTA → Footer. See Q3 — the frame is **not** hero-only.                                                                                                       |
| Case Study detail  | `1710:2300` "Case Study" | 1440 | `1906:928` "Case Study - Mobile" | 402 | `/work/{slug}`                  | Full-bleed image hero → chapter/content sections → panoramic image → screenshot stack ("Page" `1899:4186`) → Intro section (quote) → Blog ("Keep reading") → Footer.                                                                                                                                                  |
| Perspective detail | `1710:2823` "Insights"   | 1440 | `1906:1046` "Insights - Mobile"  | 402 | `/perspectives/{slug}`          | **Misleadingly named.** Hero is eyebrow `PARTNERSHIP` + H1 "Building on Sanity: structured content that keeps up" + deck + byline "Jay Forbes, Director of Engineering / Jun 2026 · 6 min read" → three prose sections (lorem body) → "Keep reading." related row → CTA → Footer. This is an article, not an index.   |
| About              | `1924:5344` "Insights"   | 1440 | _none_                           | —   | `/about`                        | **Misleadingly named.** Hero → intro copy ("O3 was founded on a simple frustration…") → "4 disciplines. One team." → team row → culture ("Rigorous where it counts…") → "The work doesn't stop at client services." → **CAREERS / "Work with us."** with four role rows + Apply buttons (`1925:6061`) → CTA → Footer. |
| Solutions          | `1925:6138` "Solutions"  | 1440 | _none_                           | —   | `/solutions`                    | Hero eyebrow `SOLUTIONS` + "We don't sell services. We sell the move, and the team that makes it real." → a 1120×1172 diagram block → "Three ways in. You decide how much of the problem to hand us." with three engagement cards → CTA → Footer.                                                                     |
| Live               | `1644:1889` "Live"       | 1440 | `1906:334` "Live - Mobile"       | 402 | `/live` _(route name inferred)_ | Hero eyebrow `LIVE` + H1 "What we're working on." → Blog → "Where to find us" (talks/workshops rows) → "Ideas we're chasing before they reach you" → CTA → Footer. **A net-new page layer** — see Q1.                                                                                                                 |

Plus one canonical **component** on the same canvas, listed here only because it sits loose among the frames:

| Name   | Node ID                 | Notes                                                                                                                                                                                                                    |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NavBar | `1710:2271` (COMPONENT) | The authoritative nav: **Work · Live · Insights · Solutions · About** + a solid "Let's talk" button with `arrow_forward`. Instanced by every canonical desktop frame. Belongs to the component-map ticket, not this one. |

### Nav → route reconciliation

The NavBar's five labels bind cleanly to five canonical page layers:

| NavBar label     | Route           | Frame                   |
| ---------------- | --------------- | ----------------------- |
| Work             | `/work`         | `1634:1167`             |
| Live             | `/live`         | `1644:1889`             |
| Insights         | `/perspectives` | **no frame — see Gaps** |
| Solutions        | `/solutions`    | `1925:6138`             |
| About            | `/about`        | `1924:5344`             |
| Let's talk (CTA) | contact         | **no frame — see Gaps** |

---

## Not canonical

| Name                                             | Node ID     | Class                           | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Home alt" (section)                             | `1379:1291` | **reference**                   | html.to.design import of the HTML prototype homepage. Children are DOM-named (`div.sc-host`, `section#top`, `section#work`, `section#solutions`, `section#partnerships`, `section#insights`, `section#contact`, `footer`); 1920w × 9464px; footer reads "© 2026 O3 Studio. All placeholder content." Contains the two frames below.                                                                                                                                                                                                 |
| ├ "1920w light"                                  | `1379:818`  | reference                       | Desktop capture.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| └ "390w light"                                   | `1379:1296` | reference                       | Mobile capture.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| "What we're working on" (section)                | `1379:1980` | **reference**                   | html.to.design import of the prototype's "Now" page. Its H1 is literally "What we're working on." with the eyebrow `NOW` and the deck "The problems in front of us right now — the work in the studio, the rooms we'll be in, and the ideas we're chasing before they reach you." — **the identical deck copy used by the canonical `Live` frame**. This is the precursor of `1644:1889`.                                                                                                                                           |
| ├ "1920w light"                                  | `1379:1756` | reference                       | Desktop capture.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| └ "390w light"                                   | `1379:1983` | reference                       | Mobile capture.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| "…o3 article.dc?id=sanity-partnership" (section) | `1379:2368` | **reference**                   | html.to.design import of the prototype's article page. Same eyebrow (`PARTNERSHIP`), same H1 ("Building on Sanity: structured content that keeps up"), same byline (Jay Forbes / Jun 2026 · 6 min read) as canonical `1710:2823`, plus a "← All insights" back-link and a red scroll-progress bar (`1379:2367`). This is the precursor of `1710:2823`, not a separate design.                                                                                                                                                       |
| ├ "1920w light"                                  | `1379:2181` | reference                       | Desktop capture.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| └ "390w light"                                   | `1379:2369` | reference                       | Mobile capture.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| "About Us" (section)                             | `1924:3460` | **reference**                   | Also an html.to.design import — `div.sc-host` + `nav`, 1920 × 8765px of content clipped to a 1200px viewport. It is a browser capture of the prototype's About page, **not** a 1920-wide design frame. Superseded by canonical `1924:5344`.                                                                                                                                                                                                                                                                                         |
| ├ "1920w light"                                  | `1924:3461` | reference                       | Desktop capture (1920×1200 viewport).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| └ "390w light"                                   | `1924:4095` | reference                       | Mobile capture (390×780 viewport).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| "Solutions" (section)                            | `1924:4768` | **reference**                   | Same: html.to.design import, 1920 × 4452px clipped to 1200. Superseded by canonical `1925:6138`.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ├ "1920w light"                                  | `1924:4769` | reference                       | Desktop capture.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| └ "390w light"                                   | `1924:5067` | reference                       | Mobile capture.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| "Case Studies"                                   | `1893:478`  | **exploration** (section study) | Not a page — no NavBar, no hero, no Footer. It is the case-study card treatment worked out in isolation: a "Heading" block ("Most firms ship what you asked for. We solve what was actually in the way." + button) and a "Desktop - 33" block holding three cards at descending widths (1248 / 1141 / 1034) with `gap: -500px` — the stacked-scroll effect. The identical two-block structure was then placed inside `Home` as `1683:2656`. Positioned directly below `Work` on the canvas (same x = 4959) purely as working space. |
| "Intro section"                                  | `1799:1607` | **exploration** (section study) | A colour variant of the quote/testimonial section, on the named variable `Gradient/Red/1` instead of the `#F0F0F0` used in place. Placeholder copy: "Simply the best. Better than all the rest…" — "Business Leader, Global Health Brand". The same 192px/96px, gap 128, width-1034 section appears in-place as `1864:2390` and `1683:2137` (Home) and `1899:4051` (Case Study). Belongs to no page layer of its own.                                                                                                               |
| "image 6"                                        | `1442:1387` | **exploration** (stray)         | A loose 262×236 image rectangle on the canvas. No context.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| "Design Concept" (section)                       | `1632:1510` | container                       | 18101×12712 section that holds every canonical frame. Not itself a design.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

---

## Breakpoint decision

**1440 / 402 is authoritative. 1920 / 390 is not a breakpoint at all.**

Plainly: the 1920/390 pairs are not designs. Every one of them (`1379:818`, `1379:1296`, `1379:1756`, `1379:1983`, `1379:2181`, `1379:2369`, `1924:3461`, `1924:4095`, `1924:4769`, `1924:5067`, plus every frame on the Wireframes canvas) shares the same html.to.design signature — `div.sc-host`, `nav`, `section`, `footer` node names, `overflowScroll: y`, and a fixed viewport box (1920×1200 / 390×780) that clips content several thousand pixels tall. 1920 and 390 are the **capture viewport widths** the import tool was pointed at. They carry no design intent.

Everything actually drawn in Figma — every frame that instances `NavBar`, `Brand / Logo`, `Button / Solid`, `Case study cards`, or uses `Gradient/Red/1` — is 1440 desktop / 402 mobile, without exception. 402 is the iPhone 17 viewport width (one mobile frame still carries the artboard name `iPhone 17 - 2`, `1814:1619`). The 1440/402 frames are also the newest work in the file by node ID (the `1893:`–`1928:` batches, versus `1065:`–`1379:` for the imports).

**Build to 1440 and 402.** Treat 1920 as an upper container bound to be reasoned about in code, not a designed breakpoint — the file does not say what 1920 should look like.

---

## The seven questions

### 1. Are "Live" / "Live - Mobile" captures of the existing o3world.com?

**No. Verified false.** They are native Figma designs for a **net-new page layer that does not exist on the live site.**

- `1644:1889` is drawn in Figma: it instances the `NavBar` component (`1710:2272`) and `Brand / Logo` (`1644:1955`), is 1440 wide, and uses the shared CTA + Footer blocks. It has none of the html.to.design markers.
- Its hero is eyebrow `LIVE` + H1 "What we're working on." (`1644:1893`/`1644:1894`) — i.e. it is the **native redesign of the "What we're working on" prototype import** (`1379:1980`), which carries the identical deck copy.
- `1906:334` "Live - Mobile" mirrors it at 402 (same hero, Blog, two list sections, CTA, Footer).
- Corroborated against the WordPress extract: `tools/migration/data/extract/site/chrome.json` gives the live primary nav as **Solutions · Work · About · Perspectives · Contact**, and the 22 extracted pages in `tools/migration/data/extract/page/` contain no page resembling this content. There is no "Live" on o3world.com.

"Live" is a page layer the map does not currently have. Its route is **not stated in the file** — `/live` is inferred from the nav label.

### 2. Does "Home alt" (`1379:1291`) supersede "Home" (`1680:2134`), or vice versa?

**"Home" wins. "Home alt" is the older HTML-prototype capture, not an alternative design.**

`1379:1291` is an html.to.design import (DOM-named children, 1920w, "All placeholder content." footer). `1680:2134` is the native 1440 Figma design with a 402 mobile pair. The relationship is generational, not competitive — "alt" names a capture of the previous generation, not a design option.

### 3. What is "Case Studies" (`1893:478`)?

**A component/section study — the stacked case-study card treatment — not a page and not an alternative Work page.**

It has no NavBar, no hero, no Footer. It is exactly two blocks: "Heading" (`1893:479`) and "Desktop - 33" (`1893:483`), the latter holding three cards at 1248/1141/1034 with `gap: -500px` to stack them. That same pair now lives inside `Home` as `1683:2656`. It sits below `Work` on the canvas as scratch space, nothing more.

**This also corrects issue #43.** The `Work` frame (`1634:1167`) **does** have a card grid: three 1248×556 case-study cards at `1925:5642`, `1925:5654`, `1925:5675`, each with a client-logo mask group, a content column, and a masked background image, followed by the shared CTA (`1925:5774`) and Footer (`1634:1232`). The cards carry `1925:` node IDs while the hero carries `1634:`/`1636:` — the grid was added in a later editing pass, which is very likely why an earlier read saw a hero-only frame.

### 4. Is the imported article section (`1379:2368`) the Perspective detail design?

**It is _a_ Perspective detail design, but not the canonical one — it is the HTML-prototype precursor of the canonical frame.**

`1379:2368` and canonical `1710:2823` are the same article, one generation apart: identical eyebrow (`PARTNERSHIP`), identical H1 ("Building on Sanity: structured content that keeps up"), identical byline ("Jay Forbes, Director of Engineering / Jun 2026 · 6 min read"). The import adds a "← All insights" back-link and a red scroll-progress bar that the Figma frame does not draw.

So: **a Perspective detail frame does exist, and it is `1710:2823` (desktop) + `1906:1046` (mobile)** — the frame confusingly named "Insights". Use `1379:2368` only as reference for the two behaviours the Figma frame omits (back-link, reading-progress bar).

### 5. Which of the two "Insights" frames drives `/perspectives` and which drives `/about`?

**Neither drives `/perspectives`. The premise is wrong.**

- `1710:2823` "Insights" → **`/perspectives/{slug}`** — the Perspective _detail_. Article eyebrow, article H1, byline with avatar, three lorem prose sections, a "Keep reading." related row. Confirmed by its mobile pair `1906:1046`, whose body is three heading + long-lorem-paragraph blocks — an article body, not a card list.
- `1924:5344` "Insights" → **`/about`** — verified: founding story, "4 disciplines. One team.", team row, culture copy, ventures row, and a `CAREERS` / "Work with us." block with four role rows and Apply buttons (`1925:6061`).

**There is no `/perspectives` index frame on the Designs canvas.** The only artifact for that page layer anywhere in the file is the Wireframes canvas section "Insights" (`1065:4601`), which is an html.to.design capture of the prototype — reference only.

### 6. What is "What we're working on" (`1379:1980`)?

**The HTML-prototype "Now" page, imported — the direct precursor of the canonical `Live` frame.** Its H1 is "What we're working on." under a red-dot `NOW` eyebrow, with the deck that the canonical `Live` frame reuses verbatim. Reference, superseded by `1644:1889` / `1906:334`.

### 7. What is "Intro section" (`1799:1607`) — which page layer does it belong to?

**None. It is a standalone colour study of the quote/testimonial section.** Identical geometry to the in-place instances (192px/96px padding, gap 128, 1034-wide content) but filled with the named variable `Gradient/Red/1` instead of `#F0F0F0`. Placeholder testimonial copy ("Simply the best. Better than all the rest…" — "Business Leader, Global Health Brand"). The section ships inside `Home` (`1864:2390`, `1683:2137`), `Case Study` (`1899:4051`) and `About` (`1924:5526`, `1924:5547`); `1799:1607` is where the red treatment was tried, not a page layer.

---

## The other canvases

Checked at shallow depth only, per the ticket.

**Wireframes (`1065:216`)** — seven sections, each an html.to.design 1920w/390w capture of the HTML prototype, plus a text note naming the Netlify source (`1065:5237`):

| Section         | Node ID     | Covered by a canonical frame?                                                        |
| --------------- | ----------- | ------------------------------------------------------------------------------------ |
| Homepage        | `1065:826`  | yes — `1680:2134`                                                                    |
| Work Home       | `1065:1470` | yes — `1634:1167`                                                                    |
| Work Detail     | `1065:1952` | yes — `1710:2300`                                                                    |
| About Us        | `1065:2919` | yes — `1924:5344`                                                                    |
| Solutions       | `1065:4036` | yes — `1925:6138`                                                                    |
| **Insights**    | `1065:4601` | **no — this is the `/perspectives` index, and the Designs canvas has no equivalent** |
| Insights Detail | `1065:5058` | yes — `1710:2823`                                                                    |

So the Wireframes canvas holds **exactly one page layer the Designs canvas lacks: the Perspectives index.** It is a prototype capture, so it is reference, not a target — but it is the only visual evidence of that page's intended shape (hero → listing section → light section → CTA → footer, node `1065:4336`).

Note the wireframe naming is the honest one: "Insights" = index, "Insights Detail" = article. The Designs canvas reused "Insights" for the _detail_ frame and again for the _About_ frame; that is where the confusion in #34 originates.

**AB WIP (`1238:557`)** — an earlier exploration, superseded:

- "Homepage" `1238:558` — 1440×3000, essentially empty (one Container).
- "Case Study" `1238:560` — 1440×8597, blocked out with a different section vocabulary ("Section - Content", "Section - Panoramic", "Section - Quote", "Section - CTA"), a magenta/red gradient hero, a rectangular `Navigation` pill, and its own `Footer` component (`1280:1885`) — none of which survive into the Design Concept. The screenshot-stack "Page" group (`1257:21`, 824 wide) does survive, reappearing as `1899:4186` in the canonical `Case Study` frame.
- A loose column of five screenshots (`1840:114`).

**No page layer here that the Designs canvas lacks.**

---

## Gaps — page layers the site needs that the file does not contain

| Gap                                             | Status in the file                                                                                                                                                                                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`/perspectives` index**                       | **No canonical frame.** Only the Wireframes prototype capture (`1065:4601`). The largest gap: it is a top-level nav destination ("Insights") with 272 migrating Perspectives behind it.                                                                                      |
| **`/about` mobile**                             | No 402 frame. Desktop `1924:5344` has no mobile pair.                                                                                                                                                                                                                        |
| **`/solutions` mobile**                         | No 402 frame. Desktop `1925:6138` has no mobile pair.                                                                                                                                                                                                                        |
| **Contact**                                     | No frame anywhere. The NavBar's primary CTA is "Let's talk" and the prototype homepage has a `section#contact`, but no contact page layer is designed. Inherits the open forms question from map #1.                                                                         |
| **Careers**                                     | **Not a page in this file — a section of About** (`1925:6061`: `CAREERS` eyebrow, "Work with us.", four role rows with Apply buttons). The live site has `/careers/` as a standalone page. The file does not say whether the Apply buttons link out or to a `/careers` page. |
| **Service detail pages**                        | No frame. The `Solutions` frame stops at three engagement-model cards under "Three ways in." — it does not imply per-service children, and there is no `/solutions/{slug}` design. How the 24 consolidated WordPress service pages land is still unanswered by the file.     |
| **Ventures**                                    | No frame. The About frame's "The work doesn't stop at client services." row is the closest thing, but the file does not say it is a ventures index. Per CONTEXT.md ventures are ordinary standard Pages.                                                                     |
| **Utility pages** (privacy, accessibility, 404) | No frames. The live site has all three (`tools/migration/data/extract/page/`).                                                                                                                                                                                               |
| **`/live` route name**                          | The **frame** exists and is canonical; the **route** is not stated anywhere in the file. `/live` is inferred from the NavBar label. Needs a decision.                                                                                                                        |

---

## Corrections to earlier assumptions

Recorded so #33 and its children don't re-derive the wrong thing:

1. **"Live" is not a capture of the current WordPress site.** It is a canonical, net-new page layer. (#34 flagged this as "likely a capture — confirm".)
2. **Neither "Insights" frame is the Perspectives index.** `1710:2823` is the Perspective _detail_; `1924:5344` is About. The index has no frame.
3. **The Perspective detail is not missing.** #33 lists it under "Not yet specified"; `1710:2823` + `1906:1046` resolve it.
4. **"About Us" `1924:3460` and "Solutions" `1924:4768` are not 1920-wide design frames.** They are html.to.design browser captures, in the same family as "Home alt" and the article import — so there is no competing 1920/390 breakpoint set to adjudicate.
5. **The `Work` frame does have a card grid** (`1925:5642`, `1925:5654`, `1925:5675`) — issue #43's premise is stale.
6. **Careers is a section of About in Figma**, not its own page layer. #33 leaves this undecided; the file's answer is "section".
7. Two mobile CTA blocks are named `ClaudeTest` (`1814:1775`, `1928:6606`) — leftover naming from an agent-assisted edit in Figma, not a variant. Ignore the name.
