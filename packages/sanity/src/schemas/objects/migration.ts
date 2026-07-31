import { defineField, defineType } from 'sanity'

/**
 * Provenance for pipeline-owned documents (ADR 0003). The pipeline never
 * touches a document with `locked: true`, in any mode — locking is the
 * explicit editor act that takes a document out of rebuild's reach.
 */
export const migration = defineType({
  name: 'migration',
  title: 'Migration',
  type: 'object',
  fields: [
    defineField({
      name: 'locked',
      title: 'Locked from migration',
      type: 'boolean',
      description: 'When on, migration rebuilds and syncs will never modify this document.',
      initialValue: false,
    }),
    defineField({ name: 'sourceId', type: 'string', readOnly: true }),
    defineField({ name: 'extractedAt', type: 'datetime', readOnly: true }),
    defineField({
      name: 'source',
      type: 'text',
      readOnly: true,
      description: 'Extracted source snapshot (JSON) for side-by-side review of translated docs.',
    }),
  ],
})
