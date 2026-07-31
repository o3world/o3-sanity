import { defineField, defineType } from 'sanity'
import type { FieldDefinition, ObjectDefinition } from 'sanity'
import { SURFACES } from '../../constants'
import { BASE_BLOCKS, SECTION_BLOCKS } from './registry'

type BlockOptions = {
  name: string
  title: string
  fields: FieldDefinition[]
  preview?: ObjectDefinition['preview']
  /** Default surface for this block's SectionShell. */
  defaultSurface?: (typeof SURFACES)[number]
}

/**
 * A section-tier block: a full-width page section rendered inside
 * SectionShell. The factory appends the shared `surface` field (the
 * white/bone/ink three-surface system) and refuses names missing from the
 * registry.
 */
export function defineSectionBlock({
  name,
  title,
  fields,
  preview,
  defaultSurface = 'white',
}: BlockOptions) {
  if (!SECTION_BLOCKS.includes(name as (typeof SECTION_BLOCKS)[number])) {
    throw new Error(
      `defineSectionBlock: "${name}" is not in SECTION_BLOCKS — register it in registry.ts first.`,
    )
  }
  return defineType({
    name,
    title,
    type: 'object',
    fields: [
      ...fields,
      defineField({
        name: 'surface',
        type: 'string',
        options: { list: [...SURFACES], layout: 'radio', direction: 'horizontal' },
        initialValue: defaultSurface,
      }),
    ],
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
}: Omit<BlockOptions, 'defaultSurface'>) {
  if (!BASE_BLOCKS.includes(name as (typeof BASE_BLOCKS)[number])) {
    throw new Error(
      `defineBaseBlock: "${name}" is not in BASE_BLOCKS — register it in registry.ts first.`,
    )
  }
  return defineType({ name, title, type: 'object', fields, preview })
}
