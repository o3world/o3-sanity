import { defineType } from 'sanity'
import type { FieldDefinition, ObjectDefinition } from 'sanity'
import type { BlockKnobs } from '@o3/block-spec'
import { SURFACES, type Surface } from '../../constants'
import { anchorField, backgroundMediaField } from './fields'
import { withKnobFields, type KnobbedField } from './knobFields'
import { BASE_BLOCKS, SECTION_BLOCKS } from './registry'

/** @see KnobbedField — a hand-written field, or the name of a knob. */
type SectionField = KnobbedField

type BlockOptions = {
  name: string
  title: string
  /**
   * What the block is for, written for an author who cannot see the rendered
   * site (ADR 0025): the message it carries, when to reach for it, and the one
   * constraint the fields don't show. One block only — anything naming another
   * block belongs in the composition catalog
   * (`tools/authoring-skill/references/composition.md`). Surfaced to every
   * MCP consumer via `get_schema`, and to editors under the block in Studio.
   */
  description: string
  fields: SectionField[]
  preview?: ObjectDefinition['preview']
  /**
   * This block's design options (ADR 0020), including the `surface` knob every
   * section block has. Their Sanity fields are generated from the declaration.
   *
   * **Required, and that is the point of #113.** While the conversion was in
   * flight this was optional and a `defaultSurface` shorthand built a one-knob
   * spec for whatever had not been reached yet — two ways to say the same
   * thing, and the second one silently published a band colour no editorial
   * surface outside the Studio form could see. A block now declares its design
   * options or does not compile.
   */
  knobs: BlockKnobs
}

/**
 * A section-tier block: a full-width page section rendered inside
 * SectionShell. The factory generates each declared knob's field, appends the
 * shared `surface` knob wherever the block did not place it, appends the
 * shared `anchor` field after them, and refuses names missing from the
 * registry.
 *
 * **Three shared fields, injected by two different mechanisms, and the split
 * is the rule rather than an accident** (#149). `surface` is a closed set an
 * editor picks a look from, so it is a knob and its field is generated from
 * that declaration. `anchor` is a name an editor types and `backgroundMedia` a
 * picture they upload, so both are plain fields with no control for a toolbar
 * to draw. Adding a fourth: if a block would have a picker for it, it belongs
 * in `src/knobs/`; otherwise it belongs beside `anchorField` in `fields.ts`.
 */
export function defineSectionBlock({
  name,
  title,
  description,
  fields,
  preview,
  knobs,
}: BlockOptions) {
  if (!SECTION_BLOCKS.includes(name as (typeof SECTION_BLOCKS)[number])) {
    throw new Error(
      `defineSectionBlock: "${name}" is not in SECTION_BLOCKS — register it in registry.ts first.`,
    )
  }
  // EVERY SECTION BLOCK PAINTS A BAND, so every one has to say what colour it
  // is. Two ways to answer, and exactly one of them per block: offer the
  // choice with `surfaceKnob()`, or make it with `paintsOwnSurface` — the
  // three bands whose composition is drawn ON a colour (hero, CTA, case
  // showcase) take the second, because a picker over them turned and repainted
  // nothing. `defineBlockKnobs` refuses both at once.
  if (!knobs.knobs.some((knob) => knob.name === 'surface')) {
    if (knobs.paintsOwnSurface === undefined) {
      throw new Error(
        `defineSectionBlock: "${name}" declares knobs but no surface knob — every section block ` +
          `paints a band. Add surfaceKnob(), or declare paintsOwnSurface if the band's ` +
          `composition fixes its colour.`,
      )
    }
    if (!SURFACES.includes(knobs.paintsOwnSurface as Surface)) {
      throw new Error(
        `defineSectionBlock: "${name}" declares paintsOwnSurface "${knobs.paintsOwnSurface}", ` +
          `which is not one of ${SURFACES.join(' | ')}.`,
      )
    }
  }
  requireDescription('defineSectionBlock', name, description)
  return defineType({
    name,
    title,
    description,
    type: 'object',
    // The anchor lands last, after the knobs the splice appends: it is the one
    // field on a band that is about the page rather than about the band, and a
    // form an editor reads top-down should not open on it. The background sits
    // in front of it, beside the surface it paints under — the two answer one
    // question about what the band is drawn on.
    fields: [
      ...withKnobFields('defineSectionBlock', name, fields, knobs),
      backgroundMediaField(),
      anchorField(),
    ],
    preview: preview ?? {
      select: { title: 'title' },
      prepare: (sel) => ({ title: sel.title ?? title, subtitle: title }),
    },
  })
}

/**
 * A base-tier block: content that lives inside a layoutSection column.
 *
 * **No `knobs` argument, and that is load-bearing** (ADR 0022). The canvas
 * toolbar cannot attach anywhere inside `layoutSection.items` at
 * `sanity@6.8.0` / `@sanity/visual-editing@5.7.3` — it is the repo's one
 * polymorphic array below a block root, and the overlay resolves nothing there,
 * silently (#104, #115). We left it that way because a base block has no design
 * option to offer: there is nothing to be silent about.
 *
 * So adding `knobs` here is the trigger to re-read ADR 0022 first. The knob
 * would generate a field, the form would show it, and the toolbar would go on
 * showing nothing — which is the failure the whole declaration exists to make
 * impossible.
 */
export function defineBaseBlock({
  name,
  title,
  description,
  fields,
  preview,
}: Omit<BlockOptions, 'knobs' | 'fields'> & { fields: FieldDefinition[] }) {
  if (!BASE_BLOCKS.includes(name as (typeof BASE_BLOCKS)[number])) {
    throw new Error(
      `defineBaseBlock: "${name}" is not in BASE_BLOCKS — register it in registry.ts first.`,
    )
  }
  requireDescription('defineBaseBlock', name, description)
  return defineType({ name, title, description, type: 'object', fields, preview })
}

/** The type makes it required; this catches the empty string the type cannot. */
function requireDescription(factory: string, name: string, description: string) {
  if (!description?.trim()) {
    throw new Error(
      `${factory}: "${name}" has a blank description — write what the block is for (ADR 0025; the standard is in the content-naming skill).`,
    )
  }
}
