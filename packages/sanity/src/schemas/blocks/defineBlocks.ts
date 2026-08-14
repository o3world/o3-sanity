import { defineType } from 'sanity'
import type { FieldDefinition, ObjectDefinition } from 'sanity'
import type { BlockKnobs } from '@o3/block-spec'
import type { Surface } from '../../constants'
import { surfaceKnob } from '../../knobs/surface'
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
   * This block's design options (ADR 0020). Their Sanity fields are generated
   * from the declaration, including the `surface` knob every section block
   * has, so a block that passes `knobs` does not also pass `defaultSurface`.
   */
  knobs?: BlockKnobs
  /**
   * Default surface for this block's SectionShell — the shorthand for a block
   * that has not been converted to `knobs` yet. It builds a knob spec of
   * exactly one knob, so `surface` reaches the form by the same path either
   * way. Retired when #113 converts the last block.
   */
  defaultSurface?: Surface
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
  fields,
  preview,
  knobs,
  defaultSurface = 'white',
}: BlockOptions) {
  if (!SECTION_BLOCKS.includes(name as (typeof SECTION_BLOCKS)[number])) {
    throw new Error(
      `defineSectionBlock: "${name}" is not in SECTION_BLOCKS — register it in registry.ts first.`,
    )
  }
  const spec: BlockKnobs = knobs ?? {
    type: name,
    title,
    tier: 'section',
    knobs: [surfaceKnob({ initialValue: defaultSurface })],
  }
  if (knobs && !spec.knobs.some((knob) => knob.name === 'surface')) {
    throw new Error(
      `defineSectionBlock: "${name}" declares knobs but no surface knob — every section block paints a band. Add surfaceKnob().`,
    )
  }
  return defineType({
    name,
    title,
    type: 'object',
    fields: withKnobFields('defineSectionBlock', name, fields, spec),
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
}: Omit<BlockOptions, 'defaultSurface' | 'knobs' | 'fields'> & { fields: FieldDefinition[] }) {
  if (!BASE_BLOCKS.includes(name as (typeof BASE_BLOCKS)[number])) {
    throw new Error(
      `defineBaseBlock: "${name}" is not in BASE_BLOCKS — register it in registry.ts first.`,
    )
  }
  return defineType({ name, title, type: 'object', fields, preview })
}
