# Figma re-architecture: where the twelve dead asset sources went

Issue #480, under map #476. Companion to
[`figma-2026-rearchitecture-findings.md`](./figma-2026-rearchitecture-findings.md)
section 1, which listed the failures without resolving them.

## What this answers

`pnpm figma:sync` on 2026-09-18 failed twelve asset exports on dead source
nodes and re-reported two locked conflicts. This document says, for each of the
fourteen, whether the committed bytes still exist in the file, which node
carries them now, and what the manifest entry should become.

Read against file `RvraLJaZ0zWm8UaD5AJf43`, version `2400647235422861907`,
2026-09-18. Method: SHA-1 of each committed file, then every node in every
canvas walked for `fills[].imageRef`. Figma keys an image fill by the SHA-1 of
its bytes, so an `imageRef` match is proof of identical bytes, not resemblance.
The index covers all seven populated canvases (Designs, Case Studies, Blog
Posts, Prototype Components, Local Components, Graphic Assets, Archive):
591 nodes carrying 314 distinct `imageRef`s.

`GET /v1/files/:key/images` lists 1,872 refs in the file's image library. Four
of the dead sources' bytes are still in that library but are referenced by no
node anywhere, which is the same state `about-portrait-gadsby` was already
recorded in. Library membership is not a source.

## Summary

| Asset                         | Old node     | Status                                 | New node                 | Same bytes?                  |
| ----------------------------- | ------------ | -------------------------------------- | ------------------------ | ---------------------------- |
| `about-beyond-1682.png`       | `1928:6501`  | artwork replaced                       | `I3813:93974;3813:93840` | no                           |
| `about-beyond-community.png`  | `2960:7144`  | card deleted; photo survives elsewhere | `3764:78616`             | no                           |
| `about-beyond-o3xo.png`       | `2960:7142`  | moved                                  | `I3813:93985;3813:93840` | **yes**                      |
| `about-portrait-gadsby.png`   | `2032:577`   | re-uploaded smaller                    | `I3771:80239;3767:80004` | no                           |
| `partner-caron.png`           | `1883:3430`  | raster moved into a component          | `2089:4159`              | **yes**, after the same trim |
| `partner-hireheroes.png`      | `1875:3332`  | raster gone; mark is now vector        | `3606:17768`             | no                           |
| `partner-ironman.png`         | `1875:3335`  | raster gone; mark is now vector        | `3606:17770`             | no                           |
| `partner-lacolombe.png`       | `2250:1484`  | raster gone; mark is now vector        | `3606:17771`             | no                           |
| `partner-vertex.png`          | `1864:2396`  | raster gone; mark is now vector        | `3606:17769`             | no                           |
| `solutions-overview-1682.png` | `2360:2871`  | different photograph                   | `4043:49792`             | no                           |
| `utility-1682.png`            | `3183:2961`  | moved                                  | `3726:69002`             | **yes**                      |
| `utility-o3xo.png`            | `3269:13421` | moved                                  | `3726:69004`             | **yes**                      |
| `live-fintech.png`            | `1751:2003`  | node alive, fill unchanged             | `1751:2003`              | **yes**, crop still exact    |
| `live-saas.png`               | `1899:4421`  | node alive, fill unchanged             | `1899:4421`              | **yes**, crop still exact    |

Four entries are pure relocations and can be repointed with no review. Four are
new artwork the seed does not carry. Four partner marks stopped being rasters at
all. Two locked conflicts are false alarms.

## Per asset

### `about-beyond-1682.png`: the 1682 mark was redrawn

Committed SHA-1 `57e5bc89f795a122eeadd795dcf320dd272162b7`, a 336x336 PNG. It
is still in the image library and on no node.

The card it served survives. About `3754:78274` > Section `3771:80621`
("Beyond O3") > Row `3813:93888` > Business Card `3813:93974`, titled "1682"
with the body "Our annual conference focused on AI and innovation". Its image
rectangle is `I3813:93974;3813:93840`, `imageRef`
`97276e4ad91814b4ba7d0a00e5798aff53316395`, 1080x1080.

Same subject, new artwork: the committed file lays the four Bauhaus glyphs out
in one row, the new one stacks them two by two. Not a re-export, a redesign.
The same ref is on the mobile card `I3906:17954;3813:93840`.

Note that the Homepage draws its own "1682" card as vector groups
(`3720:60578`), not as a raster. Only the About card is a fill.

### `about-beyond-community.png`: the card is gone, the photograph is not

Committed SHA-1 `2f07b310eca2ced2e83b6c01899fc0afd786cc21`, 1836x1424,
greyscale. Still in the library, on no node.

The "Beyond O3" band now holds two cards, 1682 and O3XO. The Community card was
removed, so no node stands in the old one's role.

The photograph itself survives on the same page in a different band and a
different treatment: About `3754:78274` > Photo `3754:78276` > Image
`3764:78610` > `3764:78616` ("image 27"), `imageRef`
`c87d0cdb35fb5879cbf8f83882d57d56a2dc5916`, 1920x1280, full colour and a wider
crop. Same shoot, same pose, different file.

This is a content decision, not a wiring one: either the seed keeps the
greyscale crop with no live source, or the band the asset serves is rebuilt
against `3764:78616`.

### `about-beyond-o3xo.png`: moved, byte for byte

Committed SHA-1 `7f7e041e6b7b902f4111fa8111d1dbb16cb484d4` is the `imageRef` of
`I3813:93985;3813:93840`, on About `3754:78274` > Section `3771:80621` > Row
`3813:93888` > Business Card `3813:93985`, titled "O3XO". Identical bytes. The
mobile twin is `I3906:17955;3813:93840`.

### `about-portrait-gadsby.png`: the portrait shrank again

Committed SHA-1 `652581511bdf545d62b32795182f824bea2f5257`, 2500x2500. Still in
the library, on no node. The entry was already locked in 2026-08 for exactly
this, when the live fill was a 790x796 re-upload.

The team band was rebuilt as About `3754:78274` > Team `3771:80235` > Row
`3771:80238`, nine Employee Card instances with the name in
`I<card>;3767:80010`. Mike Gadsby is the first, `3771:80239`; his image is
`I3771:80239;3767:80004`, `imageRef`
`3e224db363f2f08ffb5c52668e145d1aa5a4c916`, **640x640**. Mean absolute
difference against the committed file downscaled to match is 1.09 of 255, so it
is the same photograph, re-uploaded smaller again.

The lock still earns its place: re-exporting swaps a 2500px original for a
640px one. The `2032:577` id in the entry is dead and should move to
`I3771:80239;3767:80004`; the lock and its reasoning stand.

### The five partner marks: the logo strip stopped being raster

None of the five committed files' SHA-1s are in the image library, which is
expected: every one was alpha-trimmed by hand, so the committed bytes were never
the fill original. The question is whether the fill originals survive.

**Caron does, and it moved into a component.** `partner-caron.png` is
pixel-identical (difference bounding box empty) to the alpha trim of `imageRef`
`5bccf0e160c1c78ea9ca2d81c4f7b2618a3e2060`, a 1079x294 PNG whose trim is exactly
the committed 1059x263. That ref sits on `2089:4159` ("image 20"), in Local
Components > Case Study Card `2089:4169` > `Variant=Caron, Device=Desktop`
`2089:4167` > Container `3629:22783` > Logo Holder `2089:4129`. Same bytes,
same derivation, new home.

**The other four are vectors now.** The partners strip is
`Section - Partners` `3606:17825` on the Prototype Components canvas, a
three-variant component set whose Logo Bar `3606:17766` holds six named
`VECTOR` nodes and no image fill at all:

| Mark            | Node         |
| --------------- | ------------ |
| Caron           | `3606:17767` |
| Hire Heroes USA | `3606:17768` |
| Vertex          | `3606:17769` |
| Ironman         | `3606:17770` |
| La Colombe      | `3606:17771` |
| Mastercam       | `3606:17801` |

The Homepage instances it at `3720:60490`, inside `Section - Partners`
`3720:60483`.

Rendered at 4x and compared as alpha silhouettes against the committed files,
three are the same lockup and two are not:

| Mark            | Committed aspect | Vector aspect | Alpha difference | Reading                 |
| --------------- | ---------------- | ------------- | ---------------- | ----------------------- |
| Hire Heroes USA | 4.458            | 4.487         | 1.5 / 255        | same lockup             |
| Ironman         | 4.040            | 4.093         | 0.7 / 255        | same lockup             |
| La Colombe      | 5.172            | 5.147         | 5.4 / 255        | same lockup             |
| Vertex          | 5.430            | 4.698         | 82 / 255         | different proportions   |
| Caron           | 4.027            | 4.730         | 71 / 255         | descriptor line dropped |

Every vector is drawn in a single grey, where all five committed PNGs are the
brands' own colours. Caron's vector is the wordmark alone, without the
"Transformational Care" line the committed file carries, which is why the
raster in the Case Study Card, not the strip vector, is Caron's source.

Two things follow that are design decisions, not wiring. The strip is
monochrome now, and it has a sixth partner, Mastercam, that the seed has no
asset for.

The strip renders through `/v1/images` in both `png` and `svg`, so a vector
source is exportable; it would make these four `export: "render"` entries rather
than `imageFill`.

### `solutions-overview-1682.png`: a different photograph

The entry records the node's fill as `imageRef`
`594350a88ec7874bdc8ad4c2a8f36e3c35f2b60b`, 3210x2138. That ref is still in the
library and on no node.

The band survives: Solutions Detail (Engineering) `2360:2879` > Section
`2360:2861` > Container `4043:49758` > Content `4043:49788` > Image `4043:49765`

> `4043:49792` ("image 32"), 1000x667 in the frame, `imageRef`
> `037965dfad24486f8e16bd97c758c624abbc39a9`, 1080x720.

It is not the same picture. The committed asset is a greyscale room shot of two
people at laptops across a table. The new fill is a colour close-up of hands at
a laptop with a second laptop behind. The asset changed, it did not move, and
the hand trim and resample the lock protects has nothing left to protect.

### `utility-1682.png` and `utility-o3xo.png`: moved, byte for byte

Both committed SHA-1s are live `imageRef`s:

| Asset              | SHA-1                                      | Node         |
| ------------------ | ------------------------------------------ | ------------ |
| `utility-1682.png` | `c0d8bfd2557b4a29865157766e082fa9e9176ecf` | `3726:69002` |
| `utility-o3xo.png` | `1a847e2d1fbb7ec5f126bb7b0ebc0be4289fda57` | `3726:69004` |

Both sit in Local Components > Components `3726:68554` > Brand Navigation
`3726:68984` > `Theme=Dark, State=Default` `3726:69001`, at 66x24 and 91x24.
The `Theme=Light, State=Default` variant `3726:69010` carries the same two refs
on `3726:69011` and `3726:69013`, so the theme does not change the bytes. The
`State=Open` variants carry four different refs (`09cfcba1`, `92a82e2f`,
`58d4e451`, `c1fa4cb4`), which is a second colourway nobody has triaged.

Fifteen nodes across the file instance these two marks. The component-set leaves
are the stable ids; an instance id is not.

This also confirms the findings document's inference that Utility Nav
`2250:1445` became Brand Navigation `3726:68984`.

### `live-fintech.png` and `live-saas.png`: the conflicts are false alarms

Both source nodes are alive, on Live `1644:1889` > Case studies `1644:1904` >
Blog `1751:1994` > Row `1751:2000` > Frame 2611210 `1751:2001`, under Frame
2611303 `1751:2002` and Frame 2611306 `1899:4420`. Both still carry their
recorded fills:

| Asset              | Node        | `imageRef`                                 | Fill size | Manifest expected |
| ------------------ | ----------- | ------------------------------------------ | --------- | ----------------- |
| `live-fintech.png` | `1751:2003` | `8470357ff8cdbce1952a5f938ac66675ef1a4677` | 791x544   | 791x544           |
| `live-saas.png`    | `1899:4421` | `4e6c2f5434a46d8e01e21f44236610d91d2ad4f8` | 791x544   | 791x544           |

The hand crops still hold exactly. The committed 527x544 files compare against
the fill original cropped at x=132 and x=1 with an empty difference bounding box
and a mean absolute difference of 0.0, which is what the entries already claim.

So the fill did not change. A conflict fires on the normalized hash of the whole
subtree (`assets.ts`, `normalize.ts`), and each of these subtrees is just the
card frame plus an empty `Case study info` child, both now boxed at
394.67x397.69. The hash moved on geometry inside a rebuilt Live band, not on the
image.

Nothing needs re-cropping. What closes the conflict is an edit to `nodeId`,
`locked` or `note`, per `fingerprintAssetEntry`, so rewriting the note with this
verification is the reconciliation.

## Proposed manifest patch

All fourteen entries change: twelve get a new source, and the two locked Live
entries get the note rewrite that closes their conflict. `about-beyond-community.png` and
`solutions-overview-1682.png` become honestly unresolved, in the manifest's own
wording for that state, rather than being pointed at a node that draws something
else.

```json
[
  {
    "path": "tools/migration/data/seed/assets/about-beyond-1682.png",
    "nodeId": "I3813:93974;3813:93840",
    "figmaName": "Image",
    "format": "png",
    "scale": 1,
    "export": "imageFill",
    "locked": true,
    "note": "About `3754:78274` → Section `3771:80621` (\"Beyond O3\") → Business Card `3813:93974`, titled \"1682\". The committed bytes hash to `57e5bc89f795a122eeadd795dcf320dd272162b7`, which is still in the file's image library and on no node: this card now carries `97276e4ad91814b4ba7d0a00e5798aff53316395` (1080×1080), the same four Bauhaus glyphs stacked two by two instead of laid out in a row. Locked because a re-export replaces the seed's artwork with a redesign, which is a content decision (#480)."
  },
  {
    "path": "tools/migration/data/seed/assets/about-beyond-community.png",
    "format": "png",
    "locked": true,
    "unresolved": true,
    "note": "The Community card it was cut for no longer exists: the rebuilt \"Beyond O3\" band on About `3754:78274` holds two cards, 1682 and O3XO. The committed bytes hash to `2f07b310eca2ced2e83b6c01899fc0afd786cc21`, still in the image library and referenced by no node. The same team photograph survives one band up, in colour and at a wider crop, as `c87d0cdb35fb5879cbf8f83882d57d56a2dc5916` on `3764:78616` — a different file, not a re-export of this one (#480)."
  },
  {
    "path": "tools/migration/data/seed/assets/about-beyond-o3xo.png",
    "nodeId": "I3813:93985;3813:93840",
    "figmaName": "Image",
    "format": "png",
    "scale": 1,
    "export": "imageFill",
    "locked": false,
    "note": "About `3754:78274` → Section `3771:80621` (\"Beyond O3\") → Business Card `3813:93985`, titled \"O3XO\". Exact: committed bytes hash to `7f7e041e6b7b902f4111fa8111d1dbb16cb484d4`, the node's `imageRef`. Remapped 2026-09-18 after the re-architecture retired `2960:7142`; identical bytes (#480)."
  },
  {
    "path": "tools/migration/data/seed/assets/about-portrait-gadsby.png",
    "nodeId": "I3771:80239;3767:80004",
    "figmaName": "Image",
    "format": "png",
    "scale": 1,
    "export": "imageFill",
    "locked": true,
    "note": "About `3754:78274` → Team `3771:80235` → Employee Card `3771:80239`, the Mike Gadsby card. High, not exact, and locked because the source keeps shrinking: the committed bytes hash to `652581511bdf545d62b32795182f824bea2f5257`, still in the image library and on no node, while the card carries `3e224db363f2f08ffb5c52668e145d1aa5a4c916` at 640×640 (mean absolute difference 1.09/255 against the committed 2500×2500 downscaled to match). Re-exporting would replace a 2500px original with a 640px one. Committed unwired — see #46: it is a flattened comp, not the cut-out `PortraitTile` needs."
  },
  {
    "path": "tools/migration/data/seed/assets/partner-caron.png",
    "nodeId": "2089:4159",
    "figmaName": "image 20",
    "format": "png",
    "scale": 1,
    "export": "imageFill",
    "locked": true,
    "note": "Local Components → Case Study Card `2089:4169` → `Variant=Caron, Device=Desktop` `2089:4167` → Logo Holder `2089:4129`. The partners strip that held `1883:3430` is gone and its marks are vectors now, but this raster survives the re-architecture: the committed file is pixel-identical to the alpha trim of `5bccf0e160c1c78ea9ca2d81c4f7b2618a3e2060` (1079×294 trimming to 1059×263, empty difference bounding box). Locked because of the trim. Remapped 2026-09-18 (#480)."
  },
  {
    "path": "tools/migration/data/seed/assets/partner-hireheroes.png",
    "nodeId": "3606:17768",
    "figmaName": "Hire Heroes USA",
    "format": "png",
    "scale": 1,
    "export": "render",
    "locked": true,
    "note": "Prototype Components → Section - Partners `3606:17825` → Logo Bar `3606:17766`. The strip's marks are single-grey vectors now, not image fills, so there is no fill original left to download: the committed colour raster is the same lockup (alpha difference 1.5/255, aspect 4.458 against the vector's 4.487) in the brand's own colours. Locked: a render from this node returns the monochrome treatment (#480)."
  },
  {
    "path": "tools/migration/data/seed/assets/partner-ironman.png",
    "nodeId": "3606:17770",
    "figmaName": "Ironman",
    "format": "png",
    "scale": 1,
    "export": "render",
    "locked": true,
    "note": "Prototype Components → Section - Partners `3606:17825` → Logo Bar `3606:17766`. Same lockup as the committed raster (alpha difference 0.7/255, aspect 4.040 against 4.093), drawn as a single-grey vector rather than an image fill. The committed copy is the alpha-trimmed, 1200px-wide colour version. Locked: a render from this node returns the monochrome treatment (#480)."
  },
  {
    "path": "tools/migration/data/seed/assets/partner-lacolombe.png",
    "nodeId": "3606:17771",
    "figmaName": "La Colombe",
    "format": "png",
    "scale": 1,
    "export": "render",
    "locked": true,
    "note": "Prototype Components → Section - Partners `3606:17825` → Logo Bar `3606:17766`. Same lockup as the committed raster (alpha difference 5.4/255, aspect 5.172 against 5.147), drawn as a single-grey vector rather than an image fill. Locked: a render from this node returns the monochrome treatment (#480)."
  },
  {
    "path": "tools/migration/data/seed/assets/partner-vertex.png",
    "nodeId": "3606:17769",
    "figmaName": "Vertex",
    "format": "png",
    "scale": 1,
    "export": "render",
    "locked": true,
    "note": "Prototype Components → Section - Partners `3606:17825` → Logo Bar `3606:17766`. The brand is the same, the lockup is not: the vector is a single grey and sits at aspect 4.698 where the committed colour raster is 5.430 (alpha difference 82/255). Locked: a render from this node is neither the committed colours nor the committed proportions (#480)."
  },
  {
    "path": "tools/migration/data/seed/assets/solutions-overview-1682.png",
    "format": "png",
    "locked": true,
    "unresolved": true,
    "note": "The photo rectangle `2360:2871` is gone and its fill `594350a88ec7874bdc8ad4c2a8f36e3c35f2b60b` is in the image library, referenced by no node. The band survives — Solutions Detail (Engineering) `2360:2879` → Section `2360:2861` → Image `4043:49765` → `4043:49792` — but it carries a different photograph, `037965dfad24486f8e16bd97c758c624abbc39a9` (1080×720, colour, hands at a laptop) where the committed file is a greyscale room shot. Nothing to re-export: the asset changed rather than moved (#480)."
  },
  {
    "path": "tools/migration/data/seed/assets/utility-1682.png",
    "nodeId": "3726:69002",
    "figmaName": "1682",
    "format": "png",
    "scale": 1,
    "export": "imageFill",
    "locked": false,
    "note": "Local Components → Brand Navigation `3726:68984` → `Theme=Dark, State=Default` `3726:69001`, the 1682 Conference mark at 66×24. Exact: committed bytes hash to `c0d8bfd2557b4a29865157766e082fa9e9176ecf`, the node's `imageRef`. Remapped 2026-09-18 from the retired Utility Nav `3183:2961`; identical bytes. The light variant `3726:69011` carries the same fill; the `State=Open` variants carry a second colourway (#480)."
  },
  {
    "path": "tools/migration/data/seed/assets/utility-o3xo.png",
    "nodeId": "3726:69004",
    "figmaName": "O3XO",
    "format": "png",
    "scale": 1,
    "export": "imageFill",
    "locked": false,
    "note": "Local Components → Brand Navigation `3726:68984` → `Theme=Dark, State=Default` `3726:69001`, the O3XO wordmark at 91×24: white `O3`, brand-yellow `XO`, transparent ground. Exact: committed bytes hash to `1a847e2d1fbb7ec5f126bb7b0ebc0be4289fda57`, the node's `imageRef`. Remapped 2026-09-18 from the retired Utility Nav `3269:13421`; identical bytes (#480)."
  },
  {
    "path": "tools/migration/data/seed/assets/live-fintech.png",
    "nodeId": "1751:2003",
    "figmaName": "Case study cards",
    "format": "png",
    "scale": 1,
    "export": "imageFill",
    "locked": true,
    "note": "Live `1644:1889` → Case studies `1644:1904` → Blog `1751:1994` → Frame 2611303 `1751:2002`. Exact and hand-cropped: the committed 527×544 is a pixel-identical (0.0) sub-rectangle of the node's 791×544 fill original `8470357ff8cd…` at x=132, y=0, the exact horizontal centre. Locked: a re-export from this node yields the full 791×544 and would silently undo the crop. Re-verified 2026-09-18 after the re-architecture flagged the node: the `imageRef` and the 791×544 fill are unchanged and the crop still matches at 0.0. The subtree hash moved on the card's geometry, not on the image (#480)."
  },
  {
    "path": "tools/migration/data/seed/assets/live-saas.png",
    "nodeId": "1899:4421",
    "figmaName": "Case study cards",
    "format": "png",
    "scale": 1,
    "export": "imageFill",
    "locked": true,
    "note": "Live `1644:1889` → Case studies `1644:1904` → Blog `1751:1994` → Frame 2611306 `1899:4420`. Exact and hand-cropped: pixel-identical (0.0) sub-rectangle of the node's 791×544 fill original `4e6c2f5434a4…` at x=1, y=0. Locked for the same reason as `live-fintech.png`. Re-verified 2026-09-18: `imageRef`, fill size and crop all unchanged; the subtree hash moved on the card's geometry (#480)."
  }
]
```

`asset-manifest.test.ts` requires every locked or unresolved entry to carry a
note, and rejects an entry that is neither resolved nor honestly unresolved.
Both unresolved entries above drop `nodeId`, `figmaName`, `scale` and `export`,
which is the shape the seven hand-authored SVG entries already use.

## Open questions for the map

1. **The partners strip is monochrome now, and the site is not.** Four of the
   five committed partner PNGs are full-colour brand lockups; every mark in
   `Section - Partners` `3606:17825` is one grey. Either the logo wall in code
   goes monochrome to match the frame, or the frame is behind the site and the
   committed colour rasters stand. This is the Figma-outranks-the-site rule
   meeting five third-party brand assets, so it wants a ruling rather than a
   default.

2. **Mastercam is a sixth partner with no asset.** `3606:17801` is in the Logo
   Bar and nothing in `tools/migration/data/seed/assets/` answers to it.

3. **Vertex's lockup changed proportions**, not just colour (4.698 against the
   committed 5.430). Worth a look at the frame before anything is re-cut.

4. **The Community card was deleted from About.** The seed still renders a
   Community entry in that band. Either the band follows the frame down to two
   cards, or the card stays and the greyscale crop keeps a source nobody can
   re-export.

5. **The Engineering intro photograph was replaced.** `solutions-overview-1682.png`
   is a different picture from what `4043:49792` draws. Swapping it is a content
   change to `/solutions/software-engineering`, and the file name stops being
   accurate once it is not the 1682 conference shot.

6. **The 1682 card artwork was redrawn.** Same question, smaller: the About card
   now stacks the glyphs two by two.

7. **Brand Navigation's `State=Open` variants carry a second colourway** of both
   utility marks (`09cfcba1`, `92a82e2f`, `58d4e451`, `c1fa4cb4`). Nobody has
   said whether the open nav is meant to look different, or whether the seed
   needs the second pair.

8. **Should the four vector partner entries be `render` at all?** The pipeline
   would then re-render them on every geometry change, and they are locked, so
   every run reports a conflict it cannot close. Marking them `unresolved`
   instead is the quieter option and loses the provenance. The patch above takes
   the provenance; say if the noise is worse.
