# Making an image

Every value here is read off the code that renders the site — the tokens in
`packages/tailwind-config/tokens/`, which are themselves read off the canonical
Figma frames, and the components that request the image widths. Where this
document and that code disagree, the code is right and this one is stale.

## Type is never generated

Figtree carries every word on the site, at a fixed px ramp. An image model
cannot render Figtree, or any named typeface, reliably: it produces shapes that
look like letters from a distance and fall apart up close. Generating type is
how an otherwise on-brand image announces itself as machine-made.

So: **a generated image carries no words.** No headline baked into the picture,
no label, no caption, no logo, no interface chrome with readable text in it. The
copy lives in the block around the image, where it is real text in the real face
at the real size, selectable and translatable and correct.

This is the rule that shapes the others. An image here is a surface, a texture,
or a shape — never a composition that needs a word to work.

## The palette

Name the hex values in the prompt. A model asked for "dark red" gives you a
different red every time.

| Role      | Hex       | What it is                                        |
| --------- | --------- | ------------------------------------------------- |
| ink       | `#0A0A0B` | the dominant dark, effectively the design's black |
| ink-deep  | `#030303` | gradient stops and the deepest ground             |
| ink-warm  | `#0F100B` | the warm black, hero bands only                   |
| bone      | `#F1F0EC` | the warm light band                               |
| bone-soft | `#F7F7F6` | bone's lighter end                                |
| white     | `#FFFFFF` | the plain light band                              |
| brand     | `#EB1000` | the red                                           |

Five neutrals, not three. The darks are distinct from each other and the
difference is visible in a large flat area — reaching for plain `#000000` reads
as a different design.

## Red arrives as a gradient

The brand red is a flat fill exactly once on the canonical Home frame. Every
other time it appears, it is a glow. A flat red area is almost always wrong.

The signature fill is two stacked radials:

```
radial-gradient(circle at 115% 24%, rgba(235, 16, 0, 0.5) 0%, rgba(3, 3, 3, 0) 100%),
radial-gradient(circle at 0% 0%, rgba(114, 8, 0, 1) 0%, rgba(3, 3, 3, 1) 65%)
```

In a prompt: a deep red rising out of near-black at the top-left corner and
falling to black by two-thirds across, with a softer red bloom off the right
edge at about a quarter height. Nothing in the middle. The red is light, not
paint — it glows out of the dark rather than sitting on it.

## Light bands wash

The light surfaces are not flat either. They gradate between white and bone,
usually bottom-to-top:

```
linear-gradient(0deg, #FFFFFF 0%, #F1F0EC 100%)
```

A flat `#F1F0EC` rectangle where the design washes is the most common way to get
a light surface subtly wrong.

## The geometry is square

Radius is `0` — buttons, cards, media frames, all of it. The only curves in the
canonical frames are shapes rather than a corner style. An image with rounded
corners, soft-cornered panels, or pill shapes in it does not belong to this
design. The one exception on the site is the floating nav pill, which is chrome
and not something an image should imitate.

## Shape and size

The insight card is square, and images that arrive at the wrong aspect or too
small have to be redone. Generate square for an insight's `cardMedia` unless
the block's schema description says otherwise, and generate large — an image
can be cropped down and cannot be invented back up.

**`generate_image` stops at 1024×1024**, and nothing in the toolchain raises
that ceiling. The slots ask for more, and on an insight one asset can still fill all three
of them: the hero draws `heroMedia` and falls back to `cardMedia`, so an
article with only a card picture draws it in the band too.

| Slot           | Asks for | Where                                       |
| -------------- | -------- | ------------------------------------------- |
| hero           | `2400`   | `InsightView.tsx:139`                       |
| in-body figure | `1644`   | `InsightView.tsx:192`                       |
| square card    | `800`    | `InsightCard.tsx:63`, in the same directory |

A generated image covers the square card's request and none of the others: 1024
is well under the in-body figure's 1644 and under half the hero's 2400.

**Compare the number to the slot before you prompt, not after.** Where an
insight has only a `cardMedia` and no `heroMedia`, the hero's 2400 is the
request that governs and no generation will meet it, so the choice is the empty
field and a note — taken before the first prompt rather than after the third one
comes back the same size.

## Writing the prompt

Say all of these, every time:

- the hex values, by number
- **no text, no letterforms, no numbers, no logos, no watermarks**
- no rounded corners, no pill shapes
- the aspect ratio you need
- whether it sits on a dark band or a light one, so the image resolves against
  its surface rather than fighting it

Abstract, textural, and architectural subjects sit inside this palette without
argument. Literal illustrations of a concept — a robot for AI, a padlock for
security, a lightbulb for an idea — are the stock-photo register the voice skill
rejects in words, and they read the same way in pictures.

## Checking the result before you attach it

- Any letterform anywhere? Regenerate. This is the failure that gets noticed.
- A flat red area? Wrong — the red should be a glow.
- Rounded corners on anything? Wrong.
- Does it hold up at card size, not just full width? Most of its life is small.

## When it will not come out right

Leave the field empty and say what is needed in the handoff summary. An empty
image slot is a task for a human; a nearly-right image is a thing that ships and
then sits on the site looking almost like the brand. The second is worse.

An image you do attach carries its alt text — `figure.alt` is
`validation.required()` (`packages/sanity/src/schemas/objects/figure.ts`), so an
asset attached with the field left blank leaves the document invalid until
somebody opens Studio and finds out.
