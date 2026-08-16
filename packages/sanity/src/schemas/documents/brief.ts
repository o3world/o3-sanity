import { defineArrayMember, defineField, defineType } from 'sanity'

import type { ConditionalPropertyCallback } from 'sanity'

/**
 * A file-backed brief is owned by its markdown (ADR 0027): the repo is the
 * source of truth for it, and one owner means no field of it is Studio's to
 * edit — the markdown is where the change goes. Studio shows those briefs and
 * edits none of them. A dataset-born brief has no `sourcePath` and stays
 * editable.
 */
const fileBacked: ConditionalPropertyCallback = ({ document }) => Boolean(document?.sourcePath)

/**
 * The persistent background behind one or more pieces of content: what we
 * knew and what we asked for (ADR 0027). An authoring session fetches a
 * piece's briefs before drafting and interviews only for what is missing, so
 * the research that used to die with the chat outlives it.
 *
 * Internal the way `guidance` is — not routable, no `slug`, no `seo`, no
 * `migration` object — and its ids (`brief-<key>`) miss the load pipeline's
 * `<type>-(wp|seed)-` ownership contract, so `load` never writes or retires
 * one and `verify` says nothing about it. Content points here through a weak
 * `briefs` reference array: a piece is never publish-blocked or delete-locked
 * by its own provenance.
 *
 * A brief is never rendered on the site.
 */
export const brief = defineType({
  name: 'brief',
  title: 'Brief',
  type: 'document',
  description:
    'The background behind a piece of content — the research, the instructions, and what the authoring interview produced. Internal: agents read it before drafting, and no visitor ever sees it.',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      readOnly: fileBacked,
      description: 'What this brief is about, in a few words — how an author finds it in a list.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'background',
      type: 'text',
      rows: 20,
      readOnly: fileBacked,
      description:
        'The raw material: research, notes, transcripts, pasted evidence. What we knew going in, in whatever shape it arrived.',
    }),
    defineField({
      name: 'instructions',
      type: 'text',
      rows: 8,
      readOnly: fileBacked,
      description:
        'The directives for the piece — what to argue, what to avoid, who it is for. What we asked for, as opposed to what we knew.',
    }),
    defineField({
      name: 'links',
      type: 'array',
      of: [defineArrayMember({ type: 'url' })],
      readOnly: fileBacked,
      description: 'External sources behind the piece, as URLs.',
    }),
    defineField({
      name: 'key',
      title: 'Key',
      type: 'string',
      readOnly: true,
      description:
        'Stable identifier this brief is addressed by; its document id is `brief-<key>`.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sourcePath',
      title: 'Source file',
      type: 'string',
      readOnly: true,
      description:
        'Repo-relative path of the markdown this was synced from — edit it there. Absent on a brief the authoring skill wrote mid-session.',
    }),
    defineField({
      name: 'record',
      title: 'Interview record',
      type: 'text',
      rows: 12,
      readOnly: true,
      description:
        'What the authoring interview produced — the agreed thesis, the locked reader-test questions, the gap list. Written by the skill, in a format that belongs to the skill.',
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'key' } },
})
