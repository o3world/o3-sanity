import { defineArrayMember, defineField } from 'sanity'

/**
 * SHARED EDITORIAL FIELDS — the counterpart to `src/knobs/` (CONTEXT.md →
 * Known drift, which reserved this module for exactly this).
 *
 * The line between the two directories is the one the knob guard turns on: a
 * closed set an editor picks a **look** from is a knob and is declared in
 * `src/knobs/`; a field an editor **fills in** that more than one type carries
 * is written once here. Copying a `defineField` from one schema into another is
 * the signal to add it here instead.
 */

/**
 * WHAT A PIECE WAS WRITTEN FROM — the `briefs` array `insight`, `page` and
 * `caseStudy` carry (ADR 0027).
 *
 * **Weak, deliberately.** A brief is provenance, and provenance must never
 * publish-block or delete-lock the content it belongs to; weak also means the
 * order of `load` and `brief:sync` stops mattering, because neither has to
 * exist before the other.
 *
 * Plural because it is an array (CONTEXT.md → shape conventions), and the
 * plural is real: one topic researched once feeds every piece drawn from it,
 * and a piece combining two topics draws on both.
 */
export function briefsField() {
  return defineField({
    name: 'briefs',
    title: 'Briefs',
    type: 'array',
    of: [
      defineArrayMember({
        type: 'reference',
        to: [{ type: 'brief' }],
        weak: true,
        /* A brief's `key` is machine-written and readOnly, so one born inline
         * in Studio could never satisfy its own validation — briefs are made
         * by sync or by the authoring skill, and only pointed at from here. */
        options: { disableNew: true },
      }),
    ],
    description:
      'The background this piece was written from — research, instructions, and what the authoring interview produced. Internal: nothing here reaches the site.',
  })
}

/** No `#`, no whitespace — which is also the whole of what an HTML `id` forbids. */
const ANCHOR_NAME = /^[^\s#]+$/

/**
 * The one rule for an anchor's name, so the two ends of a jump link cannot
 * disagree about what a valid one is.
 *
 * A section stores the name a button stores, character for character: the
 * button emits `#` + the value and the section emits it as an `id`, so a rule
 * applied at one end and not the other would let an editor write a link that
 * can never resolve. Both ends call this.
 *
 * Deliberately loose. Slugifying (lowercase, kebab, must start with a letter)
 * would be a second vocabulary an editor has to learn to write a link, and the
 * browser asks for none of it — HTML5 accepts any non-empty id with no
 * whitespace in it.
 */
export function validateAnchorName(value: string | undefined): true | string {
  return !value || ANCHOR_NAME.test(value)
    ? true
    : 'Write the anchor’s name on its own — no # and no spaces.'
}

/**
 * THE ANCHOR EVERY SECTION BLOCK CARRIES — injected by `defineSectionBlock`,
 * beside the surface knob's generated field (#149).
 *
 * **A plain field, not a knob, and that is the test rather than an omission.**
 * An anchor id has no closed set to pick from and naming one is not a design
 * decision, so there is no control for a toolbar to draw (CONTEXT.md → Knobs).
 *
 * **Authored, never derived from the heading.** A derived anchor changes the
 * moment someone edits the heading above it, which breaks every link already
 * shared — and does it silently, on a page nobody was editing.
 *
 * The value reaches the page as an `id` on the band's own wrapper
 * (`packages/content-runtime/src/blocks/anchors.ts`), which is also where two bands
 * claiming one name are resolved.
 */
export function anchorField() {
  return defineField({
    name: 'anchor',
    title: 'Anchor',
    type: 'string',
    description:
      'A name for this band, so a button can jump to it. Written without the #. Keep it once people are sharing the link — changing it breaks every link already sent. Two bands with the same name resolve to the first.',
    validation: (rule) => rule.custom((value: string | undefined) => validateAnchorName(value)),
  })
}

/**
 * A LABELLED BREAKDOWN — a term over the values under it (#92).
 *
 * Two blocks draw it, which is what earns it a place here rather than a
 * `defineField` in each. The partner hero (`2401:3196`) sets "O3 EXPERTISE:"
 * over three credentials, pinned right where a standfirst would sit; a service
 * row (`2334:2165`) sets "Migration targets we've handled:" over three
 * platforms laid across, then the promise under its own label.
 *
 * **`items`, not a `body`.** `chapter.details` calls its second half `body`
 * because `2274:4009` flows one description beside a 180px term. Both frames
 * here lay SHORT values across instead, so the shape is a list — and a
 * one-item list is how the single-sentence case is spelled, rather than a
 * second field the renderer has to choose between. The word `details` is
 * shared with `chapter` deliberately: the lexicon's entry is "term/description
 * rows", and that is what both are.
 *
 * The gate is the caller's: both uses apply to one composition of their block,
 * and neither can be expressed as a `hidden` closure from where the field
 * sits, so each call site says so in its `description`.
 */
export function detailsField({ description }: { description?: string } = {}) {
  return defineField({
    name: 'details',
    type: 'array',
    description,
    of: [
      defineArrayMember({
        type: 'object',
        name: 'detail',
        fields: [
          defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
          defineField({
            name: 'items',
            type: 'array',
            of: [defineArrayMember({ type: 'string' })],
            description:
              'Laid across under the label. One item reads as a sentence; three read as a set.',
            validation: (rule) => rule.required().min(1),
          }),
        ],
        preview: { select: { title: 'label', subtitle: 'items.0' } },
      }),
    ],
  })
}
