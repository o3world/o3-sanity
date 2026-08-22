import { defineBlockKnobs, defineItemKnobs, knob } from '@o3/block-spec'
import { decorationKnob } from './decoration'
import { surfaceKnob } from './surface'
import type { FeatureGridSection } from '../types/generated'

/**
 * One feature's design options — the glyph that stands beside its copy.
 *
 * Declared against the FEATURE, so `icon` is the member's own field and
 * `features[].icon` is spelled nowhere (ADR 0021). Menu-only: the bar is a
 * curated subset of the BLOCK's roster and `barKnobs` never sees an item spec.
 *
 * **A design option, not a content field.** The test ADR 0020 hands the author
 * is whether an editor changing it is deciding how the band LOOKS, and this one
 * is: the glyph is the ornament the copy stands next to, the same position
 * `mark` already occupies, and swapping Sparkle for Gear changes nothing the
 * band says. It is also the second field in the repo called `icon` and the
 * second declared this way — `button.icon` settled the shape (#151), down to
 * `none` being the fourth answer rather than an empty field.
 *
 * **The glyphs are drawn by the control, not by this file.** This directory is
 * bundled into the Studio and into the preview overlay, so a declaration that
 * imported a render layer would drag it into both. `optionPreview: 'glyph'`
 * says the option VALUES name icons; the app hands the map from names to
 * components to the canvas and to its own feature binding.
 *
 * **The eighteen are O3XO's, and O3 draws none of them.** The content model
 * does not fork (ADR 0028), so the field is on the shared member and an O3
 * document that never sets it renders exactly as it did — `none` is the
 * default, and O3's app binds no icons at all.
 */
export const featureKnobs = defineItemKnobs({
  type: 'feature',
  title: 'Feature',
  knobs: [
    knob({
      name: 'icon',
      title: 'Icon',
      description:
        'The glyph beside this feature’s copy, from the kit’s set. None leaves the mark to stand on its own.',
      // The `Phosphor Icons` set (`4404:5589`, Icons canvas `345:2833` of the
      // _O3XO: UI kit_ file) holds exactly these eighteen, and offering a
      // nineteenth would let an editor pick a shape the kit does not draw.
      optionPreview: 'glyph',
      options: [
        'none',
        'arrow-circle-right',
        'chart-line-up',
        'crosshair',
        'file-magnifying-glass',
        'gear',
        'handshake',
        'hard-drives',
        'lightbulb-filament',
        'line-segments',
        'link',
        'map-trifold',
        'path',
        'share-network',
        'sparkle',
        'sun-horizon',
        'swap',
        'user-gear',
        'users',
      ],
      initialValue: 'none',
    }),
  ],
})

/**
 * The feature band's design options.
 *
 * Read this file to know what the band offers. The Sanity fields, and the
 * canvas toolbar's controls, are generated from it, so neither can offer a
 * value this file does not list.
 *
 * `layout` is read by more than the renderer: `features` validates its length
 * only on `orbital`, because the diagram has exactly four nodes drawn into it.
 * That rule stays a `validation` closure in the schema — a knob declares what
 * an editor may choose, not what the choice then requires of the rest of the
 * document.
 */
export const featureGridSectionKnobs = defineBlockKnobs({
  type: 'featureGridSection',
  title: 'Feature grid',
  tier: 'section',
  knobs: [
    knob({
      name: 'layout',
      title: 'Layout',
      description:
        'Grid pairs each mark with its copy, two across. Stack sets the mark above the copy, three across. Rows gives each feature a hairlined full-width row, heading left and body right. Orbital places exactly four on the dotted tetrahedron.',
      // Four arrangements of one shape — {mark, heading, body} — read off five
      // canonical bands: About's rows (`1925:5915`), Solutions' diagram
      // (`1928:6524`), and the partner page's "Why Sanity + O3" (`2354:2530`),
      // "What it enables." (`2334:2122`) and "Use cases." (`2341:2250`). Same
      // content, four compositions, which is a `layout` axis rather than four
      // blocks (#56, #47, #92).
      options: ['grid', 'stack', 'rows', 'orbital'],
      initialValue: 'grid',
      // The axis that changes the most about what an editor is looking at.
      bar: true,
    }),
    // `2354:2530` hangs the molecule off the right of the ink band at 25%,
    // where About and Solutions hang nothing. The band's list is the quote
    // band's minus `orbs` — no canonical feature band draws the sphere.
    decorationKnob(['none', 'molecule']),
    surfaceKnob({ initialValue: 'white' }),
  ],
  /**
   * `features` keys the member spec by the block-relative array field, and that
   * key is load-bearing here and in `section.ts`'s `features` field at once.
   * Nothing checks that they agree (ADR 0021) — this directory may not import
   * `sanity` and so cannot see the schema — except `knobGuard.test.ts`, which
   * is the one place both halves are visible.
   */
  items: { features: featureKnobs },
  /**
   * One feature, not four. `features` requires exactly four on the `orbital`
   * layout and at least one otherwise, and the knob's default is `grid` — so
   * one is the smallest thing that satisfies what an inserted band actually is.
   * Switching to orbital then asks for three more, which is the form telling
   * the truth about the diagram.
   */
  placeholder: {
    _type: 'featureGridSection',
    heading: 'A heading for this grid.',
    features: [
      {
        _key: 'first',
        _type: 'feature',
        heading: 'First feature',
        body: 'Add this feature’s copy.',
      },
    ],
  } satisfies FeatureGridSection,
})
