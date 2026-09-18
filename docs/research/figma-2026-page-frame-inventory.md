# The Designs canvas after the 2026-09 re-architecture

Resolves [#478](https://github.com/o3world/o3-sanity/issues/478), under map
[#476](https://github.com/o3world/o3-sanity/issues/476).

**File:** `RvraLJaZ0zWm8UaD5AJf43`, "🅾️ 2026 O3DX Website", version
`2400647235422861907`, read 2026-09-18 over `/v1/files/:key/nodes` with the REST
token in `apps/web/.env.local`.

## What this answers

The re-architecture recorded in
[`figma-2026-rearchitecture-findings.md`](./figma-2026-rearchitecture-findings.md)
left three things unknown: which of the 22 children of the Designs canvas
`1126:1100` are canonical page frames, what each canonical frame is now composed
of, and what the manifest should say instead of the nine ids that no longer
resolve. This document answers all three from the file, plus mobile coverage and
a first pass over the fourteen frames the sync reported as modified in place.

It decides nothing. Every recommendation below is a recommendation.

## 1. The Designs canvas, all 22 children

`1126:1100` is a `CANVAS` named "Designs" with 22 direct children. Widths are the
two-generations tell: 1440 desktop and 402 mobile are native design, 1920/390 and
DOM-shaped layer names are html.to.design captures.

| Node         | Name                           | Type  | W × H        | Generation          | Route                             |
| ------------ | ------------------------------ | ----- | ------------ | ------------------- | --------------------------------- |
| `3720:60473` | Homepage                       | FRAME | 1440 × 10394 | native, rebuilt     | `/` (Page)                        |
| `1814:1618`  | Home (Mobile)                  | FRAME | 402 × 11723  | native              | `/`                               |
| `1634:1167`  | Work                           | FRAME | 1440 × 5038  | native              | `/work` (Case Study index)        |
| `1906:851`   | Work (Mobile)                  | FRAME | 402 × 4441   | native              | `/work`                           |
| `1710:2300`  | Case Study                     | FRAME | 1440 × 1440  | native, **emptied** | `/work/{slug}`                    |
| `3739:71101` | Insights                       | FRAME | 1440 × 4444  | native, new         | `/insights` (Insight index)       |
| `2975:8499`  | Insights (Mobile)              | FRAME | 402 × 8517   | native              | `/insights`                       |
| `1710:2823`  | Insights Detail                | FRAME | 1440 × 7567  | native              | `/insights/{slug}` (Insight)      |
| `1906:1046`  | Insights Detail (Mobile)       | FRAME | 402 × 10479  | native              | `/insights/{slug}`                |
| `3754:78274` | About                          | FRAME | 1440 × 8480  | native, new         | `/about` (Page)                   |
| `3883:16493` | About (Mobile)                 | FRAME | 402 × 11060  | native, new         | `/about`                          |
| `1925:6138`  | Solutions                      | FRAME | 1440 × 5468  | native              | `/solutions` (Page)               |
| `2360:2879`  | Solutions Detail (Engineering) | FRAME | 1440 × 6307  | native              | `/solutions/software-engineering` |
| `2354:2446`  | Partner (Sanity)               | FRAME | 1440 × 7224  | native              | `/partners/sanity` (Page)         |
| `1644:1889`  | Live                           | FRAME | 1440 × 4946  | native              | `/live` (Page)                    |
| `1906:334`   | Live - Mobile                  | FRAME | 402 × 5963   | native              | `/live`                           |
| `2960:7557`  | Contact                        | FRAME | 1440 × 1718  | native              | `/contact` (Page)                 |
| `2975:10037` | Contact - Mobile               | FRAME | 402 × 2213   | native              | `/contact`                        |
| `3754:73927` | 404                            | FRAME | 1440 × 2287  | native, new         | `/404` (Page), untracked          |
| `3754:73809` | 404 (Mobile)                   | FRAME | 402 × 2175   | native, new         | `/404`, untracked                 |
| `2960:7022`  | Services                       | FRAME | 1440 × 903   | **capture**         | none                              |
| `3911:18106` | (loose text)                   | TEXT  | 565 × 476    | **debris**          | none                              |

`2960:7022` reads as a capture, not a page, on the layer names rather than the
width: its single child `2960:7023` is named `div`, and below it are
`div:margin`, `p:margin`, `h3:margin`, `a:align-flex-start` and
`span#hww-progress`. Its copy ("What we optimize for.", "Not a menu of services.
One senior team that carries a problem from the first question to the shipped
thing.") is one section of the HTML prototype's homepage, pasted at 1440.

`3911:18106` is a bare `TEXT` node sitting on the canvas next to Partner (Sanity),
holding the five "5-10× faster content production cycles" benefit lines. It is
working material, not a frame.

### Page frames did not move to another canvas

The file has ten canvases. Enumerated at depth 1, only two others hold anything
that could be mistaken for a page layer:

- **Case Studies `1238:557`** holds five real, per-client Case Study detail
  designs at 1440: `Case Study/Ironman` `2748:5295` (1440 × 11387),
  `Case Study/Vertex` `2748:5775`, `Case Study/Best Egg` `3503:10881`,
  `Case Study/Caron` `3174:8901`, `Case Study/L.E.K.` `2817:2589`. This is where
  `/work/{slug}` now lives (see §3).
- **🏗️ Graphic Assets `3194:13275`** holds `✅ Homepage` `3581:34432`
  (1440 × 7065) and `Homepage` `3380:7729` (1600 × 6499). Both sit on an asset
  canvas among client artwork sections; neither is the canonical homepage, which
  is `3720:60473` on Designs.

`🗄️ Archive` `4018:37680` holds two frames both named `Section`. `🛝 Prototype
Components` `3589:4428` and `🧩 Local Components` `1275:1586` hold component sets
only. `Blog Posts` `2408:3208` holds 53 loose images, hero studies and two
sections. `🖼️ Cover`, `–––` and `--` hold nothing relevant.

## 2. Composition of each native design frame

Direct children in canvas order, with the component set behind every `INSTANCE`
(read from the `components` / `componentSets` maps the nodes response returns).

### Homepage `3720:60473` (1440 × 10394)

| Band                      | Node         | Type     | Set                                                              |
| ------------------------- | ------------ | -------- | ---------------------------------------------------------------- |
| Hero                      | `3720:60474` | FRAME    |                                                                  |
| Section - Partners        | `3720:60483` | FRAME    |                                                                  |
| Section - Case Studies    | `3720:60492` | FRAME    |                                                                  |
| Section                   | `3720:60509` | FRAME    |                                                                  |
| Quote                     | `3720:60563` | INSTANCE | Quote `2748:4672` (Device=Desktop, Alignment=Center, Size=Small) |
| Brand Family              | `3720:60564` | FRAME    |                                                                  |
| Blog                      | `3720:60615` | INSTANCE | Blog `2205:1146` (Property 1=Default)                            |
| Combined CTA + Footer     | `3720:62172` | INSTANCE | Combined CTA + Footer `3720:62476` (Device=Desktop)              |
| Brand Navigation          | `3739:71359` | INSTANCE | Brand Navigation `3726:68984` (Theme=Dark, State=Default)        |
| Main Navigation (Desktop) | `3739:71417` | INSTANCE | Main Navigation (Desktop) `3271:17013` (Theme=Dark)              |

The two navigation instances are separate and both present: an 80 × 80 Brand
Navigation mark and a 626 × 80 Main Navigation bar. They are siblings at the top
level of the frame, not one nested inside the other, and the same pair appears on
Work, Insights, Insights Detail, About, Contact, Partner (Sanity) and 404. The
old `Utility Nav` set `2250:1445` is gone; Brand Navigation `3726:68984` is what
occupies its role.

**Brand Family `3720:60564`** (1440 × 1026) is the "Beyond O3" band, moved onto
the homepage. It has exactly two children:

- `3720:60565` "Heading" (1248 × 310), whose only child is an instance of the
  untracked **Standard Content Lockup** molecule `3720:62493`, carrying eyebrow
  "Beyond O3", heading "I need to write a better headline here." and deck "O3 is
  part of a broader ecosystem built to help ambitious teams navigate change, from
  digital experiences to AI strategy".
- `3720:60570` "Cards" (1248 × 396), two plain frames both named "Business Card"
  (`3720:60571`, `3720:60575`). Neither is an instance of the Business Card
  component set `3813:93877`. The first holds a single image rectangle
  `3720:60573`; the second holds the four-group `1682` lockup (`3720:60578`).

So Brand Family is the sibling-brands band the About page used to carry, which is
what the three dead asset sources `about-beyond-1682.png`, `about-beyond-o3xo.png`
and `about-beyond-community.png` were exported from. Its headline is a
placeholder by its own admission, and its cards are detached frames rather than
component instances. It has no counterpart in code today.

Home (Mobile) `1814:1618` mirrors it band for band, with Brand Family at
`3726:68233`, and carries only Main Navigation (Mobile) `3737:69217` (no Brand
Navigation instance).

### Home (Mobile) `1814:1618` (402 × 11723)

Hero `1814:1619`, Section - Partners `3726:62792`, Section - Case Studies
`2975:8108`, Section `2975:8188`, Quote `2748:4804` (Quote `2748:4672`,
Device=Mobile), Brand Family `3726:68233`, Blog `2262:3931` (Blog `2205:1146`,
Property 1=Mobile), Combined CTA + Footer `3726:68508` (Device=Mobile), Main
Navigation (Mobile) `3738:69256`.

### Work `1634:1167` (1440 × 5038)

Interior Hero `2101:861` (Interior Hero `2107:1051`, Device=Desktop, Theme=Dark),
Section `1634:1186`, Quote `3738:70238` (Quote `2748:4672`), Combined CTA + Footer
`3726:62891`, Brand Navigation `3739:71349`, Main Navigation (Desktop) `3814:6280`.

### Work (Mobile) `1906:851` (402 × 4441)

Interior Hero `2107:1086` (Device=Mobile), Section `3813:88949`, Combined CTA +
Footer `3726:68862`, Main Navigation (Mobile) `3738:69348`.

### Case Study `1710:2300` (1440 × 1440)

One child, a `TEXT` node `3703:48500` reading **"Case studies live on the Case
Study page."** The frame is a signpost, not a design.

### Insights `3739:71101` (1440 × 4444)

Interior Hero `3739:71309` (eyebrow "Insights", heading "Looking past the
horizon.", deck "What we're learning, questioning, and putting into practice
across AI, design, and technology."), Blog `3739:71109`, Combined CTA + Footer
`3771:80361`, Brand Navigation `3739:71339`, Main Navigation (Desktop) `3814:6298`.

### Insights (Mobile) `2975:8499` (402 × 8517)

Interior Hero `2975:8500`, "Case studies" `2975:8501` (the layer name is wrong for
its contents; this is the insight feed), Combined CTA + Footer `3754:73638`, Main
Navigation (Mobile) `3883:16735`.

### Insights Detail `1710:2823` (1440 × 7567)

Blog Hero `3739:73191` (Blog Hero `3394:11412`, Type=Logo, Device=Desktop),
Content Area `1710:2835`, Blog `2252:3675`, Combined CTA + Footer `3771:80629`,
Brand Navigation `3739:73213`, Main Navigation (Desktop) `3814:6317`.

### Insights Detail (Mobile) `1906:1046` (402 × 10479)

Blog Hero `3754:73244` (Type=Image, Device=Mobile), Content Area `2262:3818`, Blog
`2262:3905`, Combined CTA + Footer `3771:80856`, Main Navigation (Mobile)
`3883:16752`.

### About `3754:78274` (1440 × 8480)

Hero `3754:78486` (eyebrow "About O3", heading "Small studio. Big ideas. 20+ years
of asking better questions and building better answers."), Photo `3754:78276`,
Section `3764:78635`, Photo `4061:50283`, Section `3771:80603`, Section
`3771:80621`, Team `3771:80235`, Combined CTA + Footer `3771:80902`, Brand
Navigation `3754:78341` (**Theme=Light**), Main Navigation (Desktop) `3814:6334`
(**Theme=Light**).

About and Contact are the only two desktop frames on a light nav theme.

### About (Mobile) `3883:16493` (402 × 11060)

Hero `3883:16494` (same eyebrow and heading as desktop), Photo `3883:16498`,
Section `3883:16504`, Photo `3883:16517`, Section `3883:16531`, Section
`3883:16535`, Team `3883:16541`, Combined CTA + Footer `3888:16863`, Main
Navigation (Mobile) `3883:16769` (Theme=Light).

### Solutions `1925:6138` (1440 × 5468)

Hero `4018:37923` (eyebrow "Solutions", heading "Strategy, design, engineering,
and AI within one orbit."), Section `4018:38214`, Section `4018:37995`, Combined
CTA + Footer `4018:37931`, Main Navigation (Desktop) `2250:2251`. No Brand
Navigation instance.

### Solutions Detail (Engineering) `2360:2879` (1440 × 6307)

Interior Hero `2354:2583`, Section `2360:2861`, Main Navigation (Desktop)
`2354:2584`, Section `4039:49384`, Section `4036:49060`, Section `4039:49500`,
Combined CTA + Footer `4043:49566`. No Brand Navigation instance. The nav sits
third in child order rather than last, which is layer ordering rather than layout.

### Partner (Sanity) `2354:2446` (1440 × 7224)

Interior Hero `2401:3185` (a plain frame here, not an instance of
`2107:1051`), Section - Partners `3895:17711`, Section `4061:50189`, Section
`2354:2530`, Section `4043:49738`, Section `2334:2122`, Combined CTA + Footer
`3911:18053`, Brand Navigation `3984:35171`, Main Navigation (Desktop) `3984:35154`.

### Live `1644:1889` (1440 × 4946)

Interior Hero `2107:1023`, "Case studies" `1644:1904`, Frame 2611290 `1710:1800`,
Frame 2611289 `1732:1409`, Frame 2611286 `2975:8763`, **Footer** `2435:2040`
(the old Footer set `1280:1885` / `2225:2672`, not Combined CTA + Footer), Main
Navigation (Desktop) `2250:2179`.

Live desktop is the only page frame still on the standalone Footer component. Every
other desktop frame on the canvas now closes with Combined CTA + Footer `3720:62476`.

### Live - Mobile `1906:334` (402 × 5963)

Interior Hero `2107:1065`, "Case studies" `1906:342`, Frame 2611290 `1906:579`,
Frame 2611291 `1906:675`, **ClaudeTest** `2975:8776`, "Case studies" `1906:452`,
Links `1906:547`.

This frame has no footer instance and no navigation instance, and it carries a
frame literally named `ClaudeTest`. It is the least finished page frame on the
canvas.

### Contact `2960:7557` (1440 × 1718)

Section `2960:7792` (eyebrow "Let's talk", heading "Tell us what you've got
cooking.", a Form with Name/Email rows, a Message field, a "Sign up for our
newsletter" checkbox and a "Start a conversation" button), Combined CTA + Footer
`3754:77950`, Brand Navigation `3754:78119` (Theme=Light), Main Navigation
(Desktop) `3814:6412` (Theme=Light).

### Contact - Mobile `2975:10037` (402 × 2213)

Section `3754:78225`, Combined CTA + Footer `3754:78129`, Main Navigation (Mobile)
`3754:77933`.

### 404 `3754:73927` (1440 × 2287)

Section `3754:76346` (a Stars field, a "Go home" button, "This jawn doesn't
exist.", "The page you're looking for may have moved, disappeared, or never
existed in the first place.", and a `404` numeral group built from two `4`s and a
Molecule), Combined CTA + Footer `4043:49842`, Main Navigation (Desktop)
`3814:6395`, Brand Navigation `3754:74054`.

### 404 (Mobile) `3754:73809` (402 × 2175)

Section `3754:77524`, Combined CTA + Footer `4043:49988`, Main Navigation (Mobile)
`3754:73926`.

### Case Study detail, on the Case Studies canvas

`Case Study/Ironman` `2748:5295` (1440 × 11387): IRONMAN-Hero3 `3249:20846`, Case
Study Text Block `3267:9701`, Section - Full-Width Image `3576:24877`, Case Study
Text Block `3267:9743`, Image Section `3578:29241`, Case Study Text Block
`3267:9770`, Image Section `3578:29832`, Case Study Text Block `3267:9784`, Quote
`3267:2486`, Case Study Text Block `3267:9644`, Section - Next `3267:9463`, Footer
`2748:5485` (old Footer set), Brand Navigation `3858:7901`, Main Navigation
(Desktop) `2748:5486`.

`Case Study/Best Egg` `3503:10881` (1440 × 10037) has the same spine and has
already moved to Combined CTA + Footer (`3858:15918`). The recurring band is an
instance of an untracked component, **Case Study Text Block** `3265:1650`,
alternating with full-width image sections. That interleave is exactly ADR 0018's
chapters-and-bands story shape.

## 3. Manifest repair table

Every replacement below was confirmed by frame name, dimensions **and**
composition, not by name alone.

| Manifest entry                                 | Dead id     | Replacement                                    | Confirmed by                                                                                                                                                                                                                                                                |
| ---------------------------------------------- | ----------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home, desktop, `/`                             | `1680:2134` | **`3720:60473` "Homepage"**, 1440 × 10394      | Only 1440 homepage on the canvas; Hero copy "You see the problem in front of you." and the Hero → Partners → Case Studies → Section → Quote → Blog → CTA spine match Home (Mobile) `1814:1618` band for band                                                                |
| About, desktop, `/about`                       | `1924:5344` | **`3754:78274` "About"**, 1440 × 8480          | Hero eyebrow "About O3", heading "Small studio. Big ideas.", Team band `3771:80235`; light nav theme                                                                                                                                                                        |
| About, mobile, `/about`                        | `2975:8865` | **`3883:16493` "About (Mobile)"**, 402 × 11060 | Same eyebrow, heading and deck as `3754:78274`; same seven-band order (Hero, Photo, Section, Photo, Section, Section, Team); light nav theme                                                                                                                                |
| Insight index, desktop, `/insights`            | `2336:4310` | **`3739:71101` "Insights"**, 1440 × 4444       | Interior Hero eyebrow "Insights", deck "What we're learning, questioning, and putting into practice across AI, design, and technology."; a Blog feed band `3739:71109`, not an article Content Area. Distinct from Insights Detail `1710:2823`, which is an article         |
| Case Study detail, mobile, `/work/{slug}`      | `1906:928`  | **Deleted, no replacement on any page.**       | No 402 case-study frame exists on Designs, Case Studies, Archive or anywhere else. Designs `1710:2300` is now a 1440 × 1440 signpost reading "Case studies live on the Case Study page."; the desktop design moved to the five per-client frames on Case Studies `1238:557` |
| Sanity partnership, mobile, `/partners/sanity` | `2975:9343` | **Deleted, no replacement on any page.**       | Desktop `2354:2446` survives and was modified; no 402 partner frame exists anywhere in the file                                                                                                                                                                             |

The two inferred component-set rows from the findings document are confirmed by
usage rather than by reading both subtrees:

- **Utility Nav `2250:1445` → Brand Navigation `3726:68984`.** Every rebuilt
  desktop frame instances Brand Navigation at 80 × 80 alongside Main Navigation,
  in the role Utility Nav held. The code component the manifest points the old
  entry at is `packages/content-ui/src/chrome/UtilityNav.tsx#UtilityNav`.
- **CTA `2177:1354` → Combined CTA + Footer `3720:62476`.** Eleven of the twelve
  page frames that still have a closer instance it; the set carries a `Device`
  axis (Desktop `3720:61986`, Mobile `3720:62322`) and replaces both the old CTA
  set and, on all but Live desktop, the Footer set `1280:1885`.
- **Case study cards `1393:3025`**: drop it. `2089:4169` "Case Study Card" is
  tracked and current.

### Also required, and not an id swap

`manifest.sectionNodeIds` is `['1632:1510']`, a section that no longer exists.
Point it at the canvas `1126:1100`. The untracked-frame probe has been returning
an empty list for a reason that is not "nothing is new".

### Frames the manifest has never heard of

| Node         | Name         | Recommendation                                  | Reason                                                                                                                                                                                                                                                                                                        |
| ------------ | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `3754:73927` | 404          | **Track** as `pageFrame`, route `/404`, desktop | Native 1440, full page chrome (Main Navigation, Brand Navigation, Combined CTA + Footer), authored copy. There is no `/404` design today and the live site has the route                                                                                                                                      |
| `3754:73809` | 404 (Mobile) | **Track**, route `/404`, mobile                 | Native 402, same band order as its desktop pair                                                                                                                                                                                                                                                               |
| `2960:7022`  | Services     | **Ignore**, with reason                         | 1440 × 903, one child named `div`, grandchildren `div:margin` / `p:margin` / `h3:margin` / `a:align-flex-start` / `span#hww-progress`. An html.to.design paste of one section of the prototype homepage, not a page. `Solutions` `1925:6138` remains the real `/solutions` frame and was modified in this run |
| `3911:18106` | (loose TEXT) | **Ignore**, with reason                         | A bare `TEXT` node on the canvas holding five benefit lines, working material beside Partner (Sanity)                                                                                                                                                                                                         |
| `1710:2300`  | Case Study   | **Re-point, do not ignore**                     | Still tracked as `/work/{slug}` desktop. It is now a signpost; the design it points to is the five frames on the Case Studies canvas. Needs a decision, not a rename (see Open questions)                                                                                                                     |

Case Studies canvas `1238:557` frames (`2748:5295`, `2748:5775`, `3503:10881`,
`3174:8901`, `2817:2589`) are not recommended for tracking here, because whether
`/work/{slug}` is one template frame or five per-client compositions is a
question this ticket does not get to answer.

## 4. Mobile coverage after the re-architecture

| Page layer           | Route                             | Desktop                   | Mobile       | Status                                                                                                       |
| -------------------- | --------------------------------- | ------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| Home                 | `/`                               | `3720:60473`              | `1814:1618`  | both                                                                                                         |
| Work index           | `/work`                           | `1634:1167`               | `1906:851`   | both                                                                                                         |
| Case Study detail    | `/work/{slug}`                    | five frames on `1238:557` | none         | **desktop only**; `1906:928` deleted with no replacement, and the desktop frame on Designs is now a signpost |
| Insight index        | `/insights`                       | `3739:71101`              | `2975:8499`  | both                                                                                                         |
| Insight detail       | `/insights/{slug}`                | `1710:2823`               | `1906:1046`  | both                                                                                                         |
| About                | `/about`                          | `3754:78274`              | `3883:16493` | both, both rebuilt                                                                                           |
| Solutions            | `/solutions`                      | `1925:6138`               | none         | desktop only, unchanged gap                                                                                  |
| Software Engineering | `/solutions/software-engineering` | `2360:2879`               | none         | desktop only, unchanged gap                                                                                  |
| Sanity partnership   | `/partners/sanity`                | `2354:2446`               | none         | **desktop only**; `2975:9343` deleted with no replacement                                                    |
| Live                 | `/live`                           | `1644:1889`               | `1906:334`   | both, mobile unfinished (no nav, no footer, a `ClaudeTest` band)                                             |
| Contact              | `/contact`                        | `2960:7557`               | `2975:10037` | both                                                                                                         |
| 404                  | `/404`                            | `3754:73927`              | `3754:73809` | both, neither tracked                                                                                        |

Two mobile frames were deleted with no replacement anywhere in the file: Case
Study detail `1906:928` and Sanity partnership `2975:9343`. In the same pass About
mobile was rebuilt rather than dropped, so this does not read as a blanket
narrowing. Whether those two routes now have no mobile design on purpose is Nick's
call, not a finding.

## 5. Modified-in-place frames, first pass

Composition only, against the compositions
`origin/research/figma-frame-inventory:docs/figma-frames.md` recorded. No pixel or
value comparison.

| Frame                                  | Band change                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home (Mobile) `1814:1618`              | Old: Hero → Intro section → Case Studies → two list sections → Blog → CTA → Footer. Now: Hero → Section - Partners → Section - Case Studies → Section → Quote → **Brand Family** → Blog → Combined CTA + Footer → Main Navigation (Mobile). Added: Section - Partners, Brand Family. Renamed: "Intro section" → Quote instance; one of the two list sections is gone. CTA and Footer merged into one instance |
| Work index desktop `1634:1167`         | Old: Hero → three case-study cards → CTA → Footer. Now: Interior Hero instance → Section → **Quote** → Combined CTA + Footer. Added: Quote. The hero became an instance of Interior Hero `2107:1051`; the three loose cards are inside `1634:1186`                                                                                                                                                            |
| Work index mobile `1906:851`           | Now: Interior Hero → Section → Combined CTA + Footer → Main Navigation (Mobile). No Quote band, unlike desktop. CTA and Footer merged                                                                                                                                                                                                                                                                         |
| Case Study detail desktop `1710:2300`  | **Emptied.** From a full page (hero → chapters → panoramic image → screenshot stack → quote → Blog → Footer) to one text node. The content moved to five per-client frames on the Case Studies canvas, which use an untracked Case Study Text Block component `3265:1650`                                                                                                                                     |
| Insight detail desktop `1710:2823`     | Old: hero → three prose sections → "Keep reading." row → CTA → Footer. Now: **Blog Hero** instance `3394:11412` → Content Area → Blog → Combined CTA + Footer → Brand Navigation → Main Navigation. The bespoke hero became a component instance with Type and Device axes                                                                                                                                    |
| Insight detail mobile `1906:1046`      | Same shape as desktop; Blog Hero on the Type=Image variant rather than Type=Logo                                                                                                                                                                                                                                                                                                                              |
| Solutions `1925:6138`                  | Old: Hero → 1120 × 1172 diagram block → "Three ways in." with three engagement cards → CTA → Footer. Now: Hero `4018:37923` → Section `4018:38214` → Section `4018:37995` → Combined CTA + Footer. Band count is the same; every band node id is new (`4018:*`), so the page was redrawn rather than edited                                                                                                   |
| Software Engineering `2360:2879`       | Now five content bands (`2360:2861`, `4039:49384`, `4036:49060`, `4039:49500`) under Interior Hero, closing on Combined CTA + Footer. Three of the five band ids are new `40xx` nodes: sections added                                                                                                                                                                                                         |
| Sanity partnership desktop `2354:2446` | Now Interior Hero → **Section - Partners** `3895:17711` → four Sections → Combined CTA + Footer. Two of the four sections are new `40xx` nodes (`4061:50189`, `4043:49738`), plus the new Partners band                                                                                                                                                                                                       |
| Live desktop `1644:1889`               | Old: Hero → Blog → "Where to find us" → "Ideas we're chasing" → CTA → Footer. Now: Interior Hero → Case studies → three unnamed frames → **Footer only**. Still on the old Footer set `1280:1885`; no CTA band and no Brand Navigation. The least converged desktop frame                                                                                                                                     |
| Live mobile `1906:334`                 | Interior Hero → five bands including `ClaudeTest` `2975:8776` → Links. No footer instance, no nav instance                                                                                                                                                                                                                                                                                                    |
| Contact desktop `2960:7557`            | Not in the old inventory (the inventory lists Contact as "no frame anywhere"). Now a single form Section plus Combined CTA + Footer and a light-theme nav pair                                                                                                                                                                                                                                                |
| Contact mobile `2975:10037`            | Same, one Section plus closer and nav                                                                                                                                                                                                                                                                                                                                                                         |
| Insight index mobile `2975:8499`       | Not in the old inventory either. Interior Hero → a feed band still named "Case studies" `2975:8501` → Combined CTA + Footer → Main Navigation (Mobile)                                                                                                                                                                                                                                                        |

The single largest pattern across all fourteen: **the CTA band and the Footer band
became one instance**, Combined CTA + Footer `3720:62476`, on every frame except
Live desktop and `Case Study/Ironman`. That is one change, not fourteen.

## Open questions for the map

None of these is decided here.

1. **What is `/work/{slug}` now?** The tracked desktop frame `1710:2300` is a
   signpost, and the Case Studies canvas holds five per-client compositions rather
   than one template. Does the manifest track one of the five as the template,
   track all five, or track none and record the canvas? The five differ: Ironman
   still closes on the old Footer, Best Egg on Combined CTA + Footer.
2. **Case Study detail mobile and Sanity partnership mobile are gone.** Remove the
   two manifest entries, or keep them as recorded gaps? About mobile was rebuilt
   in the same pass, so this is not obviously a policy.
3. **Brand Family.** The homepage now carries a band with placeholder copy ("I
   need to write a better headline here."), two detached frames where the Business
   Card component set `3813:93877` exists, and no counterpart in code. Build it,
   or treat it as unfinished design and hold?
4. **404.** Track `3754:73927` and `3754:73809`, giving the manifest its first
   utility-page entries?
5. **Live.** Desktop is the only frame still on the standalone Footer set; mobile
   has no nav, no footer and a band named `ClaudeTest`. Is Live still a live page
   layer, or has it fallen out of the design?
6. **Untracked components the page frames now depend on.** Combined CTA + Footer
   `3720:62476`, Brand Navigation `3726:68984`, Main Navigation (Mobile)
   `3737:69217`, Blog Hero `3394:11412`, Standard Content Lockup `3720:62493`,
   Case Study Text Block `3265:1650` and Business Card `3813:93877` are all
   instanced by canonical frames and none is in the component map. That is the
   component half of this repair, and it is not this ticket.
7. **The Graphic Assets homepages.** `✅ Homepage` `3581:34432` and `Homepage`
   `3380:7729` sit on the asset canvas. The check mark in the name suggests
   somebody approved something. Confirm they are exports, not a competing design.

## Provenance

- File key `RvraLJaZ0zWm8UaD5AJf43`, version `2400647235422861907`, read
  2026-09-18 via `/v1/files/:key/nodes` at depths 1 to 5.
- Manifest: `tools/figma-sync/data/tracked-nodes.json` (20 `pageFrame` entries,
  23 `componentSet` entries, 8 `ignoredNodeIds`).
- Sync report: `tools/figma-sync/data/report.json`, run 2026-09-18 (uncommitted).
- Prior inventory: `origin/research/figma-frame-inventory:docs/figma-frames.md`.
