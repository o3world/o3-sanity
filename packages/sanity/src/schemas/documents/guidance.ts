import { defineField, defineType } from 'sanity'

/**
 * Agent-facing guidance, synced from the repo (#72). The store behind the
 * authoring skill's session-start fetch: the skill is a thin bootstrap that
 * carries no knowledge, so the voice guide and its brand foundation live here
 * where an MCP consumer can read them (map #63 → hybrid architecture).
 *
 * **The repo is source of truth.** Every field is written by
 * `pnpm guidance:sync` from markdown under `.claude/skills/`, so all of them
 * are `readOnly` in Studio — the same treatment the `migration` provenance
 * object gets, and for the same reason: editing here would be overwritten by
 * the next sync, silently. `pnpm guidance:check` fails when the two drift.
 *
 * Not editorial content: not routable, no `slug`, no `seo`, and no
 * `migration` object — the load pipeline neither owns nor retires these
 * documents (their ids miss the `<type>-(wp|seed)-` contract deliberately).
 */
export const guidance = defineType({
  name: 'guidance',
  title: 'Guidance',
  type: 'document',
  description:
    'Guidance for agents authoring O3 content. Read it before writing; never edit it here — it is synced from the o3-sanity repo.',
  fields: [
    defineField({
      name: 'key',
      title: 'Key',
      type: 'string',
      readOnly: true,
      description:
        'Stable identifier a consumer queries this document by, independent of its title — `o3-voice` is the voice guide.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Guidance',
      type: 'text',
      rows: 24,
      readOnly: true,
      description:
        'The guidance itself, as raw markdown. Plain text rather than portable text on purpose: agents consume it verbatim.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sourcePath',
      title: 'Source file',
      type: 'string',
      readOnly: true,
      description: 'Repo-relative path of the markdown this was synced from — edit it there.',
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'key' } },
})
