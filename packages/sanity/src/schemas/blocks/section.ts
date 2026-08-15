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
    'The page’s opening claim: one to three headline lines, a subheading, and a single call to action. Reach for it once, at the top — it is where the page states the tension it intends to turn. Lines animate in separately, so write them as beats rather than a sentence that happens to wrap.',
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
    defineField({ name: 'button', type: 'button' }),
    'decoration',
  ],
  preview: { select: { title: 'headlineLines.0' } },
})

/** `surface` is declared in `src/knobs/logoWallSection.ts` (ADR 0020). */
export const logoWallSection = defineSectionBlock({
  name: 'logoWallSection',
  description:
    'Proof by association — a heading and standfirst over a centred row of client marks. Reach for it when the argument needs borrowed credibility rather than explanation, early on a page that is about to ask for trust. The frame draws six in a row, but the row takes whatever it is given.',
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
    defineField({ name: 'button', type: 'button' }),
  ],
  preview: { select: { title: 'heading' } },
})

/** `surface` is declared in `src/knobs/caseShowcaseSection.ts` (ADR 0020). */
export const caseShowcaseSection = defineSectionBlock({
  name: 'caseShowcaseSection',
  description:
    'Proof by work — sticky-stacking cards for referenced case studies, each projecting that document’s narrative headline and headline stat. Reach for it when a claim needs evidence that actually shipped. There is nothing to write here: the band renders only what the referenced case studies already say.',
  title: 'Case study showcase',
  knobs: caseShowcaseSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string', initialValue: 'Our Work' }),
    defineField({ name: 'button', type: 'button' }),
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
    'An ordered set of parallel things — offers, platforms, ways of working — as a labelled rail or a row of cards. Reach for it when several options differ in kind rather than degree and each needs its own short pitch and a quieter “Best when…” line. Two panels minimum; a rail panel can carry a CTA and media, a card carries a mark and one line of body.',
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
            // `button` and `media` are rail-layout elements like the `rail` knob,
            // but a panel field's `hidden` callback sees only the panel it
            // sits in, not the section's `layout` — and a `showWhen` reads
            // block-relative paths for the same reason. So these two carry the
            // gate as prose where `rail` gets the declared one.
            defineField({
              name: 'button',
              type: 'button',
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
  description:
    'One borrowed voice, given a whole band. Reach for it to let someone outside the studio make the claim the page would sound boastful making itself. Quotes are inline rather than documents, so the same words used twice are two separate edits.',
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
    'Thinking, as a carousel of insights — hand-picked, or filled automatically with the most recent. Reach for it late on a page, where a reader who is now interested should be given somewhere further to go. Leave the list empty and it self-fills, optionally within one category, and stays current without anyone maintaining it.',
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
  description:
    'The ask: a heading, up to two lines of body, and one call to action. Reach for it to close a page, or to break a long one at the point a reader might reasonably act. One CTA — a band offering two next steps offers none.',
  title: 'CTA',
  knobs: ctaSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'body', type: 'text', rows: 2 }),
    defineField({ name: 'button', type: 'button' }),
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
    'Capability as a set — disciplines with a heading, body and mark, drawn as a grid or placed on the orbital diagram. Reach for it when the page needs to show the shape of what the studio does rather than argue a point. The orbital layout takes exactly four and derives each position from array order, the first being the apex.',
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
  description:
    'The people behind the work, as a grid. Reach for it when credibility rests on who is in the room. People are referenced rather than typed in, so a title fixed here is fixed everywhere that person appears.',
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
    'Open roles, as rows with their own Apply buttons. Reach for it on a page that is recruiting. Roles are authored inline and exist nowhere else, so there is no role page to link to and the list is only as current as someone keeps it.',
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
       * button is a `button`, and the frame draws no role detail page, no
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
            defineField({ name: 'button', type: 'button', description: 'The row’s Apply button.' }),
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
    'What the studio is working on now — anonymous in-progress cards, or dated rows for appearances and ideas. Reach for it when the job is showing current momentum rather than finished results; nothing here has shipped, which is why a card names no client. An entry with a date draws the date marker, one without draws its mark.',
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
              name: 'button',
              type: 'button',
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
 * The submit is an ordinary `button` instance, so it carries the same fields
 * and the same knob as a button in a hero or a nav — an instance is configured
 * by its component, and a form button that re-declared its own words would be
 * a second declaration of one (ADR 0023).
 *
 * ⚠️ **There is no submission handler and no destination.** #58's other two
 * halves are open, so the renderer disables its submit and says so on the
 * page. This block is honest scaffolding, not a working form.
 */
export const formSection = defineSectionBlock({
  name: 'formSection',
  description:
    'The inquiry band: the contact form, with the words around it editable and the input set fixed in code. Reach for it on a page whose purpose is to start a conversation. The reasons list is the only part of the form’s shape an editor owns — and no submission handler exists yet, so the renderer disables the submit and says so on the page.',
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
      name: 'button',
      type: 'button',
      description:
        'The submit. Leave its destination empty and it stays a control; give it one and it becomes a link like any other button. Disabled until #58 has a handler behind it.',
      // Optional, not required(): the renderer absorbs absence with the same
      // 'Send message' fallback, so a missing value costs nothing (skill rule:
      // fields the renderer can absorb stay optional).
      initialValue: { _type: 'button', label: 'Send message' },
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
    'The general-purpose prose band — one to three columns of base blocks under an optional eyebrow, heading and subheading. Reach for it whenever a page needs words, a figure, an embed or a stat group and no bespoke band is already doing that job. It is the block to try before concluding the design system is missing one.',
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
    'A figure given a whole band. Reach for it when an image or video carries the argument rather than decorating it. The plain variant is a contained or full-bleed figure; the capture variant is a tall dark stage that crops a long screenshot rather than fitting it.',
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
    'Product screenshots on gradient plates, tiled two to a row. Reach for it to show an interface actually existing, usually in more than one state. Each screen picks its plate tone and whether it spans one column or both; plate height follows the span and is not something to set.',
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
    'Pages of one type, listed as cards drawn from their card fieldset. It currently reaches no rendered route and lists a page type nothing uses, so a page being composed today should not reach for it.',
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
