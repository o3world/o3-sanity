import { defineArrayMember, defineField } from 'sanity'
import { defineArrayItem } from './defineArrayItem'
import { defineSectionBlock } from './defineBlocks'
import { hiddenUnless } from './knobFields'
import { blockArrayMembers } from './registry'
import { PAGE_TYPES } from '../../constants'
import { caseShowcaseSectionKnobs } from '../../knobs/caseShowcaseSection'
import { ctaSectionKnobs } from '../../knobs/ctaSection'
import { disciplineGridSectionKnobs } from '../../knobs/disciplineGridSection'
import { formSectionKnobs } from '../../knobs/formSection'
import { heroSectionKnobs } from '../../knobs/heroSection'
import { inFlightSectionKnobs } from '../../knobs/inFlightSection'
import { insightsCarouselSectionKnobs } from '../../knobs/insightsCarouselSection'
import { layoutSectionKnobs } from '../../knobs/layoutSection'
import { listingSectionKnobs } from '../../knobs/listingSection'
import { logoWallSectionKnobs } from '../../knobs/logoWallSection'
import { mediaSectionKnobs } from '../../knobs/mediaSection'
import { personGridSectionKnobs } from '../../knobs/personGridSection'
import { quoteSectionKnobs } from '../../knobs/quoteSection'
import { railPanelsSectionKnobs } from '../../knobs/railPanelsSection'
import { roleListSectionKnobs } from '../../knobs/roleListSection'
import { screenGridSectionKnobs, screenKnobs } from '../../knobs/screenGridSection'

/**
 * The first block whose design options are declared rather than written out
 * (ADR 0020). `variant`, `decoration` and `surface` live in
 * `src/knobs/heroSection.ts`; the strings in `fields` say where their
 * generated fields sit. Everything else here is editorial and stays
 * hand-written.
 */
export const heroSection = defineSectionBlock({
  name: 'heroSection',
  description:
    'The page’s opening claim — one or two headline lines, a subheading, one CTA. One per page, at the top: the tension → turn move lives here.',
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

/** `surface` is declared in `src/knobs/logoWallSection.ts` (ADR 0020). */
export const logoWallSection = defineSectionBlock({
  name: 'logoWallSection',
  description:
    'Proof by association — a heading and standfirst over one centred row of client marks.',
  title: 'Logo wall',
  knobs: logoWallSectionKnobs,
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

/** `surface` is declared in `src/knobs/caseShowcaseSection.ts` (ADR 0020). */
export const caseShowcaseSection = defineSectionBlock({
  name: 'caseShowcaseSection',
  description:
    'Proof by work — sticky-stacking case-study cards, each projecting its narrative headline and headline stat from the referenced document.',
  title: 'Case study showcase',
  knobs: caseShowcaseSectionKnobs,
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
  description:
    'An ordered set of offers or platforms — a labelled rail or a row of cards, one panel per item, each with its quieter “Best when…” note.',
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
              description: 'Rail layout only. A card draws its mark instead.',
            }),
            defineField({
              name: 'mark',
              type: 'mark',
              description:
                'Cards layout only — the circle the frame centres on the card. An orb unless set to disc.',
            }),
          ],
          preview: { select: { title: 'railLabel' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading' } },
})

/**
 * `decoration` and `surface` are declared in `src/knobs/quoteSection.ts`
 * (ADR 0020), including the `molecule` value and the frame it came from. This
 * block and `ctaSection` were the last two callers of `decorationField()`, so
 * the factory retired with them (#120).
 */
export const quoteSection = defineSectionBlock({
  name: 'quoteSection',
  description: 'One borrowed voice — a single quote and its attribution, given a whole band.',
  title: 'Quote',
  knobs: quoteSectionKnobs,
  fields: [
    defineField({ name: 'quote', type: 'text', rows: 4, validation: (rule) => rule.required() }),
    defineField({
      name: 'attribution',
      type: 'string',
      description: 'e.g. "Business Leader, Global Health Brand".',
    }),
    'decoration',
  ],
  preview: { select: { title: 'quote' } },
})

/**
 * `surface` is declared in `src/knobs/insightsCarouselSection.ts` (ADR 0020).
 * `category`'s gate stays a closure: it reads whether `insights` holds
 * anything, which no `showWhen` mode says, and an editorial field is allowed
 * one where a knob is not.
 */
export const insightsCarouselSection = defineSectionBlock({
  name: 'insightsCarouselSection',
  description:
    'The thinking behind the work — an insights carousel, hand-picked or auto-filled with the latest, optionally limited to one category.',
  title: 'Insights carousel',
  knobs: insightsCarouselSectionKnobs,
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

/**
 * `decoration` and `surface` are declared in `src/knobs/ctaSection.ts`
 * (ADR 0020).
 */
export const ctaSection = defineSectionBlock({
  name: 'ctaSection',
  description: 'The ask — a heading, up to two lines of body, one CTA. The band a page ends on.',
  title: 'CTA',
  knobs: ctaSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'body', type: 'text', rows: 2 }),
    defineField({ name: 'cta', type: 'cta' }),
    'decoration',
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
  description:
    'Capability as a set — disciplines on a grid, or exactly four of them on the orbital diagram.',
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
            defineField({
              name: 'mark',
              type: 'mark',
              description:
                'The dotted circle beside the row — an orb unless set to disc. Grid layout only; the orbital diagram places its own nodes.',
            }),
          ],
          preview: { select: { title: 'heading', subtitle: 'body' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'layout' } },
})

/** `surface` is declared in `src/knobs/personGridSection.ts` (ADR 0020). */
export const personGridSection = defineSectionBlock({
  name: 'personGridSection',
  description: 'People — a grid of referenced person documents, never re-typed bios.',
  title: 'Person grid',
  knobs: personGridSectionKnobs,
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

/** `surface` is declared in `src/knobs/roleListSection.ts` (ADR 0020). */
export const roleListSection = defineSectionBlock({
  name: 'roleListSection',
  description:
    'Open roles — inline rows, each with its Apply button. Content that turns over too fast to be documents.',
  title: 'Role list',
  knobs: roleListSectionKnobs,
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
            defineField({
              name: 'mark',
              type: 'mark',
              description: 'The circle at the head of the row — an orb unless set to disc.',
            }),
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
  description:
    'What we’re working on now — anonymous in-progress cards, or dated rows for appearances. Deliberately not case studies: nothing here has shipped.',
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
                'When it happens — the rows layout draws it as the red MON / DD marker. Leave empty and the row leads with its mark instead.',
            }),
            defineField({
              name: 'cta',
              type: 'cta',
              description:
                'Where the row goes. The label is never drawn — it names the arrow control for a screen reader.',
            }),
            defineField({
              name: 'mark',
              type: 'mark',
              description:
                'The circle a dateless row leads with — an orb unless set to disc. A row with a date draws the date marker instead.',
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
 * any handler. So they are content; the input that carries them is not — and
 * for the same reason they are **not a knob** (#120): an editor editing them is
 * authoring the form, not making a design decision on the canvas. `surface` is
 * the block's whole roster, declared in `src/knobs/formSection.ts`.
 *
 * ⚠️ **There is no submission handler and no destination.** #58's other two
 * halves are open, so the renderer disables its submit and says so on the
 * page. This block is honest scaffolding, not a working form.
 */
export const formSection = defineSectionBlock({
  name: 'formSection',
  description:
    'The inquiry band — the fixed contact form. The words around it are content; the field set is code and not authorable (ADR 0014).',
  title: 'Form',
  knobs: formSectionKnobs,
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

/**
 * `columns` and `surface` are declared in `src/knobs/layoutSection.ts`
 * (ADR 0020). `columns` is the repo's only number-valued knob: it declares
 * `valueType: 'number'`, which is what keeps the generated field `type:
 * 'number'` and `generated.ts` publishing `columns?: 1 | 2 | 3`.
 *
 * `items` is not a knob and is not one waiting to happen — it is the block's
 * content. The design options an editor might want on an individual item wait
 * on #122 (an array member as its own knob root).
 */
export const layoutSection = defineSectionBlock({
  name: 'layoutSection',
  description:
    'The general-purpose prose band — one to three columns of base blocks under an optional eyebrow / heading stack. Reach for it before proposing a new section block.',
  title: 'Layout section',
  knobs: layoutSectionKnobs,
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
    'columns',
    defineField({
      name: 'items',
      type: 'array',
      // Derived from `BLOCK_ARRAYS`, not restated — the same declaration the
      // canvas insert menu reads (#112). A base block registered but missing
      // from here is a block an editor cannot author, which is the state #58
      // spent three files finding out about. `mark` arrives through it, which
      // is why the column's picker says "Mark" rather than "Orb": a member
      // title here would be the one hand-kept fact in a derived list.
      of: blockArrayMembers('layoutSection.items').map((member) => defineArrayMember(member)),
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
  description:
    'A figure moment — one media band, full-bleed or contained. The case-study capture stage.',
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
 * Two design options per screen and no more. The frame's plates differ in
 * exactly two ways — the colour behind the screenshot (`tone`) and whether the
 * tile takes one column or both (`span`) — and everything else about a tile
 * (32px radius, the 12px-radius screenshot inside it, the crop) is composition
 * the renderer owns. Plate HEIGHT is deliberately not a field: `2230:7559`
 * draws 716 for a wide tile and 342 for a small one, so height follows `span`
 * (ADR 0006 — renderers decide).
 *
 * Both of those belong to the SCREEN rather than to the band, so they are
 * declared against the member and their fields come from `defineArrayItem` —
 * the first item-surface knobs in the repo (#118, ADR 0021). The block's own
 * roster is `surface` and nothing else, which is why its declaration looks
 * thin: the knobs an editor reaches for on this band are on the tiles.
 */
export const screenGridSection = defineSectionBlock({
  name: 'screenGridSection',
  description:
    'Tiled product screenshots on gradient plates — a two-column grid where a wide tile takes both columns.',
  title: 'Screen grid',
  knobs: screenGridSectionKnobs,
  fields: [
    defineField({
      name: 'screens',
      type: 'array',
      description: 'Tiles fill the two-column grid in order; a wide screen takes both columns.',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayItem({
          knobs: screenKnobs,
          fields: [
            defineField({ name: 'media', type: 'figure', validation: (rule) => rule.required() }),
            'tone',
            'span',
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

/**
 * `surface` is declared in `src/knobs/listingSection.ts` (ADR 0020).
 *
 * **`pageType` is a closed enum and deliberately not a knob** — it names a
 * content category, not a design option, so an editor changing it is choosing
 * what the band is about rather than how it looks (#120). It is the one
 * editorial closed set on a converted block, which means `knobGuard.test.ts`
 * has to be told about it by name; the reasoning is written down there and in
 * the knobs file rather than remembered.
 */
export const listingSection = defineSectionBlock({
  name: 'listingSection',
  description:
    'Pages of one type as cards, via their card fieldset. Currently reaches no rendered route (ADR 0013).',
  title: 'Listing',
  knobs: listingSectionKnobs,
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
