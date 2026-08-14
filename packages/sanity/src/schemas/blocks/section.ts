import { defineArrayMember, defineField } from 'sanity'
import { defineSectionBlock } from './defineBlocks'
import { decorationField } from './fields'
import { hiddenUnless } from './knobFields'
import { SECTION_BLOCKS } from './registry'
import { PAGE_TYPES } from '../../constants'
import { disciplineGridSectionKnobs } from '../../knobs/disciplineGridSection'
import { heroSectionKnobs } from '../../knobs/heroSection'
import { inFlightSectionKnobs } from '../../knobs/inFlightSection'
import { mediaSectionKnobs } from '../../knobs/mediaSection'
import { railPanelsSectionKnobs } from '../../knobs/railPanelsSection'

/**
 * The first block whose design options are declared rather than written out
 * (ADR 0020). `variant`, `decoration` and `surface` live in
 * `src/knobs/heroSection.ts`; the strings in `fields` say where their
 * generated fields sit. Everything else here is editorial and stays
 * hand-written.
 */
export const heroSection = defineSectionBlock({
  name: 'heroSection',
  title: 'Hero',
  knobs: heroSectionKnobs,
  fields: [
    'variant',
    defineField({
      name: 'eyebrow',
      type: 'string',
      description: 'Band variant only — the uppercase kicker ("WORK", "ABOUT O3").',
      // Was `({parent}) => parent?.variant !== 'band'`. The gate is the same;
      // it is now written down, so the canvas toolbar can read it instead of
      // guessing at a closure it cannot call (ADR 0020).
      hidden: hiddenUnless({ at: 'variant', mode: 'oneOf', values: ['band'] }),
    }),
    defineField({
      name: 'headlineLines',
      title: 'Headline lines',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'Each line animates in separately; on the orbital variant the last line renders set back. The band variant joins them into one headline.',
      validation: (rule) => rule.required().min(1).max(3),
    }),
    defineField({ name: 'subheading', type: 'text', rows: 2 }),
    defineField({ name: 'cta', type: 'cta' }),
    'decoration',
  ],
  preview: { select: { title: 'headlineLines.0' } },
})

export const logoWallSection = defineSectionBlock({
  name: 'logoWallSection',
  title: 'Logo wall',
  defaultSurface: 'bone',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    // The single `statement` this band shipped with split in two on the
    // 2026-08 frame (`1864:2390`, #89): a 48px heading over a 24px standfirst,
    // both centred. They are `heading` + `body` rather than a second
    // statement field because that is what the lexicon calls them — the
    // block's primary display text and the prose under it.
    defineField({
      name: 'heading',
      type: 'string',
      description: 'The section headline above the logos (`1864:2393`).',
    }),
    defineField({
      name: 'body',
      type: 'text',
      rows: 3,
      description: 'The standfirst under the heading (`2250:1307`).',
    }),
    defineField({
      name: 'clients',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'client' }] })],
      description:
        'Six is what the frame draws — one centred row of square tiles, wrapping below lg. The row takes whatever it is given.',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({ name: 'cta', type: 'cta' }),
  ],
  preview: { select: { title: 'heading' } },
})

export const caseShowcaseSection = defineSectionBlock({
  name: 'caseShowcaseSection',
  title: 'Case study showcase',
  defaultSurface: 'ink',
  fields: [
    defineField({ name: 'heading', type: 'string', initialValue: 'Our Work' }),
    defineField({ name: 'cta', type: 'cta' }),
    defineField({
      name: 'caseStudies',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'caseStudy' }] })],
      description:
        'Sticky-stacking cards; each pulls its narrative headline and headline stat from the case study.',
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: { select: { title: 'heading' } },
})

/**
 * `layout`, `rail` and `surface` are declared in
 * `src/knobs/railPanelsSection.ts` (ADR 0020), including the gate that used to
 * be `rail`'s `hidden` closure. Everything here is editorial.
 */
export const railPanelsSection = defineSectionBlock({
  name: 'railPanelsSection',
  title: 'Rail + panels',
  knobs: railPanelsSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'intro', type: 'text', rows: 3 }),
    'layout',
    'rail',
    defineField({
      name: 'panels',
      type: 'array',
      validation: (rule) => rule.required().min(2),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'panel',
          fields: [
            defineField({
              name: 'railLabel',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({ name: 'heading', type: 'string' }),
            defineField({
              name: 'logo',
              type: 'image',
              description: 'Optional logo shown instead of the heading (platform panels).',
            }),
            defineField({
              name: 'body',
              type: 'text',
              rows: 3,
              description:
                'The panel’s prose. On a card it is the single line under the heading ("Senior hands, inside your team.") — the card has room for one.',
            }),
            defineField({
              name: 'note',
              type: 'string',
              description: 'The quieter "Best when…" line — the foot of a card.',
            }),
            // `cta` and `media` are rail-layout elements like the `rail` knob,
            // but a panel field's `hidden` callback sees only the panel it
            // sits in, not the section's `layout` — and a `showWhen` reads
            // block-relative paths for the same reason. So these two carry the
            // gate as prose where `rail` gets the declared one.
            defineField({
              name: 'cta',
              type: 'cta',
              description: 'Rail layout only. The frame’s cards carry no button.',
            }),
            defineField({
              name: 'media',
              type: 'figure',
              description: 'Rail layout only. A card draws a halftone disc instead.',
            }),
          ],
          preview: { select: { title: 'railLabel' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading' } },
})

export const quoteSection = defineSectionBlock({
  name: 'quoteSection',
  title: 'Quote',
  defaultSurface: 'bone',
  fields: [
    defineField({ name: 'quote', type: 'text', rows: 4, validation: (rule) => rule.required() }),
    defineField({
      name: 'attribution',
      type: 'string',
      description: 'e.g. "Business Leader, Global Health Brand".',
    }),
    // `molecule` is the 2026-08 case-study quote (`2250:1525`): the same band,
    // with the molecule mark set at 699px and 10% behind the copy instead of
    // the two spheres. A third value on this block's list rather than a second
    // block — the composition is identical.
    decorationField(['orbs', 'molecule', 'none']),
  ],
  preview: { select: { title: 'quote' } },
})

export const insightsCarouselSection = defineSectionBlock({
  name: 'insightsCarouselSection',
  title: 'Insights carousel',
  defaultSurface: 'bone',
  fields: [
    defineField({ name: 'heading', type: 'string', initialValue: 'The thinking behind the work.' }),
    defineField({
      name: 'insights',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'insight' }] })],
      description: 'Leave empty to show the latest insights automatically.',
    }),
    defineField({
      name: 'category',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'When auto-filling, limit to this category.',
      hidden: ({ parent }) => Boolean(parent?.insights?.length),
    }),
  ],
  preview: { select: { title: 'heading' } },
})

export const ctaSection = defineSectionBlock({
  name: 'ctaSection',
  title: 'CTA',
  defaultSurface: 'ink',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'body', type: 'text', rows: 2 }),
    defineField({ name: 'cta', type: 'cta' }),
    decorationField(['orbs', 'none']),
  ],
  preview: { select: { title: 'heading' } },
})

/**
 * `layout` and `surface` are declared in `src/knobs/disciplineGridSection.ts`
 * (ADR 0020). The `disciplines` length rule still reads `layout` from the form
 * value, because what a choice requires of the rest of the document is
 * validation rather than a knob.
 */
export const disciplineGridSection = defineSectionBlock({
  name: 'disciplineGridSection',
  title: 'Discipline grid',
  knobs: disciplineGridSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    'layout',
    defineField({
      name: 'disciplines',
      type: 'array',
      description:
        'Order is meaningful on the orbital layout: the first is the apex, the rest take the base ring left → right → front. Positions derive from order, never from the author.',
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .custom((disciplines, context) => {
            const layout = (context.parent as { layout?: string } | undefined)?.layout
            if (layout !== 'orbital') return true
            // The diagram has exactly four nodes drawn into it (`1928:6526`);
            // a fifth discipline has nowhere to stand.
            return (disciplines as unknown[] | undefined)?.length === 4
              ? true
              : 'The orbital layout places exactly four disciplines.'
          }),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'discipline',
          fields: [
            defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'body', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'heading', subtitle: 'body' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'layout' } },
})

export const personGridSection = defineSectionBlock({
  name: 'personGridSection',
  title: 'Person grid',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'people',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'person' }] })],
      description:
        'Referenced, not inlined — a person is already a document (they author insights), so the About band points at the same record rather than re-typing it.',
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'eyebrow' } },
})

export const roleListSection = defineSectionBlock({
  name: 'roleListSection',
  title: 'Role list',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'roles',
      type: 'array',
      validation: (rule) => rule.required().min(1),
      /**
       * ROLES ARE INLINE OBJECTS, NOT A DOCUMENT TYPE — decided here (#56).
       *
       * A `role` document would buy exactly one thing: a URL to link to. The
       * Careers band (`1925:6061`) links out instead — every row's Apply
       * button is a `cta`, and the frame draws no role detail page, no
       * listing of roles anywhere else, and no cross-reference to one. A
       * document type also costs a routable slug, a card projection and a
       * Studio section per ADR 0001, for content that turns over every few
       * months and is authored in one place.
       *
       * Promote it the day something needs to link to a role — an /apply
       * route, a role referenced from an insight, or an ATS feed with its
       * own ids. Until then this is the cheaper half of a reversible choice.
       */
      of: [
        defineArrayMember({
          type: 'object',
          name: 'role',
          fields: [
            defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'eyebrow',
              type: 'string',
              description: 'The row’s small label — the frame reads "REMOTE · PHILADELPHIA".',
            }),
            defineField({ name: 'cta', type: 'cta', description: 'The row’s Apply button.' }),
          ],
          preview: { select: { title: 'heading', subtitle: 'eyebrow' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'eyebrow' } },
})

/**
 * `layout` and `surface` are declared in `src/knobs/inFlightSection.ts`
 * (ADR 0020). Everything here is editorial.
 */
export const inFlightSection = defineSectionBlock({
  name: 'inFlightSection',
  title: 'In flight',
  knobs: inFlightSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'subheading',
      type: 'text',
      rows: 2,
      description: 'The 24px standfirst beside the heading. The Ideas band has none.',
    }),
    'layout',
    defineField({
      name: 'entries',
      type: 'array',
      validation: (rule) => rule.required().min(1),
      /**
       * ENTRIES ARE INLINE OBJECTS, NOT REFERENCES — decided here (#50).
       *
       * The obvious reading of the studio band is "reference the case studies
       * that are in progress". The frame says otherwise, in its own copy: "not
       * the polished case study, the part where it's still being figured out".
       * Every card is anonymous (no client, no logo), carries no link, and its
       * kicker is a bare sector pair — "FINTECH · ONBOARDING" — where a real
       * case-study card draws `industry · industryDetail` from the document
       * (`1883:3561`). Pointing these at `caseStudy` documents would publish
       * client work that has not shipped, which is the exact thing ADR 0007
       * exists to stop.
       *
       * The appearances band has the same shape and no document behind it
       * either: the content model has no `event` type, and inventing one for
       * four rows on one page is the trade `roleListSection` already declined.
       * Promote it the day an appearance needs a URL of its own, or the day a
       * second surface needs the same list.
       */
      of: [
        defineArrayMember({
          type: 'object',
          name: 'entry',
          fields: [
            defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'eyebrow',
              type: 'string',
              description: 'The entry’s small label — "FINTECH · ONBOARDING", "WORKSHOP · ONLINE".',
            }),
            defineField({
              name: 'media',
              type: 'figure',
              description: 'The card image. Ignored by the rows layout, which draws a disc.',
            }),
            defineField({
              name: 'date',
              type: 'date',
              description:
                'When it happens — the rows layout draws it as the red MON / DD marker. Leave empty and the row leads with the halftone disc instead.',
            }),
            defineField({
              name: 'cta',
              type: 'cta',
              description:
                'Where the row goes. The label is never drawn — it names the arrow control for a screen reader.',
            }),
          ],
          preview: { select: { title: 'heading', subtitle: 'eyebrow', media: 'media.image' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'layout' } },
})

/**
 * The inquiry form band — the block `/contact` was missing (#58).
 *
 * **The field set is code, the words around it are content.** The inputs
 * this block draws (first name, last name, email, reason, message, the
 * newsletter opt-in) are fixed in `FormSection.tsx`, transcribed from the
 * Gravity Form 1 that WordPress serves on `/contact` today. They are not
 * editor-authorable, and that is the decision rather than an omission: a
 * field set is a contract with whatever receives a submission, and an editor
 * who could delete `email` could break the form for everyone. Making them
 * content would mean building a form builder — a much larger thing, for a
 * destination nobody has chosen yet (ADR 0014).
 *
 * `reasons` is the exception, and shows where the line falls: the dropdown's
 * options are studio taxonomy that changes when the business changes
 * ("Ventures request", "Labs request"), and every value is just a string to
 * any handler. So they are content; the input that carries them is not.
 *
 * ⚠️ **There is no submission handler and no destination.** #58's other two
 * halves are open, so the renderer disables its submit and says so on the
 * page. This block is honest scaffolding, not a working form.
 */
export const formSection = defineSectionBlock({
  name: 'formSection',
  title: 'Form',
  defaultSurface: 'bone',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'note',
      type: 'text',
      rows: 2,
      description: 'The quieter line under the heading, above the first field.',
    }),
    defineField({
      name: 'reasons',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description:
        'The options in the “Reason” dropdown, in the order they are shown. Carried from Gravity Form 1.',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'consentLabel',
      type: 'string',
      description:
        'The opt-in checkbox beside the submit. Leave empty and no checkbox is drawn — an opt-in nobody asked for is worse than none.',
    }),
    defineField({
      name: 'submitLabel',
      type: 'string',
      description: 'The submit button’s words. Disabled until #58 has a handler behind it.',
      // Optional, not required(): the renderer absorbs absence with the same
      // 'Send message' fallback, so a missing value costs nothing (skill rule:
      // fields the renderer can absorb stay optional).
      initialValue: 'Send message',
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'eyebrow' } },
})

export const layoutSection = defineSectionBlock({
  name: 'layoutSection',
  title: 'Layout section',
  fields: [
    // The interior frames head almost every band with the same three-part
    // stack — eyebrow, heading, and a set-back second line (`1924:5344`'s
    // "WHY O3 / Built to go end to end — on purpose."). Added in #42 so the
    // About and Solutions layers can be composed from this block instead of
    // needing one of their own.
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'subheading',
      type: 'text',
      rows: 2,
      description: 'The quieter second line under the heading.',
    }),
    defineField({
      name: 'columns',
      type: 'number',
      options: { list: [1, 2, 3], layout: 'radio', direction: 'horizontal' },
      initialValue: 1,
    }),
    defineField({
      name: 'items',
      type: 'array',
      of: [
        defineArrayMember({ type: 'richText' }),
        defineArrayMember({ type: 'figure' }),
        defineArrayMember({ type: 'embed' }),
        defineArrayMember({ type: 'cta' }),
        defineArrayMember({ type: 'statGroup' }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: (sel) => ({ title: sel.title ?? 'Layout section' }),
  },
})

/**
 * `variant`, `width` and `surface` are declared in `src/knobs/mediaSection.ts`
 * (ADR 0020), including the gate that used to be `width`'s `hidden` closure.
 * `media` is the only editorial field the band has.
 */
export const mediaSection = defineSectionBlock({
  name: 'mediaSection',
  title: 'Media section',
  knobs: mediaSectionKnobs,
  fields: [
    defineField({ name: 'media', type: 'figure', validation: (rule) => rule.required() }),
    'variant',
    'width',
  ],
  preview: { select: { title: 'media.alt', subtitle: 'variant' } },
})

/**
 * Tiled product screenshots on gradient plates — the case-study frame's screen
 * bands (`2230:3315`, `2230:7559`), #97.
 *
 * Registered as an ordinary section block rather than a case-study element:
 * ADR 0018's showcase rule is that every band the case study needs is a block
 * any content type can compose, so this is available to `page.sections` on the
 * day it lands.
 *
 * Two fields per screen and no more. The frame's plates differ in exactly two
 * ways — the colour behind the screenshot (`tone`) and whether the tile takes
 * one column or both (`span`) — and everything else about a tile (32px radius,
 * the 12px-radius screenshot inside it, the crop) is composition the renderer
 * owns. Plate HEIGHT is deliberately not a field: `2230:7559` draws 716 for a
 * wide tile and 342 for a small one, so height follows `span` (ADR 0006 —
 * renderers decide).
 */
export const screenGridSection = defineSectionBlock({
  name: 'screenGridSection',
  title: 'Screen grid',
  fields: [
    defineField({
      name: 'screens',
      type: 'array',
      description: 'Tiles fill the two-column grid in order; a wide screen takes both columns.',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'screen',
          fields: [
            defineField({ name: 'media', type: 'figure', validation: (rule) => rule.required() }),
            defineField({
              name: 'tone',
              type: 'string',
              description: 'The plate the screenshot sits on.',
              options: {
                list: ['ink', 'brand', 'bone'],
                layout: 'radio',
                direction: 'horizontal',
              },
              initialValue: 'ink',
            }),
            defineField({
              name: 'span',
              type: 'string',
              description: 'Wide takes both columns — the frame’s lead tile.',
              options: { list: ['standard', 'wide'], layout: 'radio', direction: 'horizontal' },
              initialValue: 'standard',
            }),
          ],
          preview: { select: { title: 'media.alt', subtitle: 'tone', media: 'media.image' } },
        }),
      ],
    }),
  ],
  preview: {
    // The lead tile stands for the band in the array, the way `figure` previews
    // on its own `alt`. A grid whose first screen has no alt yet falls back to
    // the block's name rather than showing an empty row.
    select: { alt: 'screens.0.media.alt', media: 'screens.0.media.image', screens: 'screens' },
    prepare: (sel) => ({
      title: (sel.alt as string | undefined) ?? 'Screen grid',
      subtitle: `${((sel.screens as unknown[] | undefined) ?? []).length} screens`,
      media: sel.media,
    }),
  },
})

export const listingSection = defineSectionBlock({
  name: 'listingSection',
  title: 'Listing',
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'pageType',
      type: 'string',
      options: { list: [...PAGE_TYPES] },
      initialValue: 'service',
      description: 'Lists pages of this type via their card fieldset.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'pageType' } },
})

/**
 * What `page.sections` and `caseStudy.story` will accept — **derived from the
 * registry**, not restated. (`story` also takes `chapter`, which is a shared
 * object rather than a block, so it is added beside these members — ADR 0018.)
 *
 * This was a second hand-maintained copy of `SECTION_BLOCKS` in the same
 * order, and #58 found out why that costs: `formSection` was registered,
 * defined, rendered and bound, and still could not appear in a page, because
 * this list had not heard of it. The failure surfaced as a typecheck error in
 * the *renderer* (`SectionProps<'formSection'>` not satisfying the generated
 * union) — three files away from the omission, and only because typegen
 * derives the query result from the array's members.
 *
 * A registered block an editor cannot author is not a state worth being able
 * to express, so it is no longer expressible.
 */
export const sectionBlockMembers = SECTION_BLOCKS.map((type) => ({ type }))
