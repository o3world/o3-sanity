# The four component sections after the 2026-09 re-architecture

Resolves [#477](https://github.com/o3world/o3-sanity/issues/477), under map
[#476](https://github.com/o3world/o3-sanity/issues/476).

**File:** `RvraLJaZ0zWm8UaD5AJf43`, "🅾️ 2026 O3DX Website", version
`2400647235422861907`, `lastModified` 2026-09-18T19:45:44Z. Read 2026-09-18 over
`/v1/files/:key/nodes` with the REST token in `apps/web/.env.local`. Instance
counts come from a walk of each page frame at `depth=5`, matching every
`INSTANCE`'s `componentId` to a set through the response's own `components` and
`componentSets` maps.

Its sibling is
[`figma-2026-page-frame-inventory.md`](./figma-2026-page-frame-inventory.md),
which covers the page frames; the founding document is
[`figma-2026-rearchitecture-findings.md`](./figma-2026-rearchitecture-findings.md).
This document supersedes the inventory half of
[`docs/figma-components.md`](../figma-components.md), which was written against
the file's previous structure.

It decides nothing. Every recommendation below is a recommendation.

## What this answers

`🧩 Local Components` `1275:1586` is now four named sections plus one loose
component, and a second page, `🛝 Prototype Components` `3589:4428`, holds nine
more sets. This document lists every set and lone component in those six
containers with its node id, variant axes, non-variant props and Figma Default;
counts how many canonical page frames instance each one; names the code that
draws it and rules on the fit; and settles the two successions the founding
document left as inference.

Two endpoints that would have made this cheap return nothing:
`/v1/files/:key/components` and `/v1/files/:key/component_sets` both answer
`{"meta":{"components":[]}}`. The file publishes no library, so every fact below
is read from the node tree.

## Summary

Instance counts are over the 21 page frames of the Designs canvas `1126:1100`
(the 22nd child is a loose `TEXT` node). The **Case Studies** column counts the
five frames of the Case Studies canvas `1238:557`, which the Designs canvas
delegates to: `Case Study` `1710:2300` is a 1440 × 1440 frame holding one line
of text, "Case studies live on the Case Study page."

| Set                                     | Node         | Axes (Figma Default in bold)                                                                                                                                    | Designs | Case Studies | Code                                              | Verdict                                                  |
| --------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------ | ------------------------------------------------- | -------------------------------------------------------- |
| **Atoms** `3720:62477`                  |              |                                                                                                                                                                 |         |              |                                                   |                                                          |
| Button                                  | `2134:1785`  | Style **Primary**\|Secondary; Theme **Neutral**\|Inverse\|Brand\|Subtle; State **Default**\|Hover\|Press\|Focus\|Disabled                                       | 57      | 9            | `Button` (`ui/ui/button.tsx`), `FilterChip`       | diverges: `Style` unmodelled, 2 of 4 Themes built        |
| Icon                                    | `2177:1556`  | Icon = 29 glyphs (**square**)                                                                                                                                   | 77      | 18           | `BUTTON_ICONS` (`ui/button-icons.tsx`)            | diverges by policy: 3 curated, 26 route nowhere          |
| Icon Button                             | `2134:1724`  | Primary **Primary**\|Secondary; Theme **Neutral**\|Inverse\|Brand\|Subtle; State ×5                                                                             | 19      | 8            | `CarouselControl`, the `MobileNavMenu` trigger    | diverges: no theme or style axis in code                 |
| Link                                    | `2225:2894`  | State **Default**\|Hover\|Active                                                                                                                                | 44      | 20           | `NavLink` (`content-ui/chrome`)                   | matches                                                  |
| Molecule                                | `2250:1498`  | none (lone COMPONENT)                                                                                                                                           | 18      | 4            | `MoleculeMark` (`ui/molecule-mark.tsx`)           | matches                                                  |
| Go birds.                               | `1275:1631`  | State **Default**\|Hover                                                                                                                                        | 1       | 1            | none                                              | matches: easter egg, ruled non-canonical in #38          |
| **Molecules** `3720:62479`              |              |                                                                                                                                                                 |         |              |                                                   |                                                          |
| Standard Content Lockup                 | `3720:62493` | none (lone COMPONENT)                                                                                                                                           | 45      | 0            | none                                              | **missing**: every band draws it inline                  |
| Case Study Content Lockup               | `3858:8308`  | none (lone COMPONENT)                                                                                                                                           | 0       | 0            | none                                              | not adopted: zero instances anywhere                     |
| **Components** `3726:68554`             |              |                                                                                                                                                                 |         |              |                                                   |                                                          |
| Case Study Card                         | `2089:4169`  | Variant **Ironman**\|Vertex\|Caron\|Best Egg\|L.E.K.; Device **Desktop**\|Mobile                                                                                | 16      | 5            | `CaseStudyCard` (`apps/web/src/components/cards`) | matches: both axes are content and breakpoint, not `cva` |
| Main Navigation (Desktop)               | `3271:17013` | Theme **Dark**\|Light                                                                                                                                           | 11      | 5            | `SiteNav` (`content-ui/chrome`)                   | matches: Theme is derived at runtime by `NavInk`         |
| Main Navigation (Mobile)                | `3737:69217` | Theme **Dark**\|Light                                                                                                                                           | 7       | 0            | `SiteNav` below `lg` + `MobileNavMenu`            | matches                                                  |
| Brand Navigation                        | `3726:68984` | Theme **Dark**\|Light; State **Default**\|Open                                                                                                                  | 8       | 5            | `UtilityNav` (`content-ui/chrome`)                | **diverges structurally**, see §4                        |
| Blog Post Card                          | `3269:12839` | none (lone COMPONENT)                                                                                                                                           | 44      | 0            | `InsightCard` (`content-ui/cards`)                | matches                                                  |
| Employee Card                           | `3767:80011` | none (lone COMPONENT)                                                                                                                                           | 18      | 0            | `PortraitTile` inside `PersonGridSection`         | matches                                                  |
| Business Card                           | `3813:93877` | none (lone COMPONENT)                                                                                                                                           | 4       | 0            | none                                              | **missing**                                              |
| Case Study Text Block                   | `3265:1650`  | booleans Show Stats (**false**), Show Phases (**false**); text Number, Eyebrow, Heading, Copy                                                                   | 0       | 23           | `CaseChapter` (`ui/case-chapter.tsx`)             | diverges: no phases row                                  |
| **Sections** `3726:68560`               |              |                                                                                                                                                                 |         |              |                                                   |                                                          |
| Combined CTA + Footer                   | `3720:62476` | Device **Desktop**\|Mobile                                                                                                                                      | 17      | 4            | `CtaSection` + `SiteFooter`, two blocks           | **diverges structurally**, see §4                        |
| Interior Hero                           | `2107:1051`  | Device **Desktop**\|Mobile; Theme **Dark**\|Light                                                                                                               | 7       | 0            | `CollectionHero variant="interior"`               | matches: axis renamed from `Surface`                     |
| Blog Hero                               | `3394:11412` | Type **Logo**\|Image; Device **Desktop**\|Mobile; text Category, Title, Body                                                                                    | 2       | 0            | the hero drawn inline in `InsightView`            | diverges: no Type axis                                   |
| Blog                                    | `2205:1146`  | Property 1 **Default**\|Mobile                                                                                                                                  | 4       | 0            | `InsightsCarouselSection`                         | matches                                                  |
| Quote                                   | `2748:4672`  | Device **Desktop**\|Mobile; Alignment Left\|**Center**; Size **Default**\|Small; boolean Gallery (**true**); text Quote, Attribution Title, Attribution Company | 3       | 4            | `QuoteSection`                                    | diverges: no Alignment or Size axis                      |
| **Loose on the canvas**                 |              |                                                                                                                                                                 |         |              |                                                   |                                                          |
| Service Line                            | `4061:50332` | none (lone COMPONENT)                                                                                                                                           | 1       | 0            | `PanelTrack` (`blocks/section/railPanelsSection`) | supersedes `Services` `2846:5637`; see §5                |
| **🛝 Prototype Components** `3589:4428` |              |                                                                                                                                                                 |         |              |                                                   |                                                          |
| NavBar                                  | `3589:4743`  | State **Default**\|Open                                                                                                                                         | 0       | 0            | none                                              | superseded by Brand Navigation; see §6                   |
| Stars                                   | `3589:5504`  | Frame **1**\|2\|3                                                                                                                                               | 3       | 0            | none identified                                   | not audited                                              |
| Subheading                              | `3589:7210`  | Frame **1**\|2\|3\|4                                                                                                                                            | 1       | 0            | none identified                                   | not audited                                              |
| Section - Partners                      | `3606:17825` | Frame **1**\|2\|3                                                                                                                                               | 2       | 0            | `LogoWallSection`                                 | not audited                                              |
| Molecule 3                              | `3661:44478` | none (lone COMPONENT)                                                                                                                                           | 0       | 0            | none                                              | not adopted                                              |
| Dot Circle                              | `3974:25648` | Frame = 17 values (**Frame 1**)                                                                                                                                 | 1       | 0            | none                                              | not audited                                              |
| Dot Circle                              | `3977:30855` | Frame = 6 values (**Frame 1**)                                                                                                                                  | 1       | 0            | none                                              | not audited                                              |
| Dot Circle                              | `4030:40148` | Frame = 16 values (**Frame 1**)                                                                                                                                 | 1       | 0            | none                                              | not audited                                              |
| Dot Circle                              | `3982:33394` | Frame = 4 values (**Frame 1**)                                                                                                                                  | 1       | 0            | none                                              | not audited                                              |

**No set in the file is remote.** Every node above returned its children on a
`depth=1` read, so all thirty subtrees live in this file and none is an
instance of another library.

## 1. What the founding document's roster misses

The four sections hold thirty-one direct children, not the eighteen the founding
document lists. Its additions and corrections:

| Container                         | Missing from the roster                                                                                     | What it is                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Atoms `3720:62477`                | `Go birds.` `1275:1631`, COMPONENT_SET                                                                      | The easter egg #38 already ruled non-canonical. One instance, on Live.                                              |
| Atoms                             | `Molecule` `2250:1498`, COMPONENT                                                                           | The molecule mark. 18 instances across 15 frames, the most widely instanced decoration in the file.                 |
| Components `3726:68554`           | `Case Study Text Block` `3265:1650`, COMPONENT                                                              | 23 instances across all five case-study frames. The single busiest component on that canvas.                        |
| Components                        | `3575:24067`, INSTANCE                                                                                      | A stray instance of `Case Study Text Block` sitting loose in the section, not a component.                          |
| Components                        | Six `GROUP`s: `3726:68936/68937/69037/69040`, `3737:69218/69221`                                            | Named "Light Background" / "Dark Background", the display plates the section draws its nav sets on. Not components. |
| `🧩 Local Components` `1275:1586` | `Service Line` `4061:50332`, COMPONENT                                                                      | Loose on the canvas, in none of the four sections. See §5.                                                          |
| Prototype `3589:4428`             | `Stars` `3589:5504`, `Subheading` `3589:7210`, `Section - Partners` `3606:17825`, `Molecule 3` `3661:44478` | Four more sets beside NavBar and the four Dot Circles.                                                              |

Two roster entries are also wrong in kind: **Standard Content Lockup**
`3720:62493`, **Case Study Content Lockup** `3858:8308`, **Blog Post Card**
`3269:12839`, **Employee Card** `3767:80011` and **Business Card** `3813:93877`
are lone `COMPONENT`s, not component sets. None carries a single property
definition, so there is nothing for `figma:sync` to watch as an axis and nothing
for a `cva` key to answer to.

## 2. Axes that moved since `docs/figma-components.md` was written

Three recorded axes no longer describe the file.

**`Button` `2134:1785` grew a second fill axis.** The map records
`Theme = Black | White | Red`. The set now carries **`Style = Primary |
Secondary`** and **`Theme = Neutral | Inverse | Brand | Subtle`**, thirty-five
members where the map assumes fifteen. `Button` in code has
`variant: dark | light | ghost`, which answers `Theme=Neutral` and
`Theme=Inverse` only; `Brand` and `Subtle` are unbuilt, and the whole `Style`
axis has no counterpart. `ghost` remains a code-only fill; the old
`Button / Ghost` `264:260` it was drawn from is not in the new Atoms section.

**`Icon Button` `2134:1724` carries the same three axes**, with the first one
mis-named in Figma: the property is spelled `Primary` and its values are
`Primary | Secondary`, so the axis name and its own value collide. `CarouselControl`
takes a single `direction: 'prev' | 'next'` prop and no theme, which is the
whole of the divergence.

**`Case Study Card` `2089:4169` gained a `Device` axis and two variants.** The
map records `Variant = Caron | Ironman | Vertex`; the set now draws five clients
× `Desktop | Mobile`, ten members. The Variant axis is still content rather than
design (#302's ruling holds), and `Device` is a breakpoint, which ADR 0006
makes a renderer concern. So neither becomes a `cva` key, and `CaseStudyCard`
needs no change on this account.

**`Interior Hero` `2107:1051` renamed its second axis.** `Surface = Ink | White`
is now `Theme = Dark | Light`. `CollectionHero` models it as
`surface: 'ink' | 'white' | 'paper' | 'bone'`, a wider vocabulary than the set
draws, which is the existing #311 position and is unaffected by the rename.

**`Blog Hero` `3394:11412` is a half-filled matrix.** It declares `Type` and
`Device`, four combinations, and draws two: `Type=Logo, Device=Desktop`
(`3394:11411`) and `Type=Image, Device=Mobile` (`3394:11410`). There is no
desktop image hero and no mobile logo hero in the file.

## 3. Usage, and what it says about adoption

The standing rule is that a set instanced zero times on a canonical frame is not
adopted. Against the 21 Designs-canvas frames plus the five case-study frames:

- **Zero instances anywhere in the file**: `Case Study Content Lockup`
  `3858:8308`, `Molecule 3` `3661:44478`, `NavBar` `3589:4743`.
- **Zero on the Designs canvas but heavily used on Case Studies**:
  `Case Study Text Block` `3265:1650`, 23 instances. Counting only the Designs
  canvas would have called it unadopted, which is the reason the Case Studies
  canvas is counted separately above.
- **Used on every desktop frame that has a footer**: `Combined CTA + Footer`
  `3720:62476`, 17 of 21 Designs frames and 4 of 5 case studies.

`Standard Content Lockup` `3720:62493` is the file's most-instanced molecule
after the atoms: **45 instances across 17 of the 21 frames**, five each on
Homepage, Home (Mobile), About, About (Mobile), Partner (Sanity) and Solutions
Detail (Engineering). It is an eyebrow, a heading and a body paragraph in a
608px column, with no properties at all. Nothing in `packages/ui` or
`packages/content-ui` is that lockup; each section block composes `Eyebrow`,
`DisplayHeading` and its body text itself. That is the single largest gap this
inventory found.

### Generation-1 components survive on exactly one route

Every instance of a pre-2026-08 component on the Designs canvas is on **Live**
`1644:1889` or **Live - Mobile** `1906:334`:

| Legacy component            | Node        | Where                     |
| --------------------------- | ----------- | ------------------------- |
| `Icon / Surface`            | `778:1862`  | Live ×7                   |
| `Icon / Soft`               | `1203:1227` | Live ×7                   |
| `.building block Icon_text` | `136:14`    | Live ×2, Live - Mobile ×2 |
| `Button / Solid`            | `136:754`   | Live ×1, Live - Mobile ×2 |
| `Footer`                    | `2225:2672` | Live ×1, Live - Mobile ×1 |
| `Brand / Logo`              | `264:50`    | Live - Mobile ×1          |
| `Go birds.`                 | `1275:1631` | Live ×1                   |

Live is the one page the re-architecture did not touch. The old `Footer` set
also survives on **Case Study/Ironman** `2748:5295`, which still instances
`2225:2672` where the other four case studies instance `Combined CTA + Footer`.

The `Services` component `2846:5637` is instanced three times, all of them
inside `Services` `2960:7022`, the 1440 × 903 frame whose only child is named
`div`, which the founding document already reads as an html.to.design paste. No
native frame instances it. Its successor is `Service Line` `4061:50332` (§5).

## 4. The two successions, confirmed and qualified

Both old nodes are gone: `/nodes?ids=2250:1445,2177:1354,1393:3025` returns
`null` for all three. So `Utility Nav`, `CTA` and `Case study cards` are deleted,
not moved.

### `CTA` `2177:1354` → `Combined CTA + Footer` `3720:62476`, **confirmed**

`3720:61986` (`Device=Desktop`, 1440 × 1328) holds two children: `CTA Section`
`3720:62386` (a container with a text block and a `Button` instance) and
`Footer` `3720:61903`, with the footer's own `Upper` and `Lower` rows. One
component now draws both bands.

This is a structural divergence from code, where they are two things: `CtaSection`
(`blocks/section/ctaSection`, a section block an editor places) and `SiteFooter`
(`content-ui/chrome`, chrome the layout mounts). The merge is Figma's, and it
crosses the block/chrome seam. Nothing in the rendered result requires code to
follow, since the two bands are adjacent on every frame that has them, but the
mapping is no longer one component to one renderer, and `docs/figma-components.md`
should say so rather than carry two rows.

The old `Footer` set `2225:2672` and its `Device=Desktop` member `1280:1885`
**still exist as nodes but are empty**: both return zero children at any depth.
`SiteFooter.stories.tsx` points its `figmaDesign` at `1280:1885`, which now
resolves to a husk.

### `Utility Nav` `2250:1445` → `Brand Navigation` `3726:68984`, **refuted as drawn**

The content carries over; the form does not. `UtilityNav` in code is built to a
1440 × 69 full-width black strip reading "O3 Family of Brands" followed by the
1682 and O3XO marks, in flow above the nav pill (#88).

`Brand Navigation` is an **80 × 80 collapsed control** (`3726:69001`,
`Theme=Dark, State=Default`) that expands to **351 × 80** (`3858:8640`,
`State=Open`). Its children are the O3 `Brand / Logo`, two hairline `Rule`
vectors, and the 1682 and O3XO marks, the same three properties, no heading
text, and a width that is a badge rather than a bar. Every frame instances it at
80 × 80; Homepage's is `3739:71359`, 80 × 80.

So the succession holds at the level of "this is what replaced the brand strip",
and `UtilityNav` is the code that has to change, not a different component that
has to be built. It is an open design question whether the strip is gone or
whether `State=Open` is what the strip became; the file draws only the badge.

`UtilityNav.stories.tsx` points `figmaDesign` at the deleted `2250:1445`.

### `Case study cards` `1393:3025` is deleted, and `Case Study Card` is not its successor

`1393:3025` no longer resolves. The founding document's note that it is
"superseded by tracked `2089:4169`" is right about the manifest entry to drop
and wrong about the supersession: `docs/figma-components.md` records that the
Solutions frame instanced `1393:3025` three times for **engagement** cards
(`1925:6112`, #47), which have nothing case-study about them. Those instances
are gone from Solutions `1925:6138`, and nothing in the new Solutions subtree
replaces them with `Case Study Card`. The engagement cards were dropped, not
re-pointed.

## 5. `Service Line` `4061:50332` is loose and is the rail's new column

A `COMPONENT`, 1248px wide, sitting directly on `🧩 Local Components`
`1275:1586` rather than in any of the four sections. It is instanced once, on
**Solutions Detail (Engineering)** `2360:2879`, the same frame that used to
carry `Services` `2846:5637` instances, which now appear only on the `Services`
paste frame. `PanelTrack` (`blocks/section/railPanelsSection`) is the code that
draws that column today; it was built to `2846:5637`.

Where a loose component on the canvas belongs is a placement question the four
sections were created to answer, so its being outside them is itself worth
raising.

## 6. Is `🛝 Prototype Components` canonical? Partly

By the instance rule, **five of its nine members are canonical**: they are
instanced on native design frames, which is the same evidence any Local
Components set has:

| Set                | Node                                     | Instanced on                                                       |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------ |
| Stars              | `3589:5504`                              | Homepage `3720:60473`, 404 `3754:73927`, 404 (Mobile) `3754:73809` |
| Section - Partners | `3606:17825`                             | Homepage, Home (Mobile) `1814:1618`                                |
| Subheading         | `3589:7210`                              | Homepage                                                           |
| Dot Circle         | `3974:25648`, `3977:30855`, `3982:33394` | Partner (Sanity) `2354:2446`                                       |
| Dot Circle         | `4030:40148`                             | Solutions `1925:6138`                                              |

`Molecule 3` `3661:44478` is instanced nowhere.

**NavBar `3589:4743` does not differ from `Main Navigation (Desktop)`
`3271:17013`; it is a copy of `Brand Navigation` `3726:68984`.** Read both
subtrees and the names are the only difference:

|                 | NavBar `3589:4743`                   | Brand Navigation `3726:68984`                  |
| --------------- | ------------------------------------ | ---------------------------------------------- |
| Axes            | State = Default \| Open              | Theme = Dark \| Light; State = Default \| Open |
| `State=Default` | `3589:4741`, 80 × 80                 | `3726:69001`, 80 × 80                          |
| `State=Open`    | `3589:4742`, 351 × 80                | `3858:8640`, 351 × 80                          |
| Children        | 1682, Rule, O3XO, Rule, Brand / Logo | 1682, Rule, O3XO, Rule, Brand / Logo           |

`Main Navigation (Desktop)` `3271:17013` is a different component entirely:
`2225:2920` is 626 × 80 and holds four `Link` instances (Work, Insights,
Solutions, About) and a `Button` reading "Let's talk". The prototype page's
NavBar is the brand badge under an older name, superseded by `Brand Navigation`
when it gained its `Theme` axis, and instanced nowhere.

So the page is not a scratchpad to be ignored, and it is not a second library
either. It is where four live decorations and the partners band happen to live.

## 7. Code that points at nodes the file no longer has

| Reference                                       | Node                     | State                                                                                      |
| ----------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `chrome/UtilityNav.stories.tsx` → `figmaDesign` | `2250:1445`              | deleted                                                                                    |
| `chrome/SiteFooter.stories.tsx` → `figmaDesign` | `1280:1885`              | exists, emptied to zero children                                                           |
| `chrome/SiteNav.stories.tsx` → `figmaDesign`    | `2225:2920`              | live, now the `Theme=Dark` member of `3271:17013`                                          |
| `UtilityNav.tsx` doc comment                    | `2250:1445`, `2250:1453` | deleted                                                                                    |
| `SiteFooter.tsx` doc comment                    | `1280:1885`, `2225:2671` | emptied                                                                                    |
| `button.tsx` doc comment                        | `2134:1786`, `2205:1298` | live, but the axis table above them records the superseded `Theme = Black \| White \| Red` |

## Open questions for the map

1. **`Standard Content Lockup` `3720:62493` has 45 instances and no code.** Is
   it a component to build in `packages/ui`, or is it a Figma convenience that
   the section blocks are right to keep composing inline? Deciding it is build
   work touches seventeen frames' worth of bands; deciding it is not means
   recording that, because the next reader will find the same 45.
2. **Does `Brand Navigation`'s badge replace the utility strip, or contain it?**
   The file draws an 80 × 80 control that opens to 351 × 80 and never draws the
   1440 × 69 strip `UtilityNav` was built to. Whether "O3 Family of Brands" as a
   row is gone or is the `State=Open` panel drawn elsewhere cannot be read from
   these two subtrees.
3. **Does code follow Figma's CTA/footer merge?** `Combined CTA + Footer` is one
   component across a seam code keeps: an editor-placed section block and
   layout-mounted chrome. Following it would move the footer into the block
   registry; not following it leaves the component map with one Figma node
   against two renderers, which the `figma:sync` report cannot express.
4. **`Button`'s `Style = Primary | Secondary` axis.** Thirty-five members where
   code has three fills. Whether `Secondary` is a real second button or a
   redundancy with `Theme` needs a look at the drawn members; this inventory
   read the definitions, not the paint.
5. **Where does `Service Line` `4061:50332` belong?** It sits loose on
   `🧩 Local Components`, outside all four sections, and it is the only thing
   instanced on Solutions Detail (Engineering) where `Services` `2846:5637` used
   to be.
6. **Is Live `1644:1889` in scope for the re-architecture?** It is the only
   route still drawn from generation-1 components (seven `Icon / Surface`, two
   `Button / Solid`, the old `Footer`), and Case Study/Ironman `2748:5295` is
   the one case study still on the old footer. Either they are next, or they are
   deliberately frozen.
7. **`Case Study Content Lockup` `3858:8308` and `Molecule 3` `3661:44478` are
   instanced nowhere.** Draft components, or components drawn for a frame that
   has not been built yet.
8. **`Blog Hero` `3394:11412` draws two of its four combinations.** Whether the
   missing desktop-image and mobile-logo heroes are an omission or a deliberate
   pairing decides whether `InsightView`'s hero needs a `Type` axis at all.
9. **The four `Dot Circle` sets** are frame-by-frame sequences (17, 16, 6 and 4
   members, each axis named `Frame`), which reads as motion drawn as stills.
   Nothing in code corresponds to them, and #33 puts motion outside what static
   frames can express. They are not audited here.
