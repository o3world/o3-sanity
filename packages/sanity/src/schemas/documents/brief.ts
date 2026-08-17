import { defineArrayMember, defineField, defineType } from 'sanity'

import { BRIEF_STAGES } from '../../constants'

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
 * Everything the pipeline produces is a field of its own, patched by the stage
 * that produced it: a resuming session reads its state instead of parsing it
 * back out of prose, and two stages writing at once cannot overwrite each
 * other's work. Those fields are machine-written, so all of them are
 * `readOnly` in Studio however the brief was born.
 *
 * A brief is never rendered on the site.
 */
export const brief = defineType({
  name: 'brief',
  title: 'Brief',
  type: 'document',
  description:
    'The background behind a piece of content — the research, the instructions, and everything the authoring pipeline made of them, a field per stage. Internal: agents read it before drafting, and no visitor ever sees it.',
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
      name: 'stage',
      type: 'string',
      options: { list: [...BRIEF_STAGES] },
      initialValue: 'gather',
      readOnly: true,
      description:
        'The last pipeline stage that finished. Where a resuming session picks the piece up, and the only field that says how far it has got.',
    }),
    defineField({
      name: 'nextStep',
      type: 'text',
      rows: 3,
      readOnly: true,
      description:
        'What the next session does first, in a sentence or two — written by the stage that just finished, for the stage that has not started.',
    }),
    defineField({
      name: 'thesis',
      type: 'text',
      rows: 4,
      readOnly: true,
      description:
        'The one claim the piece makes, agreed with the human before any of it is drafted. Everything downstream is written to it and reviewed against it.',
    }),
    defineField({
      name: 'readerQuestions',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      readOnly: true,
      description:
        'What a reader must be able to answer after reading, agreed alongside the thesis. Append-only: the review stage tests the draft against what was agreed, so a question is added and never rewritten.',
    }),
    defineField({
      name: 'outline',
      type: 'text',
      rows: 16,
      readOnly: true,
      description:
        'The agreed shape of the piece as markdown — its sections and what each one has to do. The plan the draft is written from.',
    }),
    defineField({
      name: 'draft',
      type: 'object',
      readOnly: true,
      description:
        'The piece as prose, before it is a document. Reviewed here and typeset into blocks afterwards, so a rewrite costs no block surgery.',
      fields: [
        defineField({ name: 'title', type: 'string' }),
        defineField({
          name: 'excerpt',
          type: 'text',
          rows: 3,
          description: 'The card and listing summary, drafted with the piece rather than after it.',
        }),
        defineField({
          name: 'body',
          type: 'text',
          rows: 30,
          description:
            'The prose as markdown, carrying the block each passage becomes as an inline label — the typeset stage reads those labels and needs no second pass to guess.',
        }),
      ],
    }),
    defineField({
      name: 'verdict',
      type: 'object',
      readOnly: true,
      description:
        'What the review stage found. A failing verdict is the record of why, not a reason to delete the draft — the next pass is written against it.',
      fields: [
        defineField({
          name: 'result',
          type: 'string',
          options: { list: ['pass', 'fail'] },
          description: 'Whether the draft may go on to typesetting.',
        }),
        defineField({
          name: 'gates',
          type: 'array',
          description: 'Each check the review ran, and how the draft did against it.',
          of: [
            defineArrayMember({
              name: 'gate',
              type: 'object',
              fields: [
                defineField({ name: 'label', type: 'string' }),
                defineField({
                  name: 'result',
                  type: 'string',
                  options: { list: ['pass', 'fail'] },
                }),
                defineField({
                  name: 'note',
                  type: 'text',
                  rows: 2,
                  description:
                    'What the gate saw — required when it failed, so the fix is actionable.',
                }),
              ],
              preview: { select: { title: 'label', subtitle: 'result' } },
            }),
          ],
        }),
        defineField({
          name: 'readerAnswer',
          type: 'text',
          rows: 8,
          description:
            'How the draft answers each locked reader question, in the order they were locked. The reader test, written down rather than asserted.',
        }),
      ],
    }),
    defineField({
      name: 'decisions',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      readOnly: true,
      description:
        'Calls the run made that a later session must not quietly reverse — an angle dropped, a structure chosen, a fact ruled out. One entry each, what and why.',
    }),
    defineField({
      name: 'gaps',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      readOnly: true,
      description:
        'What the piece could not answer and why it was worth asking. Read before a rewrite: a gap nobody closed is the thing to close first.',
    }),
    defineField({
      name: 'pieceId',
      title: 'Piece',
      type: 'string',
      readOnly: true,
      description:
        'Document id of the content this brief produced, written when that document is created. The reverse of the weak `briefs` reference the piece carries, and a plain id rather than a reference so a brief never blocks or locks the piece.',
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'key' } },
})
