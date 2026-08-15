import { defineType } from 'sanity'
import type { FieldDefinition, ObjectDefinition } from 'sanity'
import type { BlockKnobs } from '@o3/block-spec'
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
   * block belongs in the `o3-composition` guidance document. Surfaced to every
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
 * shared `surface` knob wherever the block did not place it, and refuses names
 * missing from the registry.
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
  if (!knobs.knobs.some((knob) => knob.name === 'surface')) {
    throw new Error(
      `defineSectionBlock: "${name}" declares knobs but no surface knob — every section block paints a band. Add surfaceKnob().`,
    )
  }
  requireDescription('defineSectionBlock', name, description)
  return defineType({
    name,
    title,
    description,
    type: 'object',
    fields: withKnobFields('defineSectionBlock', name, fields, knobs),
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
