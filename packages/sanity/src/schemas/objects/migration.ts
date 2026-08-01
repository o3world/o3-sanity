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
    /* Which canonical frame this document's copy was transcribed from — the
     * frames carry finished copy, so seeding a greenfield page is a
     * transcription job (ADR 0007). Ids use `:`, as the MCP tools do; a share
     * URL's `?node-id=` uses `-` and is often a CHILD (docs/agents/figma.md). */
    defineField({
      name: 'figmaNode',
      title: 'Figma node',
      type: 'string',
      readOnly: true,
      description: 'The canonical frame this document’s copy was transcribed from, e.g. 1680:2134.',
    }),
    /* The coverage-gap marker (ADR 0007). On a case study it is the stronger
     * claim — the document invents client outcomes — so seed.test.ts fails any
     * case study not sourced from WordPress that omits it. */
    defineField({
      name: 'provisional',
      title: 'Provisional content',
      type: 'boolean',
      readOnly: true,
      description:
        'Placeholder content, not authoritative — present so the route resolves. Cleared by replacing it with migrated or frame-transcribed content.',
      initialValue: false,
    }),
    /* Required whenever `provisional` is set: "no WordPress source exists" and
     * "waiting on #22" call for opposite actions, and a bare boolean says
     * neither. */
    defineField({
      name: 'provisionalNote',
      title: 'Why this is provisional',
      type: 'text',
      rows: 2,
      readOnly: true,
      description: 'What is missing, and what would replace it.',
      hidden: ({ parent }) => !(parent as { provisional?: boolean })?.provisional,
    }),
  ],
})
