import { defineType } from 'sanity'
import type { FieldDefinition, ObjectDefinition } from 'sanity'
import type { BlockKnobs } from '@o3/block-spec'
import type { Surface } from '../../constants'
import { surfaceKnob } from '../../knobs/surface'
import { knobFields } from './knobFields'
import { BASE_BLOCKS, SECTION_BLOCKS } from './registry'

/**
 * An entry in a block's `fields`: a hand-written editorial field, or the
 * **name of a knob** the block declares.
 *
 * A bare string is how a block says where a generated field sits. Field order
 * is a fact about the form an editor reads, so it stays authored in one
 * visible list rather than falling out of "editorial first, knobs appended" —
 * which would have moved `heroSection.variant` from the top of the form to the
 * middle on the day it became a knob.
 */
type SectionField = FieldDefinition | string

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
 * Splice a block's generated knob fields into its authored field list.
 *
 * A knob named in `fields` lands at that position; a knob that is not named is
 * appended after the editorial fields, in declaration order. The append rule
 * is what lets fifteen unconverted blocks keep their `surface` field in its
 * old last-position without any of them mentioning it.
 */
function withKnobFields(blockName: string, fields: SectionField[], spec: BlockKnobs) {
  // Keyed off the generated field's own name rather than the knob's, because
  // they are the same string by construction and one of them is already here.
  const generated = new Map(knobFields(spec).map((field) => [field.name, field]))

  const placed = new Set<string>()
  const resolved = fields.map((entry) => {
    if (typeof entry !== 'string') {
      if (generated.has(entry.name)) {
        throw new Error(
          `defineSectionBlock: "${blockName}.${entry.name}" is declared as a knob and written again as a field. ` +
            `Delete the field and name the knob — "${entry.name}" — where it belongs in the list.`,
        )
      }
      return entry
    }
    const field = generated.get(entry)
    if (!field) {
      throw new Error(
        `defineSectionBlock: "${blockName}" places a knob called "${entry}", which its knobs do not declare.`,
      )
    }
    placed.add(entry)
    return field
  })

  const appended = spec.knobs
    .filter((knob) => !placed.has(knob.name))
    .map((knob) => generated.get(knob.name) as FieldDefinition)

  return [...resolved, ...appended]
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
    fields: withKnobFields(name, fields, spec),
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
