# The fourth variable generation against the committed tokens

Research for #479, under map #476. Read after
[`figma-2026-rearchitecture-findings.md`](./figma-2026-rearchitecture-findings.md),
whose section 2 this document supersedes on three points.

## What this answers

Section 2 of the re-architecture findings said the palette is stable and named
six new values, most of them "bound twice each, inside the Atoms swatch row,
definition chips rather than usage". This document walked the same scope at full
depth and reports every variable id bound in it, the value each resolves to, and
what the repo has against it.

Three corrections to that reading:

1. **There is no swatch row.** The Atoms section holds `Go birds.`, `Molecule`,
   `Icon`, `Button`, `Icon Button` and `Link`, and nothing else
   (`3720:62477`, six children). The "bound twice each" pattern is the `Button`
   set (`2134:1785`) and the `Icon Button` set (`2134:1724`) binding the same
   colour once each for the same Style/Theme/State cell. The six new values are
   **button interaction states**, not chips.
2. **The palette is stable; the button state ramp is not.** Four of the repo's
   five `--color-btn-*` tokens no longer match anything in the file.
3. **The heading face changed.** Sixty-six text nodes in scope are set in
   **Newsreader**. The site loads Figtree and only Figtree.

The colour _values_ finding holds: every heavily-bound colour outside the button
ramp still resolves to something already in `color.css`.

## Method

`/v1/files/RvraLJaZ0zWm8UaD5AJf43/variables/local` returns 403 on this seat
(`This endpoint requires the file_variables:read scope`) and `/v1/files/:key/styles`
returns `{"styles":[]}`. Variable **names** are unreadable. Confirmed once on
2026-09-18 and not retried.

Values below come from walking every node of ten subtrees through `/v1/files/:key/nodes`
at full depth, pairing each `boundVariables` entry with the resolved value on the
same node. Scope: Homepage `3720:60473`, About `3754:78274`, About (Mobile)
`3883:16493`, Insights `3739:71101`, 404 `3754:73927`, 404 (Mobile) `3754:73809`,
and the four Local Components sections, Atoms `3720:62477`, Molecules `3720:62479`,
Components `3726:68554`, Sections `3726:68560`. All ten roots were confirmed to
resolve to the expected `FRAME` or `SECTION` name before walking.

## Summary of the delta

|                                                                             | Count                                          |
| --------------------------------------------------------------------------- | ---------------------------------------------- |
| Variable ids bound in scope                                                 | 92                                             |
| Ids in the fourth generation (`3700`, `3720:618xx`, `3837`, `3858`, `4030`) | 32                                             |
| Colour values bound that `color.css` has no token for                       | 6                                              |
| Committed colour tokens nothing in scope binds                              | 8                                              |
| Font families in scope                                                      | 3 (Figtree, Newsreader, Thirsty Rough Bol Two) |
| Ids resolving to two values                                                 | 9, all of them a desktop/mobile mode           |

## 1. Every variable id bound in scope

### Fourth generation: colour, `3837:*` and `3858:*`

Every one of these is read off the `Button` and `Icon Button` matrices, where the
variant name states the role. The Reading column is that variant name, not a
guess.

| Id          | Value         | Property       | n   | Reading                                             |
| ----------- | ------------- | -------------- | --- | --------------------------------------------------- |
| `3837:6874` | `#0a0a0b`     | fill, stroke   | 17  | Neutral surface; Secondary Neutral border and label |
| `3837:6875` | `#171615`     | fill           | 2   | Neutral, Hover                                      |
| `3837:6876` | `#000000`     | fill           | 2   | Neutral, Press                                      |
| `3837:6878` | `#f7f7f6`     | fill           | 2   | Secondary Neutral, Hover wash                       |
| `3837:6879` | `#f1f0ec`     | fill           | 2   | Secondary Neutral, Press wash                       |
| `3837:6880` | `#ffffff`     | fill, stroke   | 59  | Inverse surface; Secondary Inverse border and label |
| `3837:6881` | `#f7f7f6`     | fill           | 2   | Inverse, Hover                                      |
| `3837:6882` | `#f1f0ec`     | fill           | 2   | Inverse, Press                                      |
| `3837:6883` | `#393633`     | fill           | 2   | Secondary Inverse, Hover wash                       |
| `3837:6884` | `#55524e`     | fill           | 2   | Secondary Inverse, Press wash                       |
| `3837:6885` | `#eb1000`     | fill, stroke   | 28  | Brand surface; Secondary Brand border and label     |
| `3837:6886` | `#c90e00`     | fill           | 2   | Brand, Hover                                        |
| `3837:6887` | **`#a80b00`** | fill           | 2   | Brand, Press                                        |
| `3837:6888` | **`#fff1f0`** | fill           | 2   | Secondary Brand, Hover wash                         |
| `3837:6889` | **`#ffe0dd`** | fill           | 2   | Secondary Brand, Press wash                         |
| `3837:6890` | `#393633`     | fill           | 4   | Disabled surface, Neutral and Brand                 |
| `3837:6891` | `#76746f`     | fill, stroke   | 34  | Disabled label, icon and border, all themes         |
| `3837:6892` | `#e5e3de`     | fill           | 7   | Disabled surface, Inverse and Subtle                |
| `3837:6894` | `#d6d3cc`     | stroke, effect | 6   | Focus ring, Neutral                                 |
| `3837:6895` | `#aaa69e`     | stroke, effect | 6   | Focus ring, Inverse                                 |
| `3837:6896` | **`#ff958c`** | stroke, effect | 7   | Focus ring, Brand                                   |
| `3858:7951` | `#e5e3de`     | fill           | 7   | Subtle surface                                      |
| `3858:7952` | `#d6d3cc`     | fill           | 2   | Subtle, Hover                                       |
| `3858:7953` | `#aaa69e`     | fill           | 2   | Subtle, Press                                       |
| `3858:7954` | `#aaa69e`     | stroke, effect | 4   | Focus ring, Subtle                                  |

`Theme=Subtle` (`3858:7996`) is a new fourth theme on both button sets, alongside
Neutral, Inverse and Brand. `Style=Secondary` (`3690:46244`) is a new second style:
no fill, a 2px inside stroke and a label in the theme colour.

**Focus is one shape, three colours.** Every `State=Focus` component carries a 2px
`INSIDE` stroke plus a `DROP_SHADOW` at offset 0,0 radius 4, both bound to the same
variable (`2134:1804`, `2134:2032`, `2205:1316`, `3858:8014`). The repo's single
`--color-btn-focus: #242321` describes neither the colour nor the shape.

### Fourth generation: type, `3700:*`

Two size/line-height pairs, both consumed only by the `Quote` section
(`2748:4672`) and its homepage instance.

| Id           | Property   | Desktop | Mobile | Bound on                                         |
| ------------ | ---------- | ------- | ------ | ------------------------------------------------ |
| `3700:48428` | fontSize   | 48      | 30     | Quote, `Size=Default` (`2748:4839`, `3265:2171`) |
| `3700:48429` | lineHeight | 58      | 36     | same                                             |
| `3700:48431` | fontSize   | 36      | 28     | Quote, `Size=Small` (`3265:2244`, `3265:2268`)   |
| `3700:48432` | lineHeight | 44      | 34     | same, plus Homepage `I3720:60563;3265:2244`      |

### Fourth generation: font family, `3720:618xx`

| Id           | Value        | n   | Bound on                                      |
| ------------ | ------------ | --- | --------------------------------------------- |
| `3720:61894` | `Newsreader` | 1   | Homepage `Hero/Heading` `3720:60482` only     |
| `3720:61895` | `Figtree`    | 157 | eyebrows, labels, metadata across every frame |

### Fourth generation: spacing, `4030:*`

| Id           | Property   | Desktop | Mobile | Bound on                                                                                                                                 |
| ------------ | ---------- | ------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `4030:48114` | paddingTop | 112     | 80     | `Interior Hero` all four variants (`2101:828`, `2107:1042`, `3271:16931`, `3271:16948`), `Blog Hero` `3394:11411`, Insights `3739:71309` |

112 and 80 are both absent from `layout.css`, whose band steps are 64, 96, 128, 164
and 192.

### Third generation: `2457:*`, `2459:*`, `2461:*`

| Id          | Value     | Property     | n   |
| ----------- | --------- | ------------ | --- |
| `2457:1854` | `#eb1000` | fill, stroke | 23  |
| `2457:1855` | `#ffffff` | fill, stroke | 85  |
| `2457:1856` | `#eb1000` | fill         | 1   |
| `2459:1857` | `#ffffff` | fill         | 12  |
| `2459:1858` | `#f1f0ec` | fill         | 9   |
| `2459:1863` | `#0a0a0b` | fill         | 3   |
| `2461:2097` | `#aaa69e` | fill         | 23  |

### Second generation: `2050:*`, `2083:*`, `2088:*`

Colour:

| Id          | Value     | n   | Nearest committed token |
| ----------- | --------- | --- | ----------------------- |
| `2050:1200` | `#eb1000` | 30  | `--color-brand`         |
| `2050:1205` | `#c90e00` | 32  | `--color-brand-deep`    |
| `2050:1209` | `#ffffff` | 160 | `--color-white`         |
| `2050:1217` | `#f7f7f6` | 1   | `--color-bone-soft`     |
| `2050:1218` | `#f1f0ec` | 3   | `--color-bone`          |
| `2050:1225` | `#d6d3cc` | 12  | `--color-line`          |
| `2050:1226` | `#aaa69e` | 56  | `--color-on-utility`    |
| `2050:1227` | `#76746f` | 52  | `--color-fg-muted`      |
| `2050:1229` | `#393633` | 1   | none                    |
| `2050:1231` | `#171615` | 3   | none                    |
| `2050:1232` | `#000000` | 21  | `--color-utility`       |
| `2050:1233` | `#0a0a0b` | 45  | `--color-ink`           |
| `2083:1071` | `#0a0a0b` | 256 | `--color-ink`           |
| `2083:1072` | `#55524e` | 31  | `--color-fg-body`       |
| `2083:1073` | `#76746f` | 116 | `--color-fg-muted`      |

Type. Every pair carries a desktop and a mobile value:

| Size id     | LH id       | Desktop | Mobile  | n   | Nearest committed token                   |
| ----------- | ----------- | ------- | ------- | --- | ----------------------------------------- |
| `2050:1306` | `2050:1318` | 64 / 76 | 40 / 44 | 43  | `--text-hero`, `--text-interior-hero`     |
| `2050:1311` | `2050:1319` | 48 / 58 | 38 / 42 | 22  | `--text-display-xl`, `--text-detail-hero` |
| `2050:1308` | `2050:1320` | 24 / 34 | 20 / 26 | 74  | `--text-lead`, `--text-display-sm`        |
| `2050:1307` | `2050:1317` | 18 / 24 | 16 / 20 | 72  | `--text-button`, `--text-eyebrow-lg`      |
| `2050:1314` | `2050:1321` | 20 / 28 | 20 / 28 | 60  | `--text-body`                             |
| `2050:1315` | `2050:1322` | 14 / 20 | 14 / 20 | 10  | `--text-nav`                              |
| `2050:1324` | `2050:1325` | 13 / 15 | 13 / 15 | 75  | `--text-meta`                             |
| `2050:1309` | `2088:1218` | 72 / 86 | n/a     | 1   | none                                      |

Spacing. `2050:1271` to `2050:1281` carry 8, 12, 16, 24, 32, 48, 64, 128, 192, 96
and a 16px mobile gutter. All of them still resolve to the same numbers on every
node that binds them.

### First generation and imported library

`1065:596` is the only `1065:*` id still bound in scope: `itemSpacing` 24, 15
bindings on About and Components.

Ten ids carry a hash prefix (`<40-hex>/<id>`), which is a variable subscribed from
another Figma file rather than defined in this one. The busiest,
`d646738354351f0a087709469010da5dccf01224/542:31`, resolves to 12 and carries 353
bindings of `itemSpacing` and padding across every frame in scope. The rest are
one-offs and two of them resolve to colours nothing else in the file uses
(`#1971e9`, `#030303`).

### Ids resolving to more than one value

Nine: `2050:1306`, `2050:1307`, `2050:1308`, `2050:1311`, `3700:48428`,
`3700:48431`, `4030:48114`, and the size/line-height partners of each. Every one of
them splits cleanly by device: the smaller value appears only inside a frame or
component variant named Mobile, the larger only outside one. This is a mode on the
collection, not a mis-read. It is also the first time the file has expressed the
responsive ramp as variable modes rather than as two separate frames, which is what
`typography.css` currently encodes by hand as `clamp()`.

## 2. The value delta

### Values in the file with no committed token

| Value     | Role in the file                           | In the repo |
| --------- | ------------------------------------------ | ----------- |
| `#a80b00` | `3837:6887`, Brand button Press            | absent      |
| `#fff1f0` | `3837:6888`, Secondary Brand Hover wash    | absent      |
| `#ffe0dd` | `3837:6889`, Secondary Brand Press wash    | absent      |
| `#ff958c` | `3837:6896`, Brand focus ring              | absent      |
| `#171615` | `3837:6875` Neutral Hover, and `2050:1231` | absent      |
| `#393633` | `3837:6883`, `3837:6890`, and `2050:1229`  | absent      |

Verified: `grep -ril` over `packages`, `apps` and `tools` returns nothing for any of
the six, and nothing for `Newsreader`.

Beyond colour:

| Value                                  | Where                                                                                       | In the repo                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `Newsreader` Regular 400 and Light 300 | 66 text nodes, see section 3                                                                | absent                                     |
| 72 / 86 heading                        | Homepage `Hero/Heading` `3720:60482`                                                        | `--text-hero` caps at 64 / 76              |
| Quote 48/58 and 36/44                  | `3700:484xx`, Quote section                                                                 | `--text-quote` is 64 / 76 at desktop       |
| `paddingTop` 112 and 80                | `4030:48114`, Interior Hero                                                                 | `layout.css` has 64, 96, 128, 164, 192     |
| radius 16                              | 53 nodes, all media frames: Blog Post Card image, Employee Card, Business Card, About photo | `--radius-card` is 0                       |
| radius 40                              | `Brand Navigation` pill, 6 instances                                                        | absent                                     |
| `rgba(3,3,3,0.60)`                     | nav backdrop, `3739:71359`, `3739:71417`, `2225:2920`                                       | `--color-scrim-pill` is `rgba(3,3,3,0.45)` |

### Committed tokens nothing in scope binds

| Token                     | Value     | Status in the file                                                           |
| ------------------------- | --------- | ---------------------------------------------------------------------------- |
| `--color-paper`           | `#f5f4f1` | absent entirely                                                              |
| `--color-fg-subtle`       | `#a3a3a3` | absent entirely                                                              |
| `--color-surface-muted`   | `#d3d3d3` | absent entirely                                                              |
| `--color-line-soft`       | `#ececea` | absent entirely                                                              |
| `--color-btn-focus`       | `#242321` | absent; focus is now `#d6d3cc` / `#aaa69e` / `#ff958c`                       |
| `--color-on-utility-line` | `#242321` | absent entirely                                                              |
| `--color-ink-warm`        | `#0f100b` | hard-coded on the 404 Section only (`3754:76346`, `3754:77524`), never bound |
| `--color-fg`              | `#232323` | one hard-coded node, the homepage Quote subhead                              |
| `--radius-declared-small` | `4px`     | no 4px corner anywhere in scope                                              |

Two more `--color-btn-*` tokens survive as values but have changed role:
`--color-btn-press: #e5e3de` is now the _disabled_ surface (`3837:6892`,
`3858:7951`), and `--color-btn-disabled: #d6d3cc` is now a _focus ring_ and the
Subtle _hover_ (`3837:6894`, `3858:7952`). Only `--color-btn-disabled-fg: #76746f`
still means what it says (`3837:6891`).

No gradient in scope is bound to a variable. The `Gradient/Red/1` variable that the
2026-08 pass recorded does not appear; the red radial on the hero is a literal
`#eb1000` to `#030303` stop pair.

### Values both bound and hard-coded

| Value                                                                                                                                                    | Bound | Hard-coded | Note                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------- | -------------------------------------- |
| `#ffffff`                                                                                                                                                | 256   | ~3000      | mostly icon and logo vectors           |
| `#eb1000`                                                                                                                                                | 47    | 6          | six literal brand reds remain          |
| `#000000`                                                                                                                                                | 23    | 16         |                                        |
| `#030303`                                                                                                                                                | 1     | 1          | plus 11 uses at 60% alpha, all unbound |
| `#0a0a0b`, `#76746f`, `#aaa69e`, `#c90e00`, `#55524e`, `#f1f0ec`, `#e5e3de`, `#393633`, `#171615`, `#f7f7f6`, `#a80b00`, `#fff1f0`, `#ffe0dd`, `#d6d3cc` | all   | 0          | fully migrated                         |

The remaining unbound colours are logo and illustration fills (`#ffbe00` on the
1682 business card, `#0f0034` and `#5e5e5e` on case-study card backgrounds,
`#00bea5`-family gradients on the Live cards) plus section chrome (`#444444` on the
four Local Components section backgrounds).

One flag that is not a token question: `#ff00ff` text reading "Note to self: Come
back and finish this section" sits on both About frames (`4018:37118`,
`3883:16534`). About is not finished.

## 3. Font family

`3720:61894` resolves to **Newsreader**. `3720:61895` resolves to **Figtree**.

`apps/web/src/app/layout.tsx:3` imports `Figtree` from `next/font/google` and
nothing else. `typography.css` sets both `--font-sans` and `--font-display` to
`var(--font-figtree, Figtree)`. **Newsreader is not loaded, not declared and not
mentioned anywhere in the repo.**

Newsreader is not incidental. Sixty-six text nodes in scope carry it:

| Family                | Style                                                      | Nodes |
| --------------------- | ---------------------------------------------------------- | ----- |
| Figtree               | Regular 400, Bold 700, Medium 500, SemiBold 600, Light 300 | 581   |
| Newsreader            | Regular 400                                                | 65    |
| Newsreader            | Light 300                                                  | 1     |
| Thirsty Rough Bol Two | Regular 600                                                | 2     |

The Newsreader nodes are the headings, and they run through the shared molecule:
`Standard Content Lockup/Heading` (`3720:62490`) and `Case Study Content
Lockup/Heading` (`3858:8248`) are both Newsreader, so every section heading on
every page inherits it. Also Newsreader: the CTA headline and the footer line in
`Combined CTA + Footer`, `Case Study Text Block/Heading` (`3265:1617`), its stat
figures (`3265:1654`), and `Business Card/Title` (`3813:93842`).

**Only the homepage hero binds the family to a variable.** The other 65 nodes set
Newsreader directly with no `fontFamily` binding, while binding `fontSize`,
`lineHeight` and `fills` as usual. The variable is newer than the usage.

`Thirsty Rough Bol Two` appears twice, both on the About photo collage, on text
reading "Philly made." at 154px and 55px (`4061:50293`, `3883:16527`). It reads as
lettering inside an image rather than a type role.

## 4. Type scale

The `3700:484xx` set is small: two size/line-height pairs, both on the `Quote`
section only.

| Pair                   | Desktop | Mobile  | Repo token          | Repo desktop | Repo mobile |
| ---------------------- | ------- | ------- | ------------------- | ------------ | ----------- |
| `3700:48428` / `48429` | 48 / 58 | 30 / 36 | `--text-display-xl` | 48 / 58      | 40 / 48     |
| `3700:48431` / `48432` | 36 / 44 | 28 / 34 | `--text-display-lg` | 36 / 43.2    | 18 / 21.6   |

Desktop agrees at both steps. Mobile does not, at either.

The bigger gap is that the Quote section no longer uses the hero ramp at all.
`--text-quote` is `clamp(36px, ..., 64px)` with line height `clamp(44px, ..., 76px)`,
which is the same curve as `--text-hero`. In the rebuilt file, Quote `Size=Default`
is 48/58 and `Size=Small` is 36/44. The `Size` axis on the Quote set
(`Size=Default` / `Size=Small`) has no counterpart in the token file, which carries
a single `--text-quote`.

Two more mismatches from the second-generation pairs, both of them line height:

- `--text-body` is `clamp(16px, ..., 20px)` with `line-height: 1.6`, which is 32px
  at 20px. `2050:1321` resolves to 28 against `2050:1314`'s 20, a ratio of 1.4.
  Sixty bindings.
- `--text-nav` is 14px with `line-height: 1.2`, which is 16.8px. `2050:1322`
  resolves to 20 against `2050:1315`'s 14, a ratio of 1.43. Ten bindings. Note
  that 14/16.8 also exists in the file as an unbound pair on 72 nodes, so both
  ratios are live and the variable is the minority.

Everything else lines up. 24/34 and 20/26 match `--text-lead` and `--text-display-sm`
exactly. 18/24 matches `--text-button`. 16/20 to 18/24 matches `--text-eyebrow-lg`.
13/15 matches `--text-meta` to within the 1.2 ratio's rounding.

## 5. Is the Atoms section a definition surface?

**No.** There is no swatch row to read.

`3720:62477` has exactly six children: `Go birds.` (`1275:1631`), `Molecule`
(`2250:1498`), `Icon` (`2177:1556`), `Button` (`2134:1785`), `Icon Button`
(`2134:1724`) and `Link` (`2225:2894`). No frame, group or component in that
subtree is a colour chip, and no node name in it is a token name.

What produced the "bound twice, definition chips" reading is real but means
something else: `Button` and `Icon Button` are parallel matrices over the same
Style, Theme and State axes, so a state colour used once in each shows up with
exactly two bindings and no other usage. `#a80b00` has two bindings because Brand
Press exists twice, not because it is defined twice.

The consequence for `figma:sync` is that **this file still has no machine-readable
token names.** A name-carrying surface would need either the `file_variables:read`
scope on the seat, a published style set (the file publishes zero), or a frame
someone draws for the purpose. None of the three exists today.

The `Button` set is, however, a usable _semantic_ surface. Its variant names are
structured (`Style=Secondary, Theme=Brand, State=Press`) and they resolve one to
one onto the fourth-generation ids. A reader keyed on those variant names, not on
chip labels, could derive the button ramp mechanically. That is a larger question
than #479 and belongs to the grilling.

## 6. Proposed names

**These are proposals for #483, not decisions.** They follow `color.css`'s existing
pattern of naming a token for what consumes it, which is what `--color-btn-*`
already does.

The state ramp, four themes by four states:

| Proposed                    | Value     | Figma id    |
| --------------------------- | --------- | ----------- |
| `--color-btn-neutral-hover` | `#171615` | `3837:6875` |
| `--color-btn-neutral-press` | `#000000` | `3837:6876` |
| `--color-btn-brand-hover`   | `#c90e00` | `3837:6886` |
| `--color-btn-brand-press`   | `#a80b00` | `3837:6887` |
| `--color-btn-inverse-hover` | `#f7f7f6` | `3837:6881` |
| `--color-btn-inverse-press` | `#f1f0ec` | `3837:6882` |
| `--color-btn-subtle`        | `#e5e3de` | `3858:7951` |
| `--color-btn-subtle-hover`  | `#d6d3cc` | `3858:7952` |
| `--color-btn-subtle-press`  | `#aaa69e` | `3858:7953` |

The Secondary style's hover and press washes, which are tints rather than solids:

| Proposed                          | Value     | Figma id    |
| --------------------------------- | --------- | ----------- |
| `--color-btn-ghost-neutral-hover` | `#f7f7f6` | `3837:6878` |
| `--color-btn-ghost-neutral-press` | `#f1f0ec` | `3837:6879` |
| `--color-btn-ghost-brand-hover`   | `#fff1f0` | `3837:6888` |
| `--color-btn-ghost-brand-press`   | `#ffe0dd` | `3837:6889` |
| `--color-btn-ghost-inverse-hover` | `#393633` | `3837:6883` |
| `--color-btn-ghost-inverse-press` | `#55524e` | `3837:6884` |

Focus, which replaces `--color-btn-focus` outright:

| Proposed                | Value     | Figma id    |
| ----------------------- | --------- | ----------- |
| `--color-focus-neutral` | `#d6d3cc` | `3837:6894` |
| `--color-focus-inverse` | `#aaa69e` | `3837:6895` |
| `--color-focus-brand`   | `#ff958c` | `3837:6896` |

Disabled, which splits `--color-btn-disabled` in two by theme:

| Proposed                     | Value     | Figma id                 |
| ---------------------------- | --------- | ------------------------ |
| `--color-btn-disabled-dark`  | `#393633` | `3837:6890`              |
| `--color-btn-disabled-light` | `#e5e3de` | `3837:6892`, `3858:7951` |

Two neutrals that also carry non-button usage through `2050:1229` and `2050:1231`,
and so want a palette name rather than a component one. Both sit between
`--color-ink` (`#0a0a0b`) and `--color-fg` (`#232323`):

| Proposed             | Value     | Figma id                              |
| -------------------- | --------- | ------------------------------------- |
| `--color-ink-raised` | `#171615` | `3837:6875`, `2050:1231`              |
| `--color-ink-lifted` | `#393633` | `3837:6883`, `3837:6890`, `2050:1229` |

Non-colour:

| Proposed                                     | Value         | Figma source           |
| -------------------------------------------- | ------------- | ---------------------- |
| `--font-display` retargeted to Newsreader    | `Newsreader`  | `3720:61894`           |
| `--text-hero-xl` 72 / 86                     | 72 / 86       | Homepage `3720:60482`  |
| `--text-quote-sm` 36 / 44, desktop           | see section 4 | `3700:48431` / `48432` |
| `--spacing-band-hero` 112 desktop, 80 mobile | 112 / 80      | `4030:48114`           |
| `--radius-media` 16                          | 16            | 53 media frames        |
| `--radius-nav-brand` 40                      | 40            | `Brand Navigation`     |

Naming `--color-btn-ghost-*` after Figma's `Style=Secondary` is a deliberate break
from the file's word, because `secondary` in this repo already reads as a rank
rather than a fill treatment. That is exactly the kind of call #483 should make,
not this document.

## Open questions for the map

1. **Newsreader.** The heading face on 66 nodes, including the shared content
   lockup every section uses, is a font the site does not load. Adding it is a
   `next/font` entry, a `--font-display` retarget and a real LCP cost on a page
   whose hero text is the LCP element. Is the family adopted, or is it exploration
   that has not been ruled on? Nothing else in this document can be actioned
   without the answer, because `--font-display` is what every heading token reads.
2. **The `Size` axis on Quote.** The Quote section now has `Size=Default` and
   `Size=Small` with different ramps, against a single `--text-quote`. Two tokens
   and a renderer knob, or pick one and drop the axis?
3. **Modes versus `clamp()`.** Nine ids now carry a desktop and a mobile value as
   variable modes. `typography.css` encodes the same ramp as hand-fitted `clamp()`
   curves, and at four of the steps the mobile end of the curve disagrees with the
   file's mobile mode (64/76 to 40/44 against a 36px floor; 48/58 to 38/42 against
   a 40px floor; both Quote steps). Is the `clamp()` interpolation kept and the
   endpoints corrected, or does the ramp become two discrete breakpoint values now
   that the file states them?
4. **`--text-body` line height.** The file says 1.4 through `2050:1314` / `2050:1321`,
   60 bindings. The repo says 1.6. This is body copy on every page, so it is the
   single most visible number in the delta.
5. **Reading the button matrix mechanically.** Section 5 says the variant names
   are structured enough to derive the state ramp from, without variable names.
   Worth a `figma:sync` reader, or is a hand-maintained token file cheaper than
   the machinery?
6. **`--color-btn-press` and `--color-btn-disabled` changed meaning, not value.**
   Renaming them is a sweep through every consumer. Rename, or add the new names
   and leave the old ones as aliases until the consumers move?

## Provenance

- File key `RvraLJaZ0zWm8UaD5AJf43`, read 2026-09-18 via `/v1/files/:key/nodes`
- `/v1/files/:key/variables/local` → 403, `file_variables:read` not on this seat
- `/v1/files/:key/styles` → `{"styles":[]}`
- Committed tokens: `packages/tailwind-config/tokens/{color,typography,layout,radius}.css`
- Font loading: `apps/web/src/app/layout.tsx`
