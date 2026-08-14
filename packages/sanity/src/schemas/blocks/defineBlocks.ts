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
export function defineSectionBlock({ name, title, fields, preview, knobs }: BlockOptions) {
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
  return defineType({
    name,
    title,
    type: 'object',
    fields: withKnobFields('defineSectionBlock', name, fields, knobs),
    preview: preview ?? {
      select: { title: 'title' },
      prepare: (sel) => ({ title: sel.title ?? title, subtitle: title }),
    },
  })
}

/** A base-tier block: content that lives inside a layoutSection column. */
export function defineBaseBlock({
  name,
  title,
  fields,
  preview,
}: Omit<BlockOptions, 'knobs' | 'fields'> & { fields: FieldDefinition[] }) {
  if (!BASE_BLOCKS.includes(name as (typeof BASE_BLOCKS)[number])) {
    throw new Error(
      `defineBaseBlock: "${name}" is not in BASE_BLOCKS — register it in registry.ts first.`,
    )
  }
  return defineType({ name, title, type: 'object', fields, preview })
}
